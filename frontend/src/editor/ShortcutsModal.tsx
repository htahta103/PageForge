import { useT } from '@/i18n/context'
import type { MessageKey } from '@/i18n/en'

type Row = { actionKey: MessageKey; shortcutLabel: string }

const ROWS: Row[] = [
  { actionKey: 'editor.shortcuts.row.delete', shortcutLabel: 'Del / Backspace' },
  { actionKey: 'editor.shortcuts.row.duplicate', shortcutLabel: '⌘/Ctrl+D' },
  { actionKey: 'editor.shortcuts.row.copy', shortcutLabel: '⌘/Ctrl+C' },
  { actionKey: 'editor.shortcuts.row.paste', shortcutLabel: '⌘/Ctrl+V' },
  { actionKey: 'editor.shortcuts.row.selectAll', shortcutLabel: '⌘/Ctrl+A' },
  { actionKey: 'editor.shortcuts.row.nudge', shortcutLabel: 'Arrow keys (Shift: 5×)' },
  { actionKey: 'editor.shortcuts.row.group', shortcutLabel: '⌘/Ctrl+G' },
  { actionKey: 'editor.shortcuts.row.deselect', shortcutLabel: 'Escape' },
  { actionKey: 'editor.shortcuts.row.cheatSheet', shortcutLabel: '⌘/Ctrl+/' },
]

export function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useT()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      onClick={() => onClose()}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 id="shortcuts-dialog-title" className="text-sm font-semibold">
            {t('editor.shortcuts.title')}
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
        <div className="overflow-auto p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                <th className="pb-2 pr-4 font-medium">{t('editor.shortcuts.colAction')}</th>
                <th className="pb-2 font-medium">{t('editor.shortcuts.colShortcut')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.actionKey} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 text-neutral-800">{t(row.actionKey)}</td>
                  <td className="py-2 font-mono text-xs text-neutral-600">{row.shortcutLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
