import { produce } from 'immer'
import { create } from 'zustand'
import type { ComponentNode, ComponentType } from './types'
import { componentRegistry } from './registry'

type EditorState = {
  rootIds: string[]
  components: Record<string, ComponentNode>

  addFromPalette: (type: ComponentType, parentId: string | null) => string
}

function newId(prefix: string) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)}`
}

export const useEditorStore = create<EditorState>((set) => ({
  rootIds: [],
  components: {},

  addFromPalette: (type, parentId) => {
    const id = newId(type)
    const registration = componentRegistry[type]

    set(
      produce<EditorState>((draft) => {
        const node: ComponentNode = {
          id,
          type,
          parentId,
          children: [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props: registration.defaultProps as any,
        }
        draft.components[id] = node

        if (parentId === null) {
          draft.rootIds.push(id)
          return
        }

        const parent = draft.components[parentId]
        if (!parent || parent.type !== 'container') {
          draft.rootIds.push(id)
          node.parentId = null
          return
        }

        parent.children.push(id)
      }),
    )

    return id
  },
}))

