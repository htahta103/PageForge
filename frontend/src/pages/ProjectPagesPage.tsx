import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useT } from '@/i18n/context'
import { createPage, listPages } from '@/lib/api/pages'
import { getProject } from '@/lib/api/projects'
import type { MessageKey } from '@/i18n/en'
import type { PageSummary, Project } from '@/types/api'

export function ProjectPagesPage() {
  const t = useT()
  const { projectId = '' } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [pages, setPages] = useState<PageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<MessageKey | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(false)
    try {
      const [p, pg] = await Promise.all([
        getProject(projectId),
        listPages(projectId),
      ])
      setProject(p)
      setPages(pg.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!projectId) return
    if (!name.trim()) {
      setNameError('pages.validation.nameRequired')
      return
    }
    setNameError(null)
    setCreating(true)
    try {
      await createPage(projectId, { name: name.trim() })
      setName('')
      await refresh()
    } catch {
      setError(true)
    } finally {
      setCreating(false)
    }
  }

  if (!projectId) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm">
            <Link className="text-blue-700 hover:underline" to="/projects">
              {t('nav.backToProjects')}
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            {project
              ? t('pages.projectPagesTitle', { name: project.name })
              : t('pages.title')}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">{t('pages.subtitle')}</p>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="rounded-xl border border-neutral-200 bg-white p-4"
        data-testid="pages-create-form"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1">
            <div className="text-xs font-medium text-neutral-600">
              {t('pages.nameLabel')}
            </div>
            <input
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              value={name}
              placeholder={t('pages.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              data-testid="pages-name-input"
            />
            {nameError && (
              <div className="text-xs text-red-600">{t(nameError)}</div>
            )}
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            data-testid="pages-create-button"
          >
            {creating ? t('pages.creating') : t('pages.create')}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-neutral-600">{t('editor.loading')}</div>
      ) : error ? (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div>{t('pages.loadError')}</div>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm ring-1 ring-red-200"
            onClick={() => void refresh()}
          >
            {t('common.retry')}
          </button>
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          {t('pages.empty')}
        </div>
      ) : (
        <div className="space-y-2" data-testid="pages-list">
          {pages.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div>
                <div className="font-semibold text-neutral-900">{p.name}</div>
                <div className="mt-1 text-xs text-neutral-500">{p.slug}</div>
              </div>
              <Link
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                to={`/projects/${projectId}/pages/${p.id}/edit`}
                data-testid={`pages-open-editor-${p.id}`}
              >
                {t('pages.openEditor')}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
