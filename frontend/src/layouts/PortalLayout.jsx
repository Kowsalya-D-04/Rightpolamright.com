import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/**
 * Shared shell for the customer and driver portals, so both look like the
 * same product as the admin console without duplicating the chrome.
 */
export default function PortalLayout({ nav, notificationsPath, title, badge }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!notificationsPath) return
    const load = () => api.get(notificationsPath)
      .then(({ data }) => setUnread(data.filter((n) => !n.is_read).length))
      .catch(() => {})
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [notificationsPath])

  const initials = (user?.name || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to={nav[0].to} className="brand-row">
            <span className="brand-mark"><Truck size={19} /></span>
            <span>
              <div className="brand-name">RightPolamRight</div>
              <div className="brand-tag">{title}</div>
            </span>
          </Link>
        </div>
        <nav className="nav-section">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={17} />
              <span>{label}</span>
              {to === notificationsRoute(nav, notificationsPath) && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14 }}>
          <button className="nav-item" style={{ width: '100%' }}
            onClick={() => { logout(); navigate('/') }}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <Menu size={19} />
          </button>
          <div style={{ fontWeight: 650, fontSize: 14.5 }}>{title}</div>
          <div className="topbar-right">
            {badge}
            <Link to={nav.find((n) => n.label === 'Notifications')?.to || '#'}
              className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="dot-badge">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <Link to={nav.find((n) => n.label === 'Profile')?.to || '#'} className="profile-chip">
              <span className="avatar">{initials}</span>
              <span>
                <div className="profile-name">{user?.name}</div>
                <div className="profile-role">
                  {user?.customer_code || user?.driver_code || user?.role}
                </div>
              </span>
            </Link>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  )
}

function notificationsRoute(nav, path) {
  if (!path) return null
  return nav.find((n) => n.label === 'Notifications')?.to
}
