package service

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func TestParseComponents_ValidatesTypeAndID(t *testing.T) {
	t.Run("invalid json", func(t *testing.T) {
		_, err := parseComponents(json.RawMessage(`not-json`))
		if err == nil {
			t.Fatalf("expected error")
		}
	})

	t.Run("duplicate ids", func(t *testing.T) {
		raw := json.RawMessage(`[
			{"id":"11111111-1111-1111-1111-111111111111","type":"text","parentId":null,"children":[],"props":{},"styles":{"base":{}},"meta":{},"order":0},
			{"id":"11111111-1111-1111-1111-111111111111","type":"text","parentId":null,"children":[],"props":{},"styles":{"base":{}},"meta":{},"order":1}
		]`)
		_, err := parseComponents(raw)
		if err == nil {
			t.Fatalf("expected error")
		}
	})

	t.Run("invalid type", func(t *testing.T) {
		raw := json.RawMessage(`[
			{"id":"11111111-1111-1111-1111-111111111111","type":"nope","parentId":null,"children":[],"props":{},"styles":{"base":{}},"meta":{},"order":0}
		]`)
		_, err := parseComponents(raw)
		if err == nil {
			t.Fatalf("expected error")
		}
	})
}

func TestBuildComponentTree_OrdersChildrenFromChildrenField(t *testing.T) {
	parentID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	child1ID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	child2ID := "cccccccc-cccc-cccc-cccc-cccccccccccc"

	components := []model.ComponentJSON{
		{
			ID:       parentID,
			Type:     model.ComponentTypeContainer,
			ParentID: nil,
			Children: []string{child2ID, child1ID}, // explicit ordering
			Props:    map[string]any{},
			Styles:   model.ComponentStylesJSON{Base: map[string]any{}},
			Meta:     model.ComponentMetaJSON{Visible: ptrBool(true)},
			Order:    0,
		},
		{
			ID:       child1ID,
			Type:     model.ComponentTypeText,
			ParentID: &parentID,
			Props:    map[string]any{"text": "one"},
			Styles:   model.ComponentStylesJSON{Base: map[string]any{}},
			Meta:     model.ComponentMetaJSON{Visible: ptrBool(true)},
			Order:    1,
		},
		{
			ID:       child2ID,
			Type:     model.ComponentTypeText,
			ParentID: &parentID,
			Props:    map[string]any{"text": "two"},
			Styles:   model.ComponentStylesJSON{Base: map[string]any{}},
			Meta:     model.ComponentMetaJSON{Visible: ptrBool(true)},
			Order:    2,
		},
	}

	roots, err := buildComponentTree(components)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(roots) != 1 {
		t.Fatalf("expected 1 root, got %d", len(roots))
	}
	if len(roots[0].children) != 2 {
		t.Fatalf("expected 2 children, got %d", len(roots[0].children))
	}
	if roots[0].children[0].comp.ID != child2ID {
		t.Fatalf("expected first child to be %s, got %s", child2ID, roots[0].children[0].comp.ID)
	}
	if roots[0].children[1].comp.ID != child1ID {
		t.Fatalf("expected second child to be %s, got %s", child1ID, roots[0].children[1].comp.ID)
	}
}

func TestGenerateScopedCSS_ResponsiveAndCamelCase(t *testing.T) {
	visible := true
	parentID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	childID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

	components := []model.ComponentJSON{
		{
			ID:       parentID,
			Type:     model.ComponentTypeContainer,
			ParentID: nil,
			Children: []string{childID},
			Props:    map[string]any{},
			Styles: model.ComponentStylesJSON{
				Base:   map[string]any{"backgroundColor": "red"},
				Tablet: map[string]any{"display": "flex"},
				Mobile: map[string]any{"padding": "8px"},
			},
			Meta:  model.ComponentMetaJSON{Visible: &visible},
			Order: 0,
		},
		{
			ID:       childID,
			Type:     model.ComponentTypeText,
			ParentID: &parentID,
			Props:    map[string]any{"text": "hi"},
			Styles:   model.ComponentStylesJSON{Base: map[string]any{"color": "blue"}},
			Meta:     model.ComponentMetaJSON{Visible: ptrBool(false)}, // should be skipped
			Order:    1,
		},
	}

	css := generateScopedCSS(components)

	if !strings.Contains(css, `[data-pf-id="`+parentID+`"] {`) {
		t.Fatalf("expected base CSS for parent")
	}
	if !strings.Contains(css, "background-color: red;") {
		t.Fatalf("expected camelCase conversion for backgroundColor")
	}
	if !strings.Contains(css, "@media (max-width: 1279px)") || !strings.Contains(css, "display: flex;") {
		t.Fatalf("expected tablet media rule")
	}
	if !strings.Contains(css, "@media (max-width: 767px)") || !strings.Contains(css, "padding: 8px;") {
		t.Fatalf("expected mobile media rule")
	}
	if strings.Contains(css, `[data-pf-id="`+childID+`"]`) {
		t.Fatalf("expected hidden child component to be skipped from CSS")
	}
}

func TestRenderNodeHTML_EscapesText(t *testing.T) {
	id := "11111111-1111-1111-1111-111111111111"
	n := &componentNode{
		comp: model.ComponentJSON{
			ID:   id,
			Type: model.ComponentTypeText,
			Props: map[string]any{
				"text": "<script>alert(1)</script>",
			},
			Meta:   model.ComponentMetaJSON{Visible: ptrBool(true)},
			Styles: model.ComponentStylesJSON{},
		},
	}

	out := renderNodeHTML(n)
	if !strings.Contains(out, `data-pf-id="`+id+`"`) {
		t.Fatalf("expected data attribute")
	}
	if strings.Contains(out, "<script>") {
		t.Fatalf("expected script tag to be escaped")
	}
	if !strings.Contains(out, "&lt;script&gt;") {
		t.Fatalf("expected HTML-escaped output")
	}
}

func ptrBool(v bool) *bool { return &v }
