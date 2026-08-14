import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Your account and platform defaults.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Account</div></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Name</span><span className="kv-val">{user?.name}</span></div>
            <div className="kv-row"><span className="kv-key">Email</span><span className="kv-val">{user?.email}</span></div>
            <div className="kv-row"><span className="kv-key">Role</span><span className="kv-val">Super Admin</span></div>
            <button className="btn btn-outline" style={{ marginTop: 16 }}
              onClick={() => { logout(); navigate('/login') }}>Sign out</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Matching defaults</div></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Search radius from pickup</span><span className="kv-val">250 km</span></div>
            <div className="kv-row"><span className="kv-key">Capacity weight</span><span className="kv-val">20 pts</span></div>
            <div className="kv-row"><span className="kv-key">Distance weight</span><span className="kv-val">25 pts</span></div>
            <div className="kv-row"><span className="kv-key">Truck type weight</span><span className="kv-val">15 pts</span></div>
            <div className="kv-row"><span className="kv-key">Availability weight</span><span className="kv-val">15 pts</span></div>
            <div className="kv-row"><span className="kv-key">Rating weight</span><span className="kv-val">10 pts</span></div>
            <div className="kv-row"><span className="kv-key">Date/time weight</span><span className="kv-val">10 pts</span></div>
            <div className="kv-row"><span className="kv-key">Route fit weight</span><span className="kv-val">5 pts</span></div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12 }}>
              Weights live in <code>backend/services/matching.py</code>. Edit them there to retune ranking.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
