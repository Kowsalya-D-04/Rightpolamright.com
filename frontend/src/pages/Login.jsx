import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, Gauge, Lock, Mail, Package, ShieldCheck, Sparkles, Truck,
} from 'lucide-react'
import { HOME_FOR, useAuth } from '../context/AuthContext'
import { apiError } from '../services/api'

/** Copy and navigation per sign-in variant. */
const VARIANTS = {
  admin: {
    label: 'Operations sign-in', icon: ShieldCheck,
    blurb: 'Loads, matching, fleet and settlements.',
    registerTo: null,
  },
  customer: {
    label: 'Customer sign-in', icon: Package,
    blurb: 'Book loads and track them live.',
    registerTo: '/register/customer',
  },
  driver: {
    label: 'Driver sign-in', icon: Truck,
    blurb: 'See loads that fit your truck.',
    registerTo: '/register/driver',
  },
}

export default function Login() {
  const { role } = useParams()             // undefined on the generic /login
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const variant = VARIANTS[role] || null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={HOME_FOR[user.role] || '/'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const signed = await login(email, password, role)
      navigate(HOME_FOR[signed.role] || '/')
    } catch (err) {
      setError(apiError(err, 'Could not reach the server. Check that the backend is running on port 8000.'))
    } finally { setBusy(false) }
  }

  const Icon = variant?.icon || Truck

  return (
    <div className="login-page">
      <div className="login-visual">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>Move every load<br />with the right truck.</h1>
          <p>Loads, matching, live trips, and settlements — in one platform.</p>
          <div className="login-points">
            <div className="login-point"><Sparkles size={18} color="#60A5FA" />
              <span>Smart Load Matching ranks trucks by capacity, distance, and driver availability.</span></div>
            <div className="login-point"><Gauge size={18} color="#60A5FA" />
              <span>Dynamic pricing that reacts to live demand across your routes.</span></div>
            <div className="login-point"><ShieldCheck size={18} color="#60A5FA" />
              <span>KYC and document tracking for every driver and vehicle.</span></div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <Link to="/" className="link back-link"><ArrowLeft size={15} /> Back to home</Link>

          <div className="login-logo">
            <span className="brand-mark" style={{ width: 42, height: 42 }}><Truck size={22} /></span>
            <span>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px' }}>RightPolamRight</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Smart Logistics Partner</div>
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={19} color="var(--blue)" /> {variant ? variant.label : 'Sign in'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '5px 0 18px' }}>
            {variant ? variant.blurb : 'Enter your details and we will take you to the right place.'}
          </p>

          {!variant && (
            <div className="chip-row" style={{ marginBottom: 16 }}>
              <Link to="/login/customer" className="chip">Customer</Link>
              <Link to="/login/driver" className="chip">Driver</Link>
              <Link to="/login/admin" className="chip">Admin</Link>
            </div>
          )}

          {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label className="label">Email or phone</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--muted)' }} />
                <input className="input" style={{ paddingLeft: 34 }} value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--muted)' }} />
                <input className="input" style={{ paddingLeft: 34 }} type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <div className="checkbox-row">
              <label>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <button type="button" className="btn-ghost" style={{ padding: 0 }}
                onClick={() => alert('Password reset goes to the registered email. Contact support to enable it.')}>
                Forgot password?
              </button>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </button>
          </form>

          {variant?.registerTo ? (
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Don't have an account? <Link to={variant.registerTo} className="link">Register</Link>
            </div>
          ) : role === 'admin' ? (
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Operations accounts are created internally — there is no admin registration.
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Don't have an account? <Link to="/register" className="link">Register</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
