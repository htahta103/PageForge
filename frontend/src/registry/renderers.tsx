import type { Component } from '@/types/api'
import type { CSSProperties, ReactNode } from 'react'

export function TextView({
  c,
  style,
}: {
  c: Component
  style?: CSSProperties
}) {
  const text = typeof c.props.text === 'string' ? c.props.text : 'Text'
  return (
    <p data-node-id={c.id} style={style} className="m-0">
      {text}
    </p>
  )
}

export function ButtonView({
  c,
  style,
}: {
  c: Component
  style?: CSSProperties
}) {
  const label = typeof c.props.label === 'string' ? c.props.label : 'Button'
  return (
    <button
      data-node-id={c.id}
      type="button"
      style={style}
      className="cursor-pointer"
    >
      {label}
    </button>
  )
}

export function ImageView({
  c,
  style,
}: {
  c: Component
  style?: CSSProperties
}) {
  const src = typeof c.props.src === 'string' ? c.props.src : ''
  const alt = typeof c.props.alt === 'string' ? c.props.alt : ''
  return (
    <img
      data-node-id={c.id}
      src={src || undefined}
      alt={alt}
      style={style}
      className="max-w-full"
    />
  )
}

export function ContainerView({
  c,
  style,
  children,
}: {
  c: Component
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div data-node-id={c.id} style={style} className="min-h-[40px]">
      {children}
    </div>
  )
}
