import type { ExportResult } from '@/types/api'
import { getApiBaseUrl } from './config'

export function getExportJsonUrl(
  projectId: string,
  pageId: string,
  format: 'html' | 'react',
): string {
  const base = getApiBaseUrl()
  const p = `/projects/${projectId}/pages/${pageId}/export?format=${format}`
  return `${base}${p}`
}

export async function exportPage(
  projectId: string,
  pageId: string,
  format: 'html' | 'react',
): Promise<ExportResult> {
  const url = getExportJsonUrl(projectId, pageId, format)
  const res = await fetch(url)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) throw new Error('export_failed')
  return body as ExportResult
}
