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

export function InputView({
  c,
  style,
}: {
  c: Component
  style?: CSSProperties
}) {
  const placeholder =
    typeof c.props.placeholder === 'string' ? c.props.placeholder : ''
  const name = typeof c.props.name === 'string' ? c.props.name : ''
  const inputType = typeof c.props.inputType === 'string' ? c.props.inputType : 'text'
  return (
    <input
      data-node-id={c.id}
      style={style}
      className="w-full"
      placeholder={placeholder || undefined}
      name={name || undefined}
      type={inputType || 'text'}
      readOnly
    />
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

export function CardView({
  c,
  style,
  children,
}: {
  c: Component
  style?: CSSProperties
  children?: ReactNode
}) {
  const title = typeof c.props.title === 'string' ? c.props.title : ''
  return (
    <section data-node-id={c.id} style={style}>
      {title ? (
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
      ) : null}
      {children}
    </section>
  )
}

export function NavView({
  c,
  style,
  children,
}: {
  c: Component
  style?: CSSProperties
  children?: ReactNode
}) {
  const brand = typeof c.props.brand === 'string' ? c.props.brand : ''
  return (
    <nav data-node-id={c.id} style={style} aria-label={brand || undefined}>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">{brand}</div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </nav>
  )
}

export function ListView({
  c,
  style,
  children,
}: {
  c: Component
  style?: CSSProperties
  children?: ReactNode
}) {
  const ordered = Boolean(c.props.ordered)
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag data-node-id={c.id} style={style} className="list-inside">
      {children}
    </Tag>
  )
}

export function IconView({
  c,
  style,
}: {
  c: Component
  style?: CSSProperties
}) {
  const glyph = typeof c.props.glyph === 'string' ? c.props.glyph : '★'
  const ariaLabel = typeof c.props.ariaLabel === 'string' ? c.props.ariaLabel : ''
  return (
    <span
      data-node-id={c.id}
      style={style}
      aria-label={ariaLabel || undefined}
      role={ariaLabel ? 'img' : undefined}
    >
      {glyph}
    </span>
  )
}

export function DividerView({ c, style }: { c: Component; style?: CSSProperties }) {
  return <hr data-node-id={c.id} style={style} />
}

export function SpacerView({ c, style }: { c: Component; style?: CSSProperties }) {
  const height =
    typeof c.props.height === 'number'
      ? c.props.height
      : parseInt(String(c.props.height ?? ''), 10)
  const merged: CSSProperties = {
    ...(style ?? {}),
    height: Number.isFinite(height) && height > 0 ? `${height}px` : style?.height,
  }
  return <div data-node-id={c.id} style={merged} />
}

export function VideoView({ c, style }: { c: Component; style?: CSSProperties }) {
  const src = typeof c.props.src === 'string' ? c.props.src : ''
  const poster = typeof c.props.poster === 'string' ? c.props.poster : ''
  return (
    <video
      data-node-id={c.id}
      style={style}
      src={src || undefined}
      poster={poster || undefined}
      controls
    />
  )
}

export function CustomHtmlView({ c, style }: { c: Component; style?: CSSProperties }) {
  const html = typeof c.props.html === 'string' ? c.props.html : ''
  const ariaLabel = typeof c.props.ariaLabel === 'string' ? c.props.ariaLabel : ''
  return (
    <div
      data-node-id={c.id}
      style={style}
      aria-label={ariaLabel || undefined}
      dangerouslySetInnerHTML={{ __html: html || '<div></div>' }}
    />
  )
}
