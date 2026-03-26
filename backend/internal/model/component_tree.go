package model

// ComponentJSON matches the frontend component-tree payload shape stored in
// pages.components (JSONB). The backend uses this to build an exportable tree.
//
// Note: visible/locked have defaults in the frontend; we model them as pointers
// here so the export layer can default visible=true when the field is absent.
type ComponentJSON struct {
	ID       string              `json:"id"`
	Type     ComponentType       `json:"type"`
	ParentID *string             `json:"parentId,omitempty"`
	Children []string            `json:"children,omitempty"`
	Props    map[string]any      `json:"props,omitempty"`
	Styles   ComponentStylesJSON `json:"styles"`
	Meta     ComponentMetaJSON   `json:"meta"`
	Order    int                 `json:"order"`
}

type ComponentStylesJSON struct {
	Base   map[string]any `json:"base,omitempty"`
	Tablet map[string]any `json:"tablet,omitempty"`
	Mobile map[string]any `json:"mobile,omitempty"`
}

type ComponentMetaJSON struct {
	Name    string `json:"name,omitempty"`
	Locked  *bool  `json:"locked,omitempty"`
	Visible *bool  `json:"visible,omitempty"`
}
