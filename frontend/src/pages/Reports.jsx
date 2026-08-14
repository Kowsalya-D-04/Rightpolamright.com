import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CheckCircle2, Download, IndianRupee, Package, XCircle } from 'lucide-react'
import api, { money } from '../services/api'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'

const PERIODS = [['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['year', 'This Year']]
const COLORS = ['#EA580C', '#2563EB', '#7C3AED', '#16A34A', '#DC2626']

export default function Reports() {
  const [period, setPeriod] = useState('year')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [summary, setSummary] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [daily, setDaily] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    const params = period === 'custom' ? { period, ...custom } : { period }
    api.get('/reports/summary', { params }).then(({ data }) => setSummary(data))
  }, [period, custom])

  useEffect(() => {
    api.get('/reports/revenue').then(({ data }) => setRevenue(data.monthly))
    api.get('/reports/daily-loads').then(({ data }) => setDaily(data.daily))
    api.get('/reports/top-routes').then(({ data }) => setRoutes(data.routes))
    api.get('/reports/top-drivers').then(({ data }) => setDrivers(data.drivers))
  }, [])

  const exportCsv = () => {
    if (!summary) return
    const rows = [['Metric', 'Value'],
      ['Total loads', summary.total_loads], ['Completed', summary.completed],
      ['Cancelled', summary.cancelled], ['Total revenue', summary.total_revenue],
      ...summary.loads_by_status.map((s) => [s.status, s.count])]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `rpr-report-${period}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!summary) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-sub">Volume, revenue and fleet performance.</div>
        </div>
        <div className="page-actions">
          <div className="chip-row">
            {PERIODS.map(([k, label]) => (
              <button key={k} className={`chip ${period === k ? 'active' : ''}`} onClick={() => setPeriod(k)}>{label}</button>
            ))}
            <button className={`chip ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>Custom</button>
          </div>
          <button className="btn btn-outline" onClick={exportCsv}><Download size={15} /> Export</button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="card" style={{ marginBottom: 16, padding: 13, display: 'flex', gap: 11, alignItems: 'center' }}>
          <input className="input" style={{ width: 180 }} type="date" value={custom.start}
            onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))} />
          <span style={{ color: 'var(--muted)' }}>to</span>
          <input className="input" style={{ width: 180 }} type="date" value={custom.end}
            onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))} />
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<Package size={19} />} label="Total Loads" value={summary.total_loads} tone="blue" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Completed" value={summary.completed} tone="green" />
        <StatCard icon={<XCircle size={19} />} label="Cancelled" value={summary.cancelled} tone="red" />
        <StatCard icon={<IndianRupee size={19} />} label="Total Revenue" value={money(summary.total_revenue)} tone="purple" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Revenue Overview</div></div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5}
                  dot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Loads by Status</div></div>
          <div className="card-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.loads_by_status} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" outerRadius={86} label isAnimationActive={false}>
                  {summary.loads_by_status.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Daily Loads</div></div>
          <div className="card-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="loads" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Top Routes</div></div>
          <div className="card-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routes} layout="vertical" margin={{ left: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="route" width={155} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="loads" fill="#16A34A" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Top Drivers</div></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Driver</th><th>Completed Trips</th><th>Rating</th></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.name}>
                  <td className="cell-strong">{d.name}</td>
                  <td className="cell-mono">{d.trips}</td>
                  <td className="cell-mono">{d.rating} ★</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
