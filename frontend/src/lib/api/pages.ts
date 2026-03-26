import type { Page, PageSummary } from '@/types/api'
import { apiFetch } from './client'

export async function listPages(
  projectId: string,
): Promise<{ data: PageSummary[] }> {
  return apiFetch(`/projects/${projectId}/pages`)
}

export async function createPage(
  projectId: string,
  body: { name: string; slug?: string },
): Promise<Page> {
  return apiFetch(`/projects/${projectId}/pages`, {
    method: 'POST',
    json: body,
  })
}

export async function getPage(
  projectId: string,
  pageId: string,
): Promise<Page> {
  return apiFetch(`/projects/${projectId}/pages/${pageId}`)
}

export async function updatePage(
  projectId: string,
  pageId: string,
  body: {
    name?: string
    slug?: string
    components?: unknown[]
    order?: number
  },
): Promise<Page> {
  return apiFetch(`/projects/${projectId}/pages/${pageId}`, {
    method: 'PUT',
    json: body,
  })
}
