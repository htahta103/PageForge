import type React from 'react'

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return <div className={['pf-skeleton', className].join(' ')} {...props} />
}

