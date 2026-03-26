package model

// ComponentType enumerates all valid component types.
type ComponentType string

const (
	ComponentTypeText       ComponentType = "text"
	ComponentTypeImage      ComponentType = "image"
	ComponentTypeButton     ComponentType = "button"
	ComponentTypeContainer  ComponentType = "container"
	ComponentTypeInput      ComponentType = "input"
	ComponentTypeCard       ComponentType = "card"
	ComponentTypeNav        ComponentType = "nav"
	ComponentTypeList       ComponentType = "list"
	ComponentTypeIcon       ComponentType = "icon"
	ComponentTypeDivider    ComponentType = "divider"
	ComponentTypeSpacer     ComponentType = "spacer"
	ComponentTypeVideo      ComponentType = "video"
	ComponentTypeCustomHTML ComponentType = "custom-html"
)

var ValidComponentTypes = map[ComponentType]bool{
	ComponentTypeText:       true,
	ComponentTypeImage:      true,
	ComponentTypeButton:     true,
	ComponentTypeContainer:  true,
	ComponentTypeInput:      true,
	ComponentTypeCard:       true,
	ComponentTypeNav:        true,
	ComponentTypeList:       true,
	ComponentTypeIcon:       true,
	ComponentTypeDivider:    true,
	ComponentTypeSpacer:     true,
	ComponentTypeVideo:      true,
	ComponentTypeCustomHTML: true,
}
