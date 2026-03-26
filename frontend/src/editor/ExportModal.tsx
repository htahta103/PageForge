import { useT } from '@/i18n/context'

export function ExportModal({
  open,
  title,
  content,
  onClose,
}: {
  open: boolean
  title: string
  content: string
  onClose: () => void
}) {
  const t = useT()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 id="export-dialog-title" className="text-sm font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
        <textarea
          readOnly
          className="min-h-[320px] flex-1 p-3 font-mono text-xs"
          value={content}
        />
      </div>
    </div>
  )
}
