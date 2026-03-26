import { apiFetch } from './client'
import type { ComponentId, ComponentNode } from '../../types/components'
import type { Theme } from '../../types/theme'
import { serializeComponentRecord } from '../../utils/componentTreePersistence'

export interface ProjectDetail {
  id: string
  name: string
  theme: Theme
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  id: string
  name: string
  pageCount: number
  createdAt: string
  updatedAt: string
}

export interface PageSummary {
  id: string
  projectId: string
  name: string
  slug: string
  order: number
  componentCount: number
}

export interface PageDetail {
  id: string
  projectId: string
  name: string
  slug: string
  components: unknown
  order: number
  createdAt: string
  updatedAt: string
}

export async function listProjects(params?: { limit?: number; offset?: number }) {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  const suffix = q.toString() ? `?${q}` : ''
  return apiFetch<{ data: ProjectSummary[]; total: number }>(`/api/v1/projects/${suffix}`)
}

export async function createProject(body: { name: string }) {
  return apiFetch<ProjectDetail>('/api/v1/projects/', { method: 'POST', json: body })
}

export async function getProject(projectId: string) {
  return apiFetch<ProjectDetail>(`/api/v1/projects/${projectId}`)
}

export async function updateProject(
  projectId: string,
  body: {
    name?: string
    theme?: Theme
    baseUpdatedAt?: string
  },
) {
  return apiFetch<ProjectDetail>(`/api/v1/projects/${projectId}`, {
    method: 'PUT',
    json: body,
  })
}

export async function listPages(projectId: string) {
  return apiFetch<{ data: PageSummary[] }>(`/api/v1/projects/${projectId}/pages/`)
}

export async function getPage(projectId: string, pageId: string) {
  return apiFetch<PageDetail>(`/api/v1/projects/${projectId}/pages/${pageId}`)
}

export async function createPage(projectId: string, body: { name: string; slug?: string }) {
  return apiFetch<PageDetail>(`/api/v1/projects/${projectId}/pages/`, {
    method: 'POST',
    json: body,
  })
}

export async function updatePage(
  projectId: string,
  pageId: string,
  body: {
    name?: string
    slug?: string
    components?: unknown
    order?: number
  },
) {
  return apiFetch<PageDetail>(`/api/v1/projects/${projectId}/pages/${pageId}`, {
    method: 'PUT',
    json: body,
  })
}

export async function deletePage(projectId: string, pageId: string) {
  await apiFetch(`/api/v1/projects/${projectId}/pages/${pageId}`, { method: 'DELETE' })
}

export async function duplicatePage(projectId: string, pageId: string, name?: string) {
  return apiFetch<PageDetail>(`/api/v1/projects/${projectId}/pages/${pageId}/duplicate`, {
    method: 'POST',
    json: name ? { name } : {},
  })
}

export async function persistCanvasToPage(
  projectId: string,
  pageId: string,
  components: Record<ComponentId, ComponentNode>,
) {
  return updatePage(projectId, pageId, {
    components: serializeComponentRecord(components),
  })
}
