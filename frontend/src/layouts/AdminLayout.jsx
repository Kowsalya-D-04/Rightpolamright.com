import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell, Boxes, ChartColumn, CreditCard, Files, LayoutDashboard, LogOut, Menu,
  Package, Search, Settings, Sparkles, Truck, Users, Route as RouteIcon, IndianRupee,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/load-requests', label: 'Load Requests', icon: Package },
  { to: '/smart-load-matching', label: 'Smart Load Matching', icon: Sparkles },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trucks', label: 'Trucks', icon: Truck },
  { to: '/customers', label: 'Customers', icon: Boxes },
  { to: '/pricing', label: 'Tariffs & Pricing', icon: IndianRupee },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notif' },
  { to: '/reports', label: 'Reports', icon: ChartColumn },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = () => api.get('/notifications/unread-count')
      .then(({ data }) => setUnread(data.count)).catch(() => {})
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/load-requests?q=${encodeURIComponent(q.trim())}`)
  }

  const initials = (user?.name || 'A').split(' ').map((s) => s[0]).slice(0, 2).join('')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/dashboard" className="brand-row">
            <span className="brand-mark"><Truck size={19} /></span>
            <span>
              <div className="brand-name">RightPolamRight</div>
              <div className="brand-tag">Smart Logistics Partner</div>
            </span>
          </Link>
        </div>
        <nav className="nav-section">
          {NAV.map(({ to, label, icon: Icon, badgeKey }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={17} />
              <span>{label}</span>
              {badgeKey === 'notif' && unread > 0 && <span className="nav-badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14 }}>
          <button className="nav-item" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login') }}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <Menu size={19} />
          </button>
          <form className="search-box" onSubmit={onSearch}>
            <Search size={16} color="var(--muted)" />
            <input placeholder="Search loads, customers, routes…" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="topbar-right">
            <Link to="/notifications" className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="dot-badge">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <Link to="/settings" className="profile-chip">
              <span className="avatar">{initials}</span>
              <span>
                <div className="profile-name">{user?.name || 'Admin'}</div>
                <div className="profile-role">Super Admin</div>
              </span>
            </Link>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  )
}
