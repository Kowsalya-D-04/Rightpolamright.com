export default function StatCard({ icon, label, value, foot, tone = 'blue' }) {
  const tones = {
    blue: ['var(--blue-soft)', 'var(--blue)'],
    green: ['var(--green-soft)', 'var(--green)'],
    orange: ['var(--orange-soft)', 'var(--orange)'],
    red: ['var(--red-soft)', 'var(--red)'],
    purple: ['var(--purple-soft)', 'var(--purple)'],
  }
  const [bg, fg] = tones[tone] || tones.blue
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color: fg }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {foot && <div className="stat-foot">{foot}</div>}
      </div>
    </div>
  )
}
