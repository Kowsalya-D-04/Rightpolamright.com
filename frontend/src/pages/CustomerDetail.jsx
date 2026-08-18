import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { fmtDate, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { CheckCircle2, IndianRupee, Package, XCircle } from 'lucide-react'

export default function CustomerDetail() {
  const { id } = useParams()
  const [c, setC] = useState(null)
  const [loads, setLoads] = useState([])

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data }) => setC(data))
    api.get(`/customers/${id}/loads`).then(({ data }) => setLoads(data))
  }, [id])
  if (!c) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{c.name}</div>
          <div className="page-sub">{c.code} · {c.company}</div>
        </div>
        <div className="page-actions"><Link to="/customers" className="btn btn-outline">Back</Link></div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<Package size={19} />} label="Total Loads" value={c.total_loads} tone="blue" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Completed" value={c.completed_loads} tone="green" />
        <StatCard icon={<XCircle size={19} />} label="Cancelled" value={c.cancelled_loads} tone="red" />
        <StatCard icon={<IndianRupee size={19} />} label="Total Spent" value={money(c.total_spent)} tone="purple" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.7fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Profile</div><StatusBadge status={c.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Customer ID</span><span className="kv-val">{c.code}</span></div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{c.phone}</span></div>
            <div className="kv-row"><span className="kv-key">Email</span><span className="kv-val">{c.email}</span></div>
            <div className="kv-row"><span className="kv-key">City</span><span className="kv-val">{c.city}</span></div>
            <div className="kv-row"><span className="kv-key">GST</span><span className="kv-val">{c.gst_number}</span></div>
            <div className="kv-row"><span className="kv-key">Address</span><span className="kv-val">{c.address}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Recent loads</div></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Load ID</th><th>Route</th><th>Weight</th><th>Required</th><th>Fare</th><th>Status</th></tr></thead>
              <tbody>
                {loads.map((l) => (
                  <tr key={l.id}>
                    <td className="cell-strong"><Link to={`/load-requests/${l.id}`}>{l.code}</Link></td>
                    <td>{l.pickup_location} → {l.drop_location}</td>
                    <td className="cell-mono">{l.weight_ton} T</td>
                    <td className="cell-mono">{fmtDate(l.required_date)}</td>
                    <td className="cell-mono">{money(l.estimated_fare)}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
