import { describe, expect, it, beforeEach } from 'vitest'
import { useEditorStore } from './store'

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.setState({ rootIds: [], components: {} })
  })

  it('adds a palette component to root when parent is null', () => {
    const id = useEditorStore.getState().addFromPalette('text', null)
    const state = useEditorStore.getState()

    expect(state.rootIds).toContain(id)
    expect(state.components[id]?.parentId).toBeNull()
    expect(state.components[id]?.type).toBe('text')
  })

  it('adds a palette component into a container when parent is container', () => {
    const containerId = useEditorStore.getState().addFromPalette('container', null)
    const childId = useEditorStore.getState().addFromPalette('button', containerId)
    const state = useEditorStore.getState()

    expect(state.components[containerId]?.type).toBe('container')
    expect(state.components[containerId]?.children).toContain(childId)
    expect(state.components[childId]?.parentId).toBe(containerId)
  })
})

