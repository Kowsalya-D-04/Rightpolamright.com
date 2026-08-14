import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Clock, IndianRupee, Package, Truck as TruckIcon, TrendingUp, Wallet,
} from 'lucide-react'
import api, { fmtDate, money } from '../services/api'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import MapView from '../components/MapView'
import Loader from '../components/Loader'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [markers, setMarkers] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/live-operations'),
      api.get('/dashboard/recent-loads'),
    ]).then(([s, m, r]) => {
      setSummary(s.data)
      setMarkers(m.data.markers)
      setRecent(r.data)
    }).catch(() => {})
  }, [])

  if (!summary) return <Loader label="Loading dashboard…" />
  const { loads, revenue, fleet } = summary

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Live picture of loads, fleet and collections.</div>
        </div>
        <div className="page-actions">
          <Link to="/load-requests" className="btn btn-outline"><Package size={15} /> All loads</Link>
          <Link to="/smart-load-matching" className="btn btn-primary"><TruckIcon size={15} /> Match a load</Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<Package size={19} />} label="Total Loads" value={loads.total}
          foot={`${loads.assigned} assigned`} tone="blue" />
        <StatCard icon={<Clock size={19} />} label="Pending" value={loads.pending}
          foot="Awaiting a truck" tone="orange" />
        <StatCard icon={<TruckIcon size={19} />} label="In Transit" value={loads.in_transit}
          foot={`${fleet.active_trips} active trips`} tone="purple" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Delivered" value={loads.delivered}
          foot={`${loads.cancelled} cancelled`} tone="green" />
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <StatCard icon={<IndianRupee size={19} />} label="Today's Revenue" value={money(revenue.today)}
          foot="Collected today" tone="green" />
        <StatCard icon={<Wallet size={19} />} label="Pending Payments" value={money(revenue.pending)}
          foot="Awaiting settlement" tone="orange" />
        <StatCard icon={<TrendingUp size={19} />} label="Completed Payments" value={money(revenue.completed)}
          foot="Lifetime collected" tone="blue" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Live Operations</div>
          <span className="badge badge-green" style={{ marginLeft: 8 }}>
            {fleet.available_trucks} trucks free
          </span>
          <span className="badge badge-blue">{fleet.online_drivers} drivers online</span>
          <Link to="/trips" className="btn-ghost" style={{ marginLeft: 'auto' }}>View trips</Link>
        </div>
        <div style={{ padding: 14 }}>
          <MapView markers={markers} height={330} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Recent Load Requests</div>
          <Link to="/load-requests" className="btn-ghost" style={{ marginLeft: 'auto' }}>View all</Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Load ID</th><th>Route</th><th>Weight</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id}>
                  <td className="cell-strong">{l.code}<div className="cell-sub">{l.customer_name}</div></td>
                  <td>{l.route}</td>
                  <td className="cell-mono">{l.weight_ton} T</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="cell-mono">{fmtDate(l.required_date)}</td>
                  <td><Link to={`/load-requests/${l.id}`} className="btn-ghost">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
