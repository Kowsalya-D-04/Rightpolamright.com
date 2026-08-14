export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <div style={{ marginTop: 12, fontSize: 13 }}>{label}</div>
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="empty">
      {icon}
      <div className="empty-title">{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
