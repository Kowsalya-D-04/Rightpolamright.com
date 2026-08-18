import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Truck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiError } from '../../services/api'

const TRUCK_TYPES = ['Open Truck', 'Container', 'Trailer', 'Tipper', 'Tanker']
const BLANK = {
  name: '', phone: '', email: '', password: '', confirm: '',
  license_number: '', license_expiry: '', vehicle_number: '',
  truck_type: 'Open Truck', truck_capacity: '', truck_model: '', truck_color: '', experience_years: '', address: '', city: '', driver_image_url: '', license_image_url: '', rc_image_url: '', insurance_image_url: '', truck_image_url: '',
}

export default function RegisterDriver() {
  const { registerDriver } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(BLANK)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    if (!form.name.trim()) return 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10))) return 'Enter a 10-digit phone number.'
    if (form.password.length < 6) return 'Use a password of at least 6 characters.'
    if (form.password !== form.confirm) return 'The two passwords do not match.'
    if (!form.license_number.trim()) return 'Enter your driving licence number.'
    if (!form.vehicle_number.trim()) return 'Enter your vehicle number.'
    if (!form.truck_capacity || Number(form.truck_capacity) <= 0) return 'Enter the truck capacity in tons.'
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) { setError(problem); return }
    setError(''); setBusy(true)
    try {
      const { confirm, ...rest } = form
      await registerDriver({
        ...rest,
        truck_capacity: Number(rest.truck_capacity),
        experience_years: rest.experience_years ? Number(rest.experience_years) : 0,
        license_expiry: rest.license_expiry || null,
      })
      navigate('/driver/dashboard')
    } catch (err) {
      setError(apiError(err, 'Could not create the account. Try again.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 660 }}>
        <Link to="/register" className="link back-link"><ArrowLeft size={15} /> Choose a different role</Link>
        <div className="auth-head">
          <span className="feature-icon"><Truck size={20} /></span>
          <div>
            <h1>Create a driver account</h1>
            <p className="muted-copy">Register your truck and start accepting loads.</p>
          </div>
        </div>

        <div className="alert alert-info">
          Your account opens for loads once operations verify your licence and vehicle papers.
        </div>
        {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

        <form onSubmit={submit}>
          <div className="section-label">Your details</div>
          <div className="grid grid-2">
            <div className="field"><label className="label">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} required /></div>
            <div className="field"><label className="label">Phone number</label>
              <input className="input" value={form.phone} onChange={set('phone')}
                placeholder="9876543210" required /></div>
            <div className="field"><label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
            <div className="field"><label className="label">Experience (years)</label>
              <input className="input" type="number" step="0.5" value={form.experience_years}
                onChange={set('experience_years')} placeholder="5" /></div>
            <div className="field"><label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
            <div className="field"><label className="label">Confirm password</label>
              <input className="input" type="password" value={form.confirm} onChange={set('confirm')} required /></div>
          </div>

          <div className="section-label">Licence</div>
          <div className="grid grid-2">
            <div className="field"><label className="label">Licence number</label>
              <input className="input" value={form.license_number} onChange={set('license_number')}
                placeholder="TN0912345678" required /></div>
            <div className="field"><label className="label">Licence expiry</label>
              <input className="input" type="date" value={form.license_expiry} onChange={set('license_expiry')} /></div>
          </div>

          <div className="section-label">Your truck</div>
          <div className="grid grid-3">
            <div className="field"><label className="label">Vehicle number</label>
              <input className="input" value={form.vehicle_number} onChange={set('vehicle_number')}
                placeholder="TN01AB1234" required /></div>
            <div className="field"><label className="label">Truck type</label>
              <select className="select" value={form.truck_type} onChange={set('truck_type')}>
                {TRUCK_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select></div>
            <div className="field"><label className="label">Capacity (tons)</label>
              <input className="input" type="number" step="0.5" value={form.truck_capacity}
                onChange={set('truck_capacity')} placeholder="10.5" required /></div>
          </div>

          <div className="grid grid-2">
            <div className="field"><label className="label">Address</label>
              <input className="input" value={form.address} onChange={set('address')} /></div>
            <div className="field"><label className="label">Base city</label>
              <input className="input" value={form.city} onChange={set('city')} placeholder="Chennai" /></div>
          </div>

          <div className="section-label">Driver, licence & vehicle documents</div>
          <div className="grid grid-2">
            {[['driver_image_url','Driver image'],['license_image_url','Licence image'],['rc_image_url','RC image'],['insurance_image_url','Insurance image'],['truck_image_url','Truck image']].map(([key,label]) => (
              <div className="field" key={key}><label className="label">{label} URL / uploaded path</label>
                <input className="input" value={form[key]} onChange={set(key)} /></div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create Driver Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          Already registered? <Link to="/login/driver" className="link">Driver sign-in</Link>
        </p>
      </div>
    </div>
  )
}
