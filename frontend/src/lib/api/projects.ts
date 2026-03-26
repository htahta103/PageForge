import type { Project, ProjectSummary } from '@/types/api'
import { apiFetch } from './client'

export async function listProjects(): Promise<{
  data: ProjectSummary[]
  total: number
}> {
  return apiFetch('/projects')
}

export async function createProject(body: {
  name: string
  theme?: Project['theme']
}): Promise<Project> {
  return apiFetch('/projects', { method: 'POST', json: body })
}

export async function getProject(projectId: string): Promise<Project> {
  return apiFetch(`/projects/${projectId}`)
}
