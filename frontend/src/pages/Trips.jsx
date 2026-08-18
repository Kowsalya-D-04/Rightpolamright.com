import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Route as RouteIcon } from 'lucide-react'
import api, { fmtDate, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Loader, { EmptyState } from '../components/Loader'

const STATUSES = ['All', 'Assigned', 'Pickup Reached', 'Loading', 'In Transit', 'Reached', 'Delivered', 'Cancelled']

export default function Trips() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('All')

  useEffect(() => {
    setRows(null)
    api.get('/trips', { params: { status: status === 'All' ? undefined : status } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }, [status])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Trips</div>
          <div className="page-sub">Every dispatched consignment and where it stands.</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="chip-row">
            {STATUSES.map((s) => (
              <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<RouteIcon size={30} color="var(--muted-light)" />} title="No trips in this state"
            hint="Assign a pending load to create a trip." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Trip ID</th><th>Load ID</th><th>Driver</th><th>Truck</th><th>Route</th>
                  <th>Fare</th><th>Status</th><th>Start Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-strong">{t.code}</td>
                    <td>{t.load_code}</td>
                    <td>{t.driver_name}<div className="cell-sub">{t.driver_phone}</div></td>
                    <td>{t.truck_number}</td>
                    <td>{t.pickup_location} → {t.drop_location}
                      <div className="cell-sub">{t.distance_km} km</div></td>
                    <td className="cell-mono">{money(t.offered_fare)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="cell-mono">{fmtDate(t.start_date)}</td>
                    <td><Link to={`/trips/${t.id}`} className="btn-ghost">View trip</Link></td>
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
