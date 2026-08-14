import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Save } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/Loader'

const FIELDS = [
  ['name', 'Full name'], ['company', 'Company'], ['phone', 'Phone'],
  ['address', 'Address'], ['city', 'City'], ['state', 'State'],
  ['pincode', 'Pincode'], ['gst_number', 'GST number'],
]

export default function CustomerProfile() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.get('/customer/profile').then(({ data }) => setForm(data)) }, [])
  if (!form) return <Loader />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    setBusy(true)
    try {
      await api.put('/customer/profile', form)
      setSaved('Profile updated.')
      setTimeout(() => setSaved(''), 2500)
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-sub">{form.code} · {user?.email}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/') }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-head"><div className="card-title">Your details</div></div>
        <div className="card-body">
          {saved && <div className="alert alert-success">{saved}</div>}
          <div className="grid grid-2">
            {FIELDS.map(([k, label]) => (
              <div className="field" key={k}>
                <label className="label">{label}</label>
                <input className="input" value={form[k] || ''} onChange={set(k)} />
              </div>
            ))}
            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={form.email || ''} disabled />
            </div>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            <Save size={15} /> {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
