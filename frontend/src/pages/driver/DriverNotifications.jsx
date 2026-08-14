import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, IndianRupee, MapPin, Package, Truck } from 'lucide-react'
import api, { fmtDateTime } from '../../services/api'
import Loader, { EmptyState } from '../../components/Loader'

const ICONS = {
  'Driver Assigned': [Truck, 'var(--blue-soft)', 'var(--blue)'],
  'Driver Accepted': [CheckCircle2, 'var(--green-soft)', 'var(--green)'],
  'Trip Completed': [CheckCircle2, 'var(--green-soft)', 'var(--green)'],
  'Payment Received': [IndianRupee, 'var(--green-soft)', 'var(--green)'],
  'Driver Reached Pickup': [MapPin, 'var(--orange-soft)', 'var(--orange)'],
  'Load Created': [Package, 'var(--blue-soft)', 'var(--blue)'],
}

export default function DriverNotifications() {
  const [rows, setRows] = useState(null)
  const load = () => api.get('/driver/notifications').then(({ data }) => setRows(data))
  useEffect(() => { load() }, [])
  const markAll = async () => { await api.put('/driver/notifications/read-all'); load() }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">Assignments, trip updates and payments.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={markAll}>Mark all as read</button>
        </div>
      </div>

      <div className="card">
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Bell size={30} color="var(--muted-light)" />} title="Nothing to catch up on" />
        ) : rows.map((n) => {
          const [Icon, bg, fg] = ICONS[n.type] || [Bell, 'var(--blue-soft)', 'var(--blue)']
          return (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
              <div className="notif-icon" style={{ background: bg, color: fg }}><Icon size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{fmtDateTime(n.created_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
