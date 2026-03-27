import { useEffect } from 'react'

import type { MessageKey } from '@/i18n/en'
import { useEditorStore } from '@/store/editorStore'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function mod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string

export function useEditorKeyboard(
  t: TFn,
  shortcutsOpen: boolean,
  setShortcutsOpen: (open: boolean) => void,
) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) {
        return
      }

      if (shortcutsOpen) {
        if (e.key === 'Escape' || (mod(e) && e.key === '/')) {
          e.preventDefault()
          setShortcutsOpen(false)
        }
        return
      }

      const store = useEditorStore.getState()
      const step = e.shiftKey ? 40 : 8

      if (e.key === 'Escape') {
        e.preventDefault()
        store.clearSelection()
        return
      }

      if (mod(e) && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }

      if (mod(e) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        store.selectAllOnCanvas()
        return
      }

      if (mod(e) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        store.copySelectionToInternalClipboard()
        return
      }

      if (mod(e) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        store.pasteFromInternalClipboard()
        return
      }

      if (mod(e) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        store.duplicateSelection()
        return
      }

      if (mod(e) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        store.groupSelection(t('editor.group.defaultName'))
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        store.deleteSelected()
        return
      }

      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        e.preventDefault()
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        store.nudgeSelected(dx, dy)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcutsOpen, setShortcutsOpen, t])
}
