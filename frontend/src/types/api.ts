export type ComponentType =
  | 'text'
  | 'image'
  | 'button'
  | 'container'
  | 'input'
  | 'card'
  | 'nav'
  | 'list'
  | 'repeater'
  | 'icon'
  | 'divider'
  | 'spacer'
  | 'video'
  | 'custom-html'

export type CSSProps = Record<string, string>

export interface ComponentStyles {
  base: CSSProps
  tablet?: CSSProps
  mobile?: CSSProps
}

export interface ComponentMeta {
  name: string
  locked: boolean
  visible: boolean
}

export interface Component {
  id: string
  type: ComponentType
  parentId?: string
  children: string[]
  props: Record<string, unknown>
  styles: ComponentStyles
  meta: ComponentMeta
  order: number
}

export interface Theme {
  colors: Record<string, string>
  fonts: { heading: string; body: string }
  spacing: number
}

export interface ProjectSummary {
  id: string
  name: string
  pageCount: number
  createdAt: string
  updatedAt: string
}

export interface Project extends Omit<ProjectSummary, 'pageCount'> {
  theme: Theme
}

export interface PageSummary {
  id: string
  projectId: string
  name: string
  slug: string
  order: number
  componentCount: number
}

export interface Page {
  id: string
  projectId: string
  name: string
  slug: string
  components: Component[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface ApiErrorBody {
  code: string
  message: string
}

export interface ExportResult {
  format: 'html' | 'react'
  files: { path: string; content: string }[]
}
