import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Clock, CreditCard, MapPin, Package, PlusCircle, Truck, Wallet,
} from 'lucide-react'
import api, { fmtDate, money } from '../../services/api'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

export default function CustomerDashboard() {
  const [data, setData] = useState(null)

  const load = () => api.get('/customer/dashboard').then(({ data }) => setData(data)).catch(() => {})
  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])
  if (!data) return <Loader label="Loading your dashboard…" />
  const { customer, stats, recent_loads } = data

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Hi, {customer.company || customer.name}</div>
          <div className="page-sub">Here's where your consignments stand today.</div>
        </div>
        <div className="page-actions">
          <Link to="/customer/book-load" className="btn btn-primary"><PlusCircle size={15} /> Book Load</Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<Truck size={19} />} label="Active Loads" value={stats.active_loads}
          foot="Assigned or moving" tone="blue" />
        <StatCard icon={<Clock size={19} />} label="Pending" value={stats.pending}
          foot="Awaiting a truck" tone="orange" />
        <StatCard icon={<MapPin size={19} />} label="In Transit" value={stats.in_transit}
          foot="On the road" tone="purple" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Delivered" value={stats.delivered}
          foot={`${stats.total_loads} total`} tone="green" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <StatCard icon={<CreditCard size={19} />} label="Total Payments" value={money(stats.total_paid)}
          foot="Settled to date" tone="green" />
        <StatCard icon={<Wallet size={19} />} label="Outstanding" value={money(stats.pending_payments)}
          foot="Awaiting payment" tone="orange" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="card-title">Quick Actions</div></div>
        <div className="card-body quick-actions">
          <Link to="/customer/book-load" className="quick-action">
            <span className="feature-icon"><PlusCircle size={19} /></span> Book Load</Link>
          <Link to="/customer/loads" className="quick-action">
            <span className="feature-icon"><Package size={19} /></span> My Loads</Link>
          <Link to="/customer/track" className="quick-action">
            <span className="feature-icon"><MapPin size={19} /></span> Track Load</Link>
          <Link to="/customer/payments" className="quick-action">
            <span className="feature-icon"><CreditCard size={19} /></span> Payments</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Recent Loads</div>
          <Link to="/customer/loads" className="btn-ghost" style={{ marginLeft: 'auto' }}>View all</Link>
        </div>
        {recent_loads.length === 0 ? (
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />}
            title="No loads yet" hint="Book your first consignment and it will show up here."
            action={<Link to="/customer/book-load" className="btn btn-primary">Book a load</Link>} />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Load ID</th><th>Pickup</th><th>Drop</th><th>Weight</th>
                <th>Status</th><th>Date</th><th>Assigned Truck</th><th>Driver</th><th></th></tr></thead>
              <tbody>
                {recent_loads.map((l) => (
                  <tr key={l.id}>
                    <td className="cell-strong">{l.code}</td>
                    <td>{l.pickup_location}</td>
                    <td>{l.drop_location}</td>
                    <td className="cell-mono">{l.weight_ton} T</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="cell-mono">{fmtDate(l.required_date)}</td>
                    <td>{l.truck_number || '—'}</td>
                    <td>{l.driver_name || '—'}</td>
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
