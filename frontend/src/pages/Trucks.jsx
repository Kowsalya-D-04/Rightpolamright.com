import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Truck } from 'lucide-react'
import api, { fmtDate, apiError } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader, { EmptyState } from '../components/Loader'

const TYPES = ['All', 'Open Truck', 'Container', 'Trailer', 'Tipper', 'Tanker']
const BLANK = { truck_number: '', truck_type: 'Open Truck', model: '', capacity_ton: '',
  owner_name: '', chassis_number: '', engine_number: '', insurance_expiry: '',
  status: 'Available', driver_id: '' }

export default function Trucks() {
  const [rows, setRows] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setRows(null)
    api.get('/trucks', { params: { search: search || undefined, truck_type: type === 'All' ? undefined : type } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }
  useEffect(() => { load() }, [type])
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [search])
  useEffect(() => { api.get('/drivers').then(({ data }) => setDrivers(data)) }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setError(''); setBusy(true)
    try {
      await api.post('/trucks', { ...form, capacity_ton: Number(form.capacity_ton),
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        insurance_expiry: form.insurance_expiry || null })
      setShow(false); setForm(BLANK); load()
    } catch (err) {
      setError(apiError(err, 'Could not save the truck.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Trucks</div>
          <div className="page-sub">Fleet register with capacity, ownership and compliance dates.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShow(true)}><Plus size={15} /> Add truck</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} color="var(--muted)" />
            <input placeholder="Search by truck number, model or owner" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="chip-row">
            {TYPES.map((t) => (
              <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Truck size={30} color="var(--muted-light)" />} title="No trucks found" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Truck Number</th><th>Truck Type</th><th>Capacity</th><th>Owner</th>
                <th>Driver</th><th>Status</th><th>Insurance Expiry</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-strong">{t.truck_number}<div className="cell-sub">{t.model}</div></td>
                    <td>{t.truck_type}</td>
                    <td className="cell-mono">{t.capacity_ton} Ton</td>
                    <td>{t.owner_name}</td>
                    <td>{t.driver_name || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="cell-mono">{fmtDate(t.insurance_expiry)}</td>
                    <td><Link to={`/trucks/${t.id}`} className="btn-ghost">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show && (
        <Modal title="Add truck" onClose={() => setShow(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}
              disabled={busy || !form.truck_number || !form.capacity_ton}>
              {busy ? 'Saving…' : 'Save truck'}</button>
          </>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid grid-2">
            <div className="field"><label className="label">Truck number</label>
              <input className="input" value={form.truck_number} onChange={set('truck_number')} placeholder="TN01AB1234" /></div>
            <div className="field"><label className="label">Truck type</label>
              <select className="select" value={form.truck_type} onChange={set('truck_type')}>
                {TYPES.slice(1).map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label className="label">Model</label>
              <input className="input" value={form.model} onChange={set('model')} placeholder="Ashok Leyland 16 Feet" /></div>
            <div className="field"><label className="label">Capacity (tons)</label>
              <input className="input" type="number" step="0.5" value={form.capacity_ton} onChange={set('capacity_ton')} /></div>
            <div className="field"><label className="label">Owner</label>
              <input className="input" value={form.owner_name} onChange={set('owner_name')} /></div>
            <div className="field"><label className="label">Assigned driver</label>
              <select className="select" value={form.driver_id} onChange={set('driver_id')}>
                <option value="">Unassigned</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}</select></div>
            <div className="field"><label className="label">Chassis number</label>
              <input className="input" value={form.chassis_number} onChange={set('chassis_number')} /></div>
            <div className="field"><label className="label">Engine number</label>
              <input className="input" value={form.engine_number} onChange={set('engine_number')} /></div>
            <div className="field"><label className="label">Insurance expiry</label>
              <input className="input" type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} /></div>
            <div className="field"><label className="label">Status</label>
              <select className="select" value={form.status} onChange={set('status')}>
                {['Available', 'Busy', 'Maintenance', 'Inactive'].map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
