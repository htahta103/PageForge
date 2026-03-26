export type ComponentType = 'text' | 'image' | 'button' | 'container'

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'

export type ContainerLayout = 'flex' | 'grid'

export type PropSchema =
  | {
      key: string
      label: string
      kind: 'string' | 'number' | 'boolean'
    }
  | {
      key: string
      label: string
      kind: 'select'
      options: { label: string; value: string }[]
    }

export type ComponentPropsByType = {
  text: { variant: TextVariant; text: string }
  image: { src: string; alt: string }
  button: { variant: ButtonVariant; label: string }
  container: { layout: ContainerLayout; gap: number; padding: number }
}

type BaseNode<TType extends ComponentType> = {
  id: string
  type: TType
  parentId: string | null
  children: string[]
  props: ComponentPropsByType[TType]
}

export type TextNode = BaseNode<'text'>
export type ImageNode = BaseNode<'image'>
export type ButtonNode = BaseNode<'button'>
export type ContainerNode = BaseNode<'container'>

export type ComponentNode = TextNode | ImageNode | ButtonNode | ContainerNode

