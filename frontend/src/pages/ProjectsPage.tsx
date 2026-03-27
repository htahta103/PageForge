import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useT } from '@/i18n/context'
import { listProjects, createProject } from '@/lib/api/projects'
import type { MessageKey } from '@/i18n/en'
import type { ProjectSummary } from '@/types/api'
import { Skeleton } from '@/components/Skeleton'

export function ProjectsPage() {
  const t = useT()
  const [items, setItems] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<MessageKey | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await listProjects()
      const data = (res as unknown as { data?: unknown }).data
      if (!Array.isArray(data)) {
        setError(true)
        setItems([])
        return
      }
      setItems(data as ProjectSummary[])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('projects.validation.nameRequired')
      return
    }
    setNameError(null)
    setCreating(true)
    try {
      const p = await createProject({ name: name.trim() })
      setName('')
      await refresh()
      // Navigate could be done — keep on list
      void p
    } catch {
      setError(true)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t('projects.title')}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">{t('projects.subtitle')}</p>
      </div>

      <form
        onSubmit={onCreate}
        className="glass-panel p-4"
        data-testid="projects-create-form"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1">
            <div className="text-xs font-medium text-neutral-600">
              {t('projects.nameLabel')}
            </div>
            <input
              className="interactive-control w-full rounded-md border border-neutral-200/80 bg-white/80 px-3 py-2 text-sm"
              value={name}
              placeholder={t('projects.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              data-testid="projects-name-input"
            />
            {nameError && (
              <div className="text-xs text-red-600">{t(nameError)}</div>
            )}
          </label>
          <button
            type="submit"
            disabled={creating}
            className="interactive-control rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            data-testid="projects-create-button"
          >
            {creating ? t('projects.creating') : t('projects.create')}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div>{t('projects.loadError')}</div>
          <button
            type="button"
            className="interactive-control rounded-md bg-white px-3 py-1.5 text-sm ring-1 ring-red-200"
            onClick={() => void refresh()}
          >
            {t('common.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-6 text-sm text-neutral-600">
          {t('projects.empty')}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          data-testid="projects-list"
        >
          {items.map((p) => (
            <div
              key={p.id}
              className="glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-neutral-900">{p.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {t('projects.pageCount', { count: p.pageCount })}
                  </div>
                </div>
                <Link
                  className="interactive-control rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                  to={`/projects/${p.id}`}
                  data-testid={`projects-open-${p.id}`}
                >
                  {t('projects.open')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
