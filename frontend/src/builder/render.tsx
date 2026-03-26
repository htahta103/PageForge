import type { ComponentNode } from './types'
import type { CSSProperties } from 'react'
import type React from 'react'

function textClasses(variant: string) {
  switch (variant) {
    case 'h1':
      return 'text-4xl font-bold'
    case 'h2':
      return 'text-3xl font-bold'
    case 'h3':
      return 'text-2xl font-semibold'
    case 'h4':
      return 'text-xl font-semibold'
    case 'h5':
      return 'text-lg font-semibold'
    case 'h6':
      return 'text-base font-semibold'
    default:
      return 'text-base'
  }
}

export function renderNode(
  node: ComponentNode,
  children: React.ReactNode,
): React.ReactNode {
  switch (node.type) {
    case 'text': {
      const Tag =
        node.props.variant === 'p'
          ? 'p'
          : (node.props.variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
      return (
        <Tag className={`text-neutral-900 ${textClasses(node.props.variant)}`}>
          {node.props.text}
        </Tag>
      )
    }
    case 'image':
      return (
        <img
          src={node.props.src}
          alt={node.props.alt}
          className="max-w-full h-auto rounded-md border border-neutral-200 bg-white"
        />
      )
    case 'button': {
      const base =
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
      const variantClasses: Record<string, string> = {
        primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
        secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50',
        ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100',
        link: 'bg-transparent text-blue-700 hover:underline px-0 py-0',
      }
      return (
        <button className={`${base} ${variantClasses[node.props.variant] ?? variantClasses.primary}`}>
          {node.props.label}
        </button>
      )
    }
    case 'container': {
      const style: CSSProperties = {
        gap: node.props.gap,
        padding: node.props.padding,
      }
      const className =
        node.props.layout === 'grid'
          ? 'grid grid-cols-2'
          : 'flex flex-col'
      return (
        <div
          className={`${className} min-h-10 rounded-lg border border-dashed border-neutral-300 bg-white`}
          style={style}
        >
          {children}
        </div>
      )
    }
    default:
      return null
  }
}

