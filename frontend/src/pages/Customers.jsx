import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Plus, Search } from 'lucide-react'
import api, { money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Loader, { EmptyState } from '../components/Loader'

const BLANK = { name: '', company: '', phone: '', email: '', address: '', city: '', gst_number: '', status: 'Active' }

export default function Customers() {
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setRows(null)
    api.get('/customers', { params: { search: search || undefined } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [search])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    setBusy(true)
    try { await api.post('/customers', form); setShow(false); setForm(BLANK); load() }
    finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">Everyone who books loads with you.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShow(true)}><Plus size={15} /> Add customer</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} color="var(--muted)" />
            <input placeholder="Search by name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Boxes size={30} color="var(--muted-light)" />} title="No customers found" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Customer ID</th><th>Name</th><th>Phone</th><th>Email</th>
                <th>Total Loads</th><th>Total Spent</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-strong">{c.code}</td>
                    <td>{c.name}<div className="cell-sub">{c.company}</div></td>
                    <td className="cell-mono">{c.phone}</td>
                    <td>{c.email}</td>
                    <td className="cell-mono">{c.total_loads}</td>
                    <td className="cell-mono">{money(c.total_spent)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><Link to={`/customers/${c.id}`} className="btn-ghost">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {show && (
        <Modal title="Add customer" onClose={() => setShow(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy || !form.name}>
              {busy ? 'Saving…' : 'Save customer'}</button>
          </>}>
          <div className="grid grid-2">
            <div className="field"><label className="label">Contact name</label>
              <input className="input" value={form.name} onChange={set('name')} /></div>
            <div className="field"><label className="label">Company</label>
              <input className="input" value={form.company} onChange={set('company')} /></div>
            <div className="field"><label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="field"><label className="label">Email</label>
              <input className="input" value={form.email} onChange={set('email')} /></div>
            <div className="field"><label className="label">City</label>
              <input className="input" value={form.city} onChange={set('city')} /></div>
            <div className="field"><label className="label">GST number</label>
              <input className="input" value={form.gst_number} onChange={set('gst_number')} /></div>
          </div>
          <div className="field"><label className="label">Address</label>
            <textarea className="textarea" value={form.address} onChange={set('address')} /></div>
        </Modal>
      )}
    </div>
  )
}
