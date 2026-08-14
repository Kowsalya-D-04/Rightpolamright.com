import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, IndianRupee, TrendingUp, Wallet } from 'lucide-react'
import api, { fmtDate, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import Loader, { EmptyState } from '../components/Loader'

const STATUSES = ['All', 'Paid', 'Pending', 'Failed', 'Refunded']

export default function Payments() {
  const [rows, setRows] = useState(null)
  const [summary, setSummary] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [status, setStatus] = useState('All')

  const load = () => {
    setRows(null)
    api.get('/payments', { params: { status: status === 'All' ? undefined : status } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
    api.get('/payments/summary').then(({ data }) => setSummary(data))
    api.get('/invoices').then(({ data }) => setInvoices(data))
  }
  useEffect(() => { load() }, [status])

  const markPaid = async (p) => {
    await api.put(`/payments/${p.id}/status`, { status: 'Paid', payment_mode: p.payment_mode })
    load()
  }

  const invoiceFor = (tripCode) => invoices.find((i) => i.trip_code === tripCode)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Payments & Invoices</div>
          <div className="page-sub">Collections against delivered trips.</div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <StatCard icon={<IndianRupee size={19} />} label="Today's Collection" value={money(summary.today_collection)} tone="green" />
          <StatCard icon={<Wallet size={19} />} label="Pending" value={money(summary.pending)} tone="orange" />
          <StatCard icon={<TrendingUp size={19} />} label="This Month" value={money(summary.this_month)} tone="blue" />
          <StatCard icon={<CreditCard size={19} />} label="Total Revenue" value={money(summary.total_revenue)} tone="purple" />
        </div>
      )}

      <div className="card">
        <div className="filter-bar">
          <div className="chip-row">
            {STATUSES.map((s) => (
              <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<CreditCard size={30} color="var(--muted-light)" />} title="No payments here yet" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Payment ID</th><th>Trip ID</th><th>Customer</th><th>Amount</th>
                <th>Status</th><th>Payment Mode</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const inv = invoiceFor(p.trip_code)
                  return (
                    <tr key={p.id}>
                      <td className="cell-strong">{p.code}</td>
                      <td>{p.trip_code || '—'}</td>
                      <td>{p.customer_name}</td>
                      <td className="cell-mono">{money(p.amount)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{p.payment_mode}</td>
                      <td className="cell-mono">{fmtDate(p.created_at)}</td>
                      <td>
                        {inv && <Link to={`/invoices/${inv.id}`} className="btn-ghost">View invoice</Link>}
                        {p.status !== 'Paid' && (
                          <button className="btn-ghost" style={{ color: 'var(--green)' }}
                            onClick={() => markPaid(p)}>Mark paid</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
