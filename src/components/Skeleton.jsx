export function SkeletonCard() {
  return (
    <div className="card" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ aspectRatio: '2/3' }} />
      <div style={{ padding: '16px 24px 20px', display: 'grid', gap: 10 }}>
        <div className="skeleton" style={{ height: 14, width: '80%' }} />
        <div className="skeleton" style={{ height: 10, width: '50%' }} />
      </div>
    </div>
  )
}

export function SkeletonWide() {
  return <div className="skeleton" aria-hidden="true" style={{ aspectRatio: '16/9' }} />
}

export function SkeletonRow({ count = 8, wide = false }) {
  return (
    <div className={`row ${wide ? 'wide' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) =>
        wide ? <SkeletonWide key={i} /> : <SkeletonCard key={i} />,
      )}
    </div>
  )
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="movie-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}