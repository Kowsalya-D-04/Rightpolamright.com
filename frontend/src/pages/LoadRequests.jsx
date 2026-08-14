import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Package, Plus, Search } from 'lucide-react'
import api, { fmtDate, money, apiError } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader, { EmptyState } from '../components/Loader'

const STATUSES = ['All Status', 'Pending', 'Assigned', 'In Transit', 'Delivered', 'Cancelled']
const TRUCK_TYPES = ['Open Truck', 'Container', 'Trailer', 'Tipper', 'Tanker']
const LOAD_TYPES = ['General Goods', 'Fragile', 'Perishable', 'Machinery', 'Textiles', 'Cement']

export default function LoadRequests() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState(params.get('q') || '')
  const [status, setStatus] = useState('All Status')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: '', pickup_location: '', drop_location: '', load_type: 'General Goods',
    truck_type: 'Open Truck', weight_ton: '', required_date: '', required_time: '09:00',
    budget: '', special_instructions: '',
  })

  const load = (clear = false) => {
    if (clear) setRows(null)
    api.get('/load-requests', {
      params: { search: search || undefined, status: status === 'All Status' ? undefined : status },
    }).then(({ data }) => setRows(data)).catch(() => setRows([]))
  }

  useEffect(() => {
    const t = setTimeout(() => load(true), 350)
    return () => clearTimeout(t)
  }, [search, status])
  useEffect(() => {
    const timer = setInterval(() => load(false), 5000)
    const onFocus = () => load(false)
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [search, status])
  useEffect(() => { api.get('/customers').then(({ data }) => setCustomers(data)).catch(() => {}) }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id),
        weight_ton: Number(form.weight_ton),
        budget: form.budget ? Number(form.budget) : null,
        required_date: form.required_date || null,
      }
      const { data } = await api.post('/load-requests', payload)
      setShowNew(false)
      navigate(`/load-requests/${data.id}`)
    } catch (err) {
      setError(apiError(err, 'Could not save the load. Check the fields and try again.'))
    } finally { setSaving(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Load Requests</div>
          <div className="page-sub">Every consignment raised by your customers.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={15} /> New load</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} color="var(--muted)" />
            <input placeholder="Search by load ID, customer or route" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 168 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />} title="No loads match this filter"
            hint="Try a different status, or raise a new load request."
            action={<button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={15} /> New load</button>} />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Load ID</th><th>Customer</th><th>Pickup</th><th>Drop</th><th>Weight</th>
                  <th>Date</th><th>Truck Type</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="cell-strong">{l.code}
                      <div className="cell-sub">{money(l.estimated_fare)}</div></td>
                    <td>{l.customer_name}</td>
                    <td>{l.pickup_location}</td>
                    <td>{l.drop_location}
                      <div className="cell-sub">{l.distance_km ? `${l.distance_km} km` : ''}</div></td>
                    <td className="cell-mono">{l.weight_ton} T</td>
                    <td className="cell-mono">{fmtDate(l.required_date)}</td>
                    <td>{l.truck_type}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      <Link to={`/load-requests/${l.id}`} className="btn-ghost">View</Link>
                      {l.status === 'Pending' && l.workflow_status !== 'DRIVER_ACCEPTED' && (
                        <Link to={`/smart-load-matching/${l.id}`} className="btn-ghost">Match</Link>
                      )}
                      {l.workflow_status === 'DRIVER_ACCEPTED' && (
                        <Link to={`/load-requests/${l.id}/assignment`} className="btn-ghost"
                          style={{ color: 'var(--green)', fontWeight: 700 }}>Confirm</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="New load request" onClose={() => setShowNew(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save load'}
            </button>
          </>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label className="label">Customer</label>
            <select className="select" value={form.customer_id} onChange={set('customer_id')}>
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.company}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label className="label">Pickup location</label>
              <input className="input" value={form.pickup_location} onChange={set('pickup_location')} placeholder="Chennai" />
            </div>
            <div className="field">
              <label className="label">Drop location</label>
              <input className="input" value={form.drop_location} onChange={set('drop_location')} placeholder="Bangalore" />
            </div>
            <div className="field">
              <label className="label">Load type</label>
              <select className="select" value={form.load_type} onChange={set('load_type')}>
                {LOAD_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Truck type</label>
              <select className="select" value={form.truck_type} onChange={set('truck_type')}>
                {TRUCK_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Weight (tons)</label>
              <input className="input" type="number" step="0.5" value={form.weight_ton}
                onChange={set('weight_ton')} placeholder="10" />
            </div>
            <div className="field">
              <label className="label">Budget (optional)</label>
              <input className="input" type="number" value={form.budget} onChange={set('budget')} placeholder="30000" />
            </div>
            <div className="field">
              <label className="label">Required date</label>
              <input className="input" type="date" value={form.required_date} onChange={set('required_date')} />
            </div>
            <div className="field">
              <label className="label">Required time</label>
              <input className="input" type="time" value={form.required_time} onChange={set('required_time')} />
            </div>
          </div>
          <div className="field">
            <label className="label">Special instructions</label>
            <textarea className="textarea" value={form.special_instructions}
              onChange={set('special_instructions')} placeholder="Call the site supervisor before pickup." />
          </div>
        </Modal>
      )}
    </div>
  )
}
