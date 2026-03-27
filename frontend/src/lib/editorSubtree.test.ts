import { describe, expect, it } from 'vitest'

import type { Component } from '@/types/api'

import { cloneWithNewIds, extractSubtrees, topLevelSelection } from '@/lib/editorSubtree'

function node(
  id: string,
  partial: Partial<Component> & Pick<Component, 'type' | 'order'>,
): Component {
  return {
    id,
    children: partial.children ?? [],
    parentId: partial.parentId,
    props: partial.props ?? {},
    styles: partial.styles ?? { base: {} },
    meta: partial.meta ?? { name: id, locked: false, visible: true },
    type: partial.type,
    order: partial.order,
  }
}

describe('topLevelSelection', () => {
  it('drops descendants when ancestor is also selected', () => {
    const map: Record<string, Component> = {
      a: node('a', { type: 'container', order: 0, children: ['b'] }),
      b: node('b', { type: 'text', order: 0, parentId: 'a' }),
    }
    expect(topLevelSelection(map, ['a', 'b'])).toEqual(['a'])
  })
})

describe('cloneWithNewIds', () => {
  it('remaps ids and parent pointers', () => {
    const map: Record<string, Component> = {
      r: node('r', { type: 'container', order: 0, children: ['c'] }),
      c: node('c', { type: 'text', order: 0, parentId: 'r' }),
    }
    const frag = extractSubtrees(map, ['r'])
    const { map: next, roots } = cloneWithNewIds(frag, ['r'])
    expect(roots).toHaveLength(1)
    const nr = roots[0]!
    expect(nr).not.toBe('r')
    expect(next[nr]?.children).toHaveLength(1)
    const nc = next[nr]!.children[0]!
    expect(nc).not.toBe('c')
    expect(next[nc]?.parentId).toBe(nr)
  })
})
