import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Route } from 'lucide-react'
import api, { fmtDate, money } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

const TABS = ['All', 'In Transit', 'Delivered', 'Cancelled']

export default function MyTrips() {
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    const refresh = (clear = false) => {
      if (clear) setRows(null)
      api.get('/driver/trips', { params: { status: tab === 'All' ? undefined : tab } })
        .then(({ data }) => setRows(data)).catch(() => setRows([]))
    }
    refresh(true)
    const timer = setInterval(() => refresh(false), 5000)
    const onFocus = () => refresh(false)
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [tab])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">My Trips</div>
          <div className="page-sub">Everything you've carried, past and present.</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="chip-row">
            {TABS.map((t) => (
              <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'In Transit' ? 'Active' : t}
              </button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Route size={30} color="var(--muted-light)" />} title="No trips here"
            hint="Accept a load to start your first trip."
            action={<Link to="/driver/available-loads" className="btn btn-primary">Available loads</Link>} />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Trip ID</th><th>Load</th><th>Route</th><th>Weight</th>
                <th>Customer</th><th>Fare</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-strong">{t.code}</td>
                    <td>{t.load_code}</td>
                    <td>{t.pickup_location} → {t.drop_location}
                      <div className="cell-sub">{t.distance_km} km</div></td>
                    <td className="cell-mono">{t.weight_ton} T</td>
                    <td>{t.customer_name}</td>
                    <td className="cell-mono">{money(t.offered_fare)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="cell-mono">{fmtDate(t.start_date)}</td>
                    <td><Link to={`/driver/trips/${t.id}`} className="btn-ghost">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
