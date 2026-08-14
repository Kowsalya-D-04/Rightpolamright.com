import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiError } from '../../services/api'

const BLANK = {
  name: '', company: '', email: '', phone: '', password: '', confirm: '',
  address: '', city: '', state: '', pincode: '',
}

export default function RegisterCustomer() {
  const { registerCustomer } = useAuth()
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
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) { setError(problem); return }
    setError(''); setBusy(true)
    try {
      const { confirm, ...payload } = form
      await registerCustomer(payload)
      // Account created and signed in — go straight to the customer app.
      navigate('/customer/dashboard')
    } catch (err) {
      setError(apiError(err, 'Could not create the account. Try again.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 620 }}>
        <Link to="/register" className="link back-link"><ArrowLeft size={15} /> Choose a different role</Link>
        <div className="auth-head">
          <span className="feature-icon"><Package size={20} /></span>
          <div>
            <h1>Create a customer account</h1>
            <p className="muted-copy">Book loads and track them from pickup to delivery.</p>
          </div>
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

        <form onSubmit={submit}>
          <div className="grid grid-2">
            <div className="field"><label className="label">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} required /></div>
            <div className="field"><label className="label">Company name</label>
              <input className="input" value={form.company} onChange={set('company')}
                placeholder="Optional" /></div>
            <div className="field"><label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
            <div className="field"><label className="label">Phone number</label>
              <input className="input" value={form.phone} onChange={set('phone')}
                placeholder="9876543210" required /></div>
            <div className="field"><label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
            <div className="field"><label className="label">Confirm password</label>
              <input className="input" type="password" value={form.confirm} onChange={set('confirm')} required /></div>
          </div>

          <div className="field"><label className="label">Address</label>
            <input className="input" value={form.address} onChange={set('address')} /></div>

          <div className="grid grid-3">
            <div className="field"><label className="label">City</label>
              <input className="input" value={form.city} onChange={set('city')} placeholder="Chennai" /></div>
            <div className="field"><label className="label">State</label>
              <input className="input" value={form.state} onChange={set('state')} placeholder="Tamil Nadu" /></div>
            <div className="field"><label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={set('pincode')} placeholder="600002" /></div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create Customer Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          Already registered? <Link to="/login/customer" className="link">Customer sign-in</Link>
        </p>
      </div>
    </div>
  )
}
