import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useT } from '@/i18n/context'
import { listProjects, createProject } from '@/lib/api/projects'
import type { MessageKey } from '@/i18n/en'
import type { ProjectSummary } from '@/types/api'

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
      setItems(res.data)
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
        className="rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1">
            <div className="text-xs font-medium text-neutral-600">
              {t('projects.nameLabel')}
            </div>
            <input
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              value={name}
              placeholder={t('projects.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && (
              <div className="text-xs text-red-600">{t(nameError)}</div>
            )}
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {creating ? t('projects.creating') : t('projects.create')}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-neutral-600">{t('editor.loading')}</div>
      ) : error ? (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div>{t('projects.loadError')}</div>
          <button
            type="button"
            className="rounded-md bg-white px-3 py-1.5 text-sm ring-1 ring-red-200"
            onClick={() => void refresh()}
          >
            {t('common.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          {t('projects.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-neutral-900">{p.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {t('projects.pageCount', { count: p.pageCount })}
                  </div>
                </div>
                <Link
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                  to={`/projects/${p.id}`}
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
