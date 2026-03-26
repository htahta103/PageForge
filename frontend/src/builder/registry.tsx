import type { ReactNode } from 'react'
import type {
  ButtonVariant,
  ComponentType,
  ComponentPropsByType,
  ContainerLayout,
  PropSchema,
  TextVariant,
} from './types'

export type ComponentRegistration<TType extends ComponentType = ComponentType> = {
  type: TType
  label: string
  icon: ReactNode
  defaultProps: ComponentPropsByType[TType]
  schema: PropSchema[]
  canHaveChildren: boolean
}

export const componentRegistry: Record<ComponentType, ComponentRegistration> = {
  text: {
    type: 'text',
    label: 'Text',
    icon: 'T',
    defaultProps: {
      variant: 'p' satisfies TextVariant,
      text: 'Text',
    },
    schema: [
      {
        key: 'variant',
        label: 'Variant',
        kind: 'select',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
          { label: 'H5', value: 'h5' },
          { label: 'H6', value: 'h6' },
          { label: 'Paragraph', value: 'p' },
        ],
      },
      { key: 'text', label: 'Text', kind: 'string' },
    ],
    canHaveChildren: false,
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    defaultProps: {
      src: 'https://placehold.co/640x360/png?text=Image',
      alt: 'Image',
    },
    schema: [
      { key: 'src', label: 'Source URL', kind: 'string' },
      { key: 'alt', label: 'Alt text', kind: 'string' },
    ],
    canHaveChildren: false,
  },
  button: {
    type: 'button',
    label: 'Button',
    icon: '▭',
    defaultProps: {
      variant: 'primary' satisfies ButtonVariant,
      label: 'Button',
    },
    schema: [
      {
        key: 'variant',
        label: 'Variant',
        kind: 'select',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Ghost', value: 'ghost' },
          { label: 'Link', value: 'link' },
        ],
      },
      { key: 'label', label: 'Label', kind: 'string' },
    ],
    canHaveChildren: false,
  },
  container: {
    type: 'container',
    label: 'Container',
    icon: '▦',
    defaultProps: {
      layout: 'flex' satisfies ContainerLayout,
      gap: 12,
      padding: 16,
    },
    schema: [
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { label: 'Flex', value: 'flex' },
          { label: 'Grid', value: 'grid' },
        ],
      },
      { key: 'gap', label: 'Gap', kind: 'number' },
      { key: 'padding', label: 'Padding', kind: 'number' },
    ],
    canHaveChildren: true,
  },
}

export const paletteOrder: ComponentType[] = ['text', 'image', 'button', 'container']

