import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PlusCircle } from 'lucide-react'
import api, { fmtDate, money } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

const TABS = ['All', 'Pending', 'Assigned', 'In Transit', 'Delivered', 'Cancelled']

export default function MyLoads() {
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    const refresh = (clear = false) => {
      if (clear) setRows(null)
      api.get('/customer/loads', { params: { status: tab === 'All' ? undefined : tab } })
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
          <div className="page-title">My Loads</div>
          <div className="page-sub">Every consignment you've booked.</div>
        </div>
        <div className="page-actions">
          <Link to="/customer/book-load" className="btn btn-primary"><PlusCircle size={15} /> Book Load</Link>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="chip-row">
            {TABS.map((t) => (
              <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />}
            title="Nothing here yet" hint="Loads you book will appear in this list."
            action={<Link to="/customer/book-load" className="btn btn-primary">Book a load</Link>} />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Load ID</th><th>Route</th><th>Weight</th><th>Truck Type</th>
                <th>Required</th><th>Fare</th><th>Driver / Truck</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="cell-strong">{l.code}
                      <div className="cell-sub">{fmtDate(l.created_at)}</div></td>
                    <td>{l.pickup_location} → {l.drop_location}
                      <div className="cell-sub">{l.distance_km} km</div></td>
                    <td className="cell-mono">{l.weight_ton} T</td>
                    <td>{l.truck_type}</td>
                    <td className="cell-mono">{fmtDate(l.required_date)}</td>
                    <td className="cell-mono">{money(l.estimated_fare)}</td>
                    <td>{l.driver_name ? <>{l.driver_name}
                      <div className="cell-sub">{l.truck_number}</div></> : '—'}</td>
                    <td><StatusBadge status={l.workflow?.label || l.workflow_status || l.status} />
                      <div className="cell-sub">{l.status}</div></td>
                    <td><Link to={`/customer/track?load=${l.id}`} className="btn-ghost">Track</Link></td>
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
