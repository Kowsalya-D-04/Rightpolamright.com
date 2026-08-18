import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Package, Shield, Truck } from 'lucide-react'

const ROLES = [
  {
    key: 'customer', icon: Package, title: 'Customer',
    body: 'Book loads, track them live, and settle invoices.',
    action: 'Register', to: '/register/customer', tone: 'blue',
  },
  {
    key: 'driver', icon: Truck, title: 'Driver',
    body: 'Register your truck, accept loads that fit, and get paid.',
    action: 'Register', to: '/register/driver', tone: 'green',
  },
  {
    key: 'admin', icon: Shield, title: 'Admin',
    body: 'Operations accounts are created internally, not self-service.',
    action: 'Login only', to: '/login/admin', tone: 'gray',
  },
]

export default function RegisterRole() {
  const navigate = useNavigate()
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 860 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px' }}>
            Create Your RightPolamRight Account
          </h1>
          <p className="muted-copy" style={{ marginTop: 7 }}>
            Choose how you'll use the platform.
          </p>
        </div>

        <div className="grid grid-3 role-grid">
          {ROLES.map(({ key, icon: Icon, title, body, action, to, tone }) => (
            <button key={key} className={`role-card role-${tone}`} onClick={() => navigate(to)}>
              <span className="feature-icon"><Icon size={21} /></span>
              <div className="card-title" style={{ marginTop: 12 }}>{title}</div>
              <p className="muted-copy" style={{ flex: 1 }}>{body}</p>
              <span className={`btn btn-sm ${key === 'admin' ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center' }}>
                {action} <ArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
          Already have an account? <Link to="/login" className="link">Sign in</Link>
          {' · '}
          <Link to="/" className="link">Back to home</Link>
        </p>
      </div>
    </div>
  )
}
