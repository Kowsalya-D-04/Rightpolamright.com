import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Star, Users } from 'lucide-react'
import api, { apiError } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader, { EmptyState } from '../components/Loader'

const STATUSES = ['All', 'Online', 'Busy', 'Offline', 'Suspended']
const BLANK = { name: '', phone: '', email: '', license_number: '', license_expiry: '',
  current_location: '', status: 'Online', kyc_status: 'Verified', rating: 4.5 }

export default function Drivers() {
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setRows(null)
    api.get('/drivers', { params: { search: search || undefined, status: status === 'All' ? undefined : status } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }
  useEffect(() => { load() }, [status])
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [search])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setError(''); setBusy(true)
    try {
      await api.post('/drivers', { ...form, rating: Number(form.rating) || 4.5,
        license_expiry: form.license_expiry || null })
      setShow(false); setForm(BLANK); load()
    } catch (err) {
      setError(apiError(err, 'Could not save the driver.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Drivers</div>
          <div className="page-sub">Your driver roster, availability and KYC state.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShow(true)}><Plus size={15} /> Add driver</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} color="var(--muted)" />
            <input placeholder="Search by name, phone or licence" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="chip-row">
            {STATUSES.map((s) => (
              <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Users size={30} color="var(--muted-light)" />} title="No drivers found" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Driver ID</th><th>Name</th><th>Phone</th><th>License Number</th>
                <th>Location</th><th>Status</th><th>KYC</th><th>Rating</th><th>Trips</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-strong">{d.code}</td>
                    <td>{d.name}</td>
                    <td className="cell-mono">{d.phone}</td>
                    <td className="cell-mono">{d.license_number}</td>
                    <td>{d.current_location}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td><StatusBadge status={d.kyc_status} /></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} color="var(--orange)" fill="var(--orange)" />{d.rating}</span></td>
                    <td className="cell-mono">{d.total_trips}</td>
                    <td><Link to={`/drivers/${d.id}`} className="btn-ghost">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show && (
        <Modal title="Add driver" onClose={() => setShow(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy || !form.name}>
              {busy ? 'Saving…' : 'Save driver'}</button>
          </>}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid grid-2">
            <div className="field"><label className="label">Name</label>
              <input className="input" value={form.name} onChange={set('name')} /></div>
            <div className="field"><label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="field"><label className="label">Email</label>
              <input className="input" value={form.email} onChange={set('email')} /></div>
            <div className="field"><label className="label">Licence number</label>
              <input className="input" value={form.license_number} onChange={set('license_number')} /></div>
            <div className="field"><label className="label">Licence expiry</label>
              <input className="input" type="date" value={form.license_expiry} onChange={set('license_expiry')} /></div>
            <div className="field"><label className="label">Base location</label>
              <input className="input" value={form.current_location} onChange={set('current_location')} placeholder="Chennai" /></div>
            <div className="field"><label className="label">Status</label>
              <select className="select" value={form.status} onChange={set('status')}>
                {['Online', 'Busy', 'Offline', 'Suspended'].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label className="label">KYC status</label>
              <select className="select" value={form.kyc_status} onChange={set('kyc_status')}>
                {['Verified', 'Pending', 'Rejected'].map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            The base location is geocoded so the driver appears in Smart Load Matching.
          </div>
        </Modal>
      )}
    </div>
  )
}
