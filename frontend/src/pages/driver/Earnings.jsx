import { useEffect, useState } from 'react'
import { CheckCircle2, IndianRupee, TrendingUp, Wallet } from 'lucide-react'
import api, { fmtDate, money } from '../../services/api'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

export default function Earnings() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/driver/earnings').then(({ data }) => setData(data)) }, [])
  if (!data) return <Loader />
  const s = data.summary

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Earnings</div>
          <div className="page-sub">What you've earned and what's still to come in.</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<IndianRupee size={19} />} label="Today" value={money(s.today)} tone="green" />
        <StatCard icon={<TrendingUp size={19} />} label="This Month" value={money(s.this_month)} tone="blue" />
        <StatCard icon={<Wallet size={19} />} label="Pending" value={money(s.pending)} tone="orange" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Total Earned" value={money(s.total_earned)}
          foot={`${s.completed_trips} trips`} tone="purple" />
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Trip earnings</div></div>
        {data.entries.length === 0 ? (
          <EmptyState icon={<Wallet size={30} color="var(--muted-light)" />}
            title="No earnings yet" hint="Complete a trip and it will show up here." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Payment ID</th><th>Trip</th><th>Route</th><th>Amount</th>
                <th>Mode</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="cell-strong">{e.code}</td>
                    <td>{e.trip_code}</td>
                    <td>{e.route}</td>
                    <td className="cell-mono">{money(e.amount)}</td>
                    <td>{e.payment_mode}</td>
                    <td className="cell-mono">{fmtDate(e.created_at)}</td>
                    <td><StatusBadge status={e.status} /></td>
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
