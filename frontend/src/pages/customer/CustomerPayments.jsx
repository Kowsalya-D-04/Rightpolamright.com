import { useEffect, useState } from 'react'
import { CreditCard, IndianRupee, Wallet } from 'lucide-react'
import api, { fmtDate, money } from '../../services/api'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

export default function CustomerPayments() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/customer/payments').then(({ data }) => setData(data)) }, [])
  if (!data) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-sub">Invoices raised against your consignments.</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <StatCard icon={<IndianRupee size={19} />} label="Total Amount" value={money(data.summary.total)} tone="blue" />
        <StatCard icon={<CreditCard size={19} />} label="Paid" value={money(data.summary.paid)} tone="green" />
        <StatCard icon={<Wallet size={19} />} label="Pending" value={money(data.summary.pending)} tone="orange" />
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Payment history</div></div>
        {data.payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={30} color="var(--muted-light)" />}
            title="No payments yet" hint="Invoices appear once a trip is delivered." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Payment ID</th><th>Trip</th><th>Route</th><th>Amount</th>
                <th>Mode</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-strong">{p.code}</td>
                    <td>{p.trip_code || '—'}</td>
                    <td>{p.route || '—'}</td>
                    <td className="cell-mono">{money(p.amount)}</td>
                    <td>{p.payment_mode}</td>
                    <td className="cell-mono">{fmtDate(p.created_at)}</td>
                    <td><StatusBadge status={p.status} /></td>
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
