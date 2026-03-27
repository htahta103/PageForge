export function Skeleton({
  className = '',
}: {
  className?: string
}) {
  return <div className={['skeleton-block', className].join(' ')} aria-hidden="true" />
}
