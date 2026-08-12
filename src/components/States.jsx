export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="state">
      {icon && <div className="state-icon">{icon}</div>}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, hint, onRetry }) {
  return (
    <div className="state" role="alert">
      <div className="state-icon" aria-hidden="true">!</div>
      <h3>Something went wrong</h3>
      <p>{message || 'We could not load this content.'}</p>
      {hint && <p className="muted" style={{ fontSize: 13 }}>{hint}</p>}
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}