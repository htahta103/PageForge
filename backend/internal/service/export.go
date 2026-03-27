package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/htahta103/PageForge/backend/internal/model"
)

type componentNode struct {
	comp     model.ComponentJSON
	children []*componentNode
}

func (s *Service) ExportPage(ctx context.Context, projectID, pageID uuid.UUID, format model.ExportFormat) (*model.ExportResult, error) {
	page, err := s.repo.GetPage(ctx, projectID, pageID)
	if err != nil {
		return nil, err
	}

	components, err := parseComponents(page.Components)
	if err != nil {
		return nil, err
	}

	roots, err := buildComponentTree(components)
	if err != nil {
		return nil, err
	}

	css := generateScopedCSS(components)
	switch format {
	case model.ExportFormatHTML:
		bodyHTML := renderNodesHTML(roots)
		htmlDoc := renderHTMLDocument(bodyHTML)
		return &model.ExportResult{
			Format: string(format),
			Files: []model.ExportFile{
				{Path: "index.html", Content: htmlDoc},
				{Path: "styles.css", Content: css},
			},
		}, nil
	case model.ExportFormatReact:
		bodyHTML := renderNodesHTML(roots)
		indexTSX := renderReactIndexTSX(bodyHTML)
		return &model.ExportResult{
			Format: string(format),
			Files: []model.ExportFile{
				{Path: "index.tsx", Content: indexTSX},
				{Path: "styles.css", Content: css},
			},
		}, nil
	default:
		return nil, &model.ValidationError{Field: "format", Message: "must be one of: html, react"}
	}
}

func (s *Service) ExportPageZip(ctx context.Context, projectID, pageID uuid.UUID, format model.ExportFormat) ([]byte, error) {
	res, err := s.ExportPage(ctx, projectID, pageID, format)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, f := range res.Files {
		w, err := zw.Create(f.Path)
		if err != nil {
			return nil, err
		}
		if _, err := w.Write([]byte(f.Content)); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func parseComponents(raw json.RawMessage) ([]model.ComponentJSON, error) {
	if len(raw) == 0 {
		return []model.ComponentJSON{}, nil
	}

	var components []model.ComponentJSON
	if err := json.Unmarshal(raw, &components); err != nil {
		return nil, &model.ValidationError{Field: "components", Message: "invalid component tree JSON"}
	}

	ids := make(map[string]struct{}, len(components))
	for i, c := range components {
		if c.ID == "" {
			return nil, &model.ValidationError{Field: "components", Message: fmt.Sprintf("component[%d].id is required", i)}
		}
		if _, ok := ids[c.ID]; ok {
			return nil, &model.ValidationError{Field: "components", Message: fmt.Sprintf("duplicate component id %q", c.ID)}
		}
		ids[c.ID] = struct{}{}

		if !model.ValidComponentTypes[c.Type] {
			return nil, &model.ValidationError{Field: "components", Message: fmt.Sprintf("invalid component type %q", c.Type)}
		}
	}

	return components, nil
}

func buildComponentTree(components []model.ComponentJSON) ([]*componentNode, error) {
	byID := make(map[string]model.ComponentJSON, len(components))
	for _, c := range components {
		byID[c.ID] = c
	}

	var rootIDs []string
	for _, c := range components {
		if c.ParentID == nil {
			rootIDs = append(rootIDs, c.ID)
		}
	}

	sort.Slice(rootIDs, func(i, j int) bool {
		ci := byID[rootIDs[i]]
		cj := byID[rootIDs[j]]
		if ci.Order != cj.Order {
			return ci.Order < cj.Order
		}
		return ci.ID < cj.ID
	})

	memo := make(map[string]*componentNode, len(components))
	visiting := make(map[string]bool, len(components))
	var buildNode func(string) (*componentNode, error)

	buildNode = func(id string) (*componentNode, error) {
		if n, ok := memo[id]; ok {
			return n, nil
		}
		if visiting[id] {
			return nil, &model.ValidationError{Field: "components", Message: "component tree contains a cycle"}
		}
		c, ok := byID[id]
		if !ok {
			return nil, &model.ValidationError{Field: "components", Message: fmt.Sprintf("unknown parent/child component id %q", id)}
		}

		visiting[id] = true
		n := &componentNode{comp: c}

		childIDs := orderedChildIDs(c, byID)
		for _, childID := range childIDs {
			if _, ok := byID[childID]; !ok {
				continue
			}
			child, err := buildNode(childID)
			if err != nil {
				return nil, err
			}
			n.children = append(n.children, child)
		}

		visiting[id] = false
		memo[id] = n
		return n, nil
	}

	var roots []*componentNode
	for _, id := range rootIDs {
		n, err := buildNode(id)
		if err != nil {
			return nil, err
		}
		roots = append(roots, n)
	}
	return roots, nil
}

func orderedChildIDs(parent model.ComponentJSON, byID map[string]model.ComponentJSON) []string {
	// If the parent explicitly provides ordered children, trust that ordering.
	if len(parent.Children) > 0 {
		// Filter out obvious nils/unknowns later in buildNode.
		out := make([]string, 0, len(parent.Children))
		for _, id := range parent.Children {
			if _, ok := byID[id]; ok {
				out = append(out, id)
			}
		}
		return out
	}

	// Fallback: infer from parentId and sort by order.
	var ids []string
	for _, c := range byID {
		if c.ParentID != nil && *c.ParentID == parent.ID {
			ids = append(ids, c.ID)
		}
	}
	sort.Slice(ids, func(i, j int) bool {
		ci := byID[ids[i]]
		cj := byID[ids[j]]
		if ci.Order != cj.Order {
			return ci.Order < cj.Order
		}
		return ci.ID < cj.ID
	})
	return ids
}

func generateScopedCSS(components []model.ComponentJSON) string {
	var b strings.Builder

	// Base rules and responsive overrides are emitted with stable ordering.
	// This keeps output deterministic for tests and easier diffing.
	ids := make([]string, 0, len(components))
	byID := make(map[string]model.ComponentJSON, len(components))
	for _, c := range components {
		ids = append(ids, c.ID)
		byID[c.ID] = c
	}
	sort.Strings(ids)

	var mediaTablet strings.Builder
	var mediaMobile strings.Builder
	for _, id := range ids {
		c := byID[id]
		visible := true
		if c.Meta.Visible != nil {
			visible = *c.Meta.Visible
		}
		if !visible {
			continue
		}

		// Base
		if len(c.Styles.Base) > 0 {
			b.WriteString(cssRuleForComponent(id, c.Styles.Base))
		}
		// Tablet
		if len(c.Styles.Tablet) > 0 {
			mediaTablet.WriteString(cssRuleForComponent(id, c.Styles.Tablet))
		}
		// Mobile
		if len(c.Styles.Mobile) > 0 {
			mediaMobile.WriteString(cssRuleForComponent(id, c.Styles.Mobile))
		}
	}

	if mediaTablet.Len() > 0 {
		b.WriteString("@media (max-width: 1279px) {\n")
		b.WriteString(mediaTablet.String())
		b.WriteString("}\n")
	}
	if mediaMobile.Len() > 0 {
		b.WriteString("@media (max-width: 767px) {\n")
		b.WriteString(mediaMobile.String())
		b.WriteString("}\n")
	}

	return b.String()
}

func cssRuleForComponent(id string, styles map[string]any) string {
	// Sort keys for deterministic output.
	keys := make([]string, 0, len(styles))
	for k := range styles {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var b strings.Builder
	b.WriteString(fmt.Sprintf("[data-pf-id=%q] {", id))
	for _, k := range keys {
		v := styles[k]
		prop := cssPropName(k)
		b.WriteString(fmt.Sprintf("%s: %s;", prop, cssValue(v)))
	}
	b.WriteString("}\n")
	return b.String()
}

func cssPropName(key string) string {
	// If already kebab-case, keep it.
	if strings.Contains(key, "-") {
		return key
	}
	// Convert camelCase to kebab-case: backgroundColor -> background-color
	var b strings.Builder
	for i, r := range key {
		if r >= 'A' && r <= 'Z' {
			if i > 0 {
				b.WriteByte('-')
			}
			b.WriteRune(r + ('a' - 'A'))
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func cssValue(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case json.Number:
		return t.String()
	default:
		return fmt.Sprint(t)
	}
}

func renderNodesHTML(roots []*componentNode) string {
	var b strings.Builder
	for _, n := range roots {
		b.WriteString(renderNodeHTML(n))
	}
	return b.String()
}

func renderHTMLDocument(bodyHTML string) string {
	// Keep it minimal: output the generated CSS plus markup.
	// Consumers can embed it or serve it as a standalone file.
	var b strings.Builder
	b.WriteString("<!doctype html>\n")
	b.WriteString("<html>\n")
	b.WriteString("<head>\n")
	b.WriteString("  <meta charset=\"utf-8\" />\n")
	b.WriteString("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n")
	b.WriteString("  <link rel=\"stylesheet\" href=\"./styles.css\" />\n")
	b.WriteString("</head>\n")
	b.WriteString("<body>\n")
	b.WriteString(bodyHTML)
	b.WriteString("\n</body>\n")
	b.WriteString("</html>\n")
	return b.String()
}

func renderNodeHTML(n *componentNode) string {
	visible := true
	if n.comp.Meta.Visible != nil {
		visible = *n.comp.Meta.Visible
	}
	if !visible {
		return ""
	}

	idAttr := fmt.Sprintf(`data-pf-id=%q`, n.comp.ID)

	switch n.comp.Type {
	case model.ComponentTypeText:
		txt := propString(n.comp.Props, "text", "value", "content")
		return fmt.Sprintf("<div %s>%s</div>", idAttr, html.EscapeString(txt))
	case model.ComponentTypeImage:
		src := propString(n.comp.Props, "src", "url")
		alt := propString(n.comp.Props, "alt", "name")
		// Note: export does not attempt to preload or size images.
		return fmt.Sprintf(`<img %s src=%q alt=%q />`, idAttr, src, alt)
	case model.ComponentTypeButton:
		label := propString(n.comp.Props, "text", "label", "value")
		return fmt.Sprintf(`<button %s type="button">%s</button>`, idAttr, html.EscapeString(label))
	case model.ComponentTypeContainer, model.ComponentTypeCard:
		tag := "div"
		var b strings.Builder
		b.WriteString(fmt.Sprintf("<%s %s>", tag, idAttr))
		for _, c := range n.children {
			b.WriteString(renderNodeHTML(c))
		}
		b.WriteString(fmt.Sprintf("</%s>", tag))
		return b.String()
	case model.ComponentTypeInput:
		placeholder := propString(n.comp.Props, "placeholder")
		value := propString(n.comp.Props, "value")
		// Export uses the placeholder/value as best-effort; consumers can rehydrate semantics.
		if placeholder != "" {
			return fmt.Sprintf(`<input %s placeholder=%q value=%q />`, idAttr, placeholder, value)
		}
		return fmt.Sprintf(`<input %s value=%q />`, idAttr, value)
	case model.ComponentTypeNav:
		var b strings.Builder
		b.WriteString(fmt.Sprintf("<nav %s>", idAttr))
		for _, c := range n.children {
			b.WriteString(renderNodeHTML(c))
		}
		b.WriteString("</nav>")
		return b.String()
	case model.ComponentTypeList:
		var b strings.Builder
		b.WriteString(fmt.Sprintf("<ul %s>", idAttr))
		for _, c := range n.children {
			liHTML := renderNodeHTML(c)
			b.WriteString("<li>")
			b.WriteString(liHTML)
			b.WriteString("</li>")
		}
		b.WriteString("</ul>")
		return b.String()
	case model.ComponentTypeRepeater:
		template := propString(n.comp.Props, "template")
		if template == "" {
			template = "<div>{{item}}</div>"
		}
		rows := parseRepeaterData(propString(n.comp.Props, "sampleData"))
		var b strings.Builder
		b.WriteString(fmt.Sprintf("<div %s>", idAttr))
		for _, row := range rows {
			b.WriteString(applyItemBindings(template, row))
		}
		b.WriteString("</div>")
		return b.String()
	case model.ComponentTypeIcon:
		name := propString(n.comp.Props, "name", "icon", "value")
		return fmt.Sprintf(`<span %s>%s</span>`, idAttr, html.EscapeString(name))
	case model.ComponentTypeDivider:
		return fmt.Sprintf(`<hr %s />`, idAttr)
	case model.ComponentTypeSpacer:
		return fmt.Sprintf(`<div %s></div>`, idAttr)
	case model.ComponentTypeVideo:
		src := propString(n.comp.Props, "src", "url")
		return fmt.Sprintf(`<video %s controls src=%q></video>`, idAttr, src)
	case model.ComponentTypeCustomHTML:
		// Custom HTML is treated as trusted export input; consumers are responsible for sanitization.
		raw := propString(n.comp.Props, "html", "content")
		return fmt.Sprintf(`<div %s>%s</div>`, idAttr, raw)
	default:
		// Should not happen due to validation, but keep export robust.
		return fmt.Sprintf(`<div %s></div>`, idAttr)
	}
}

func renderReactIndexTSX(bodyHTML string) string {
	// Use a quoted JS string literal to avoid template literal escaping issues.
	// This keeps the export robust even when the HTML contains backticks.
	escaped := strconv.Quote(bodyHTML)
	return fmt.Sprintf(`import React from "react";
import "./styles.css";

const PageExport: React.FC = () => {
  return <div dangerouslySetInnerHTML={{ __html: %s }} />;
};

export default PageExport;
`, escaped)
}

func propString(props map[string]any, keys ...string) string {
	for _, k := range keys {
		if props == nil {
			return ""
		}
		if v, ok := props[k]; ok {
			switch t := v.(type) {
			case string:
				return t
			case nil:
				return ""
			default:
				return fmt.Sprint(t)
			}
		}
	}
	return ""
}

var itemBindingRe = regexp.MustCompile(`\{\{\s*item(?:\.([a-zA-Z0-9_.]+))?\s*\}\}`)

func parseRepeaterData(raw string) []any {
	if strings.TrimSpace(raw) == "" {
		return []any{}
	}
	var out []any
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return []any{}
	}
	return out
}

func applyItemBindings(template string, item any) string {
	return itemBindingRe.ReplaceAllStringFunc(template, func(match string) string {
		sub := itemBindingRe.FindStringSubmatch(match)
		path := ""
		if len(sub) > 1 {
			path = sub[1]
		}
		v := valueAtPath(item, path)
		if v == nil {
			return ""
		}
		return html.EscapeString(fmt.Sprint(v))
	})
}

func valueAtPath(value any, path string) any {
	if strings.TrimSpace(path) == "" {
		return value
	}
	current := value
	for _, part := range strings.Split(path, ".") {
		obj, ok := current.(map[string]any)
		if !ok {
			return ""
		}
		current = obj[part]
	}
	return current
}
