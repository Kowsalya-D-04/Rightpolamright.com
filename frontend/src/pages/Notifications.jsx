import { useEffect, useState } from 'react'
import {
  AlertTriangle, Bell, CheckCircle2, FileWarning, IndianRupee, MapPin, Package, Truck,
} from 'lucide-react'
import api, { fmtDateTime } from '../services/api'
import Loader, { EmptyState } from '../components/Loader'

const ICONS = {
  'Load Created': [Package, 'blue'], 'Driver Assigned': [Truck, 'blue'],
  'Driver Accepted': [CheckCircle2, 'green'], 'Driver Reached Pickup': [MapPin, 'orange'],
  'Trip Started': [Truck, 'purple'], 'Driver Near Destination': [MapPin, 'purple'],
  'Trip Completed': [CheckCircle2, 'green'], 'Payment Received': [IndianRupee, 'green'],
  'Document Expiry': [FileWarning, 'orange'], 'Emergency / SOS': [AlertTriangle, 'red'],
}
const TONE = {
  blue: ['var(--blue-soft)', 'var(--blue)'], green: ['var(--green-soft)', 'var(--green)'],
  orange: ['var(--orange-soft)', 'var(--orange)'], red: ['var(--red-soft)', 'var(--red)'],
  purple: ['var(--purple-soft)', 'var(--purple)'],
}

export default function Notifications() {
  const [rows, setRows] = useState(null)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = () => {
    setRows(null)
    api.get('/notifications', { params: { unread_only: unreadOnly } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }
  useEffect(() => { load() }, [unreadOnly])

  const markRead = async (id) => { await api.put(`/notifications/${id}/read`); load() }
  const markAll = async () => { await api.put('/notifications/read-all'); load() }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">Events raised by loads, trips, payments and documents.</div>
        </div>
        <div className="page-actions">
          <button className={`chip ${unreadOnly ? 'active' : ''}`} onClick={() => setUnreadOnly((v) => !v)}>
            Unread only
          </button>
          <button className="btn btn-outline" onClick={markAll}>Mark all as read</button>
        </div>
      </div>

      <div className="card">
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Bell size={30} color="var(--muted-light)" />} title="Nothing to catch up on" />
        ) : rows.map((n) => {
          const [Icon, tone] = ICONS[n.type] || [Bell, 'blue']
          const [bg, fg] = TONE[tone]
          return (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
              <div className="notif-icon" style={{ background: bg, color: fg }}><Icon size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{n.type} · {fmtDateTime(n.created_at)}</div>
              </div>
              {!n.is_read && (
                <button className="btn-ghost" style={{ alignSelf: 'center' }}
                  onClick={() => markRead(n.id)}>Mark as read</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
