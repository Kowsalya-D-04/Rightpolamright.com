import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Star } from 'lucide-react'
import api, { fmtDate } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Loader from '../../components/Loader'

export default function DriverProfile() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/driver/profile').then(({ data }) => setData(data)) }, [])
  if (!data) return <Loader />
  const { driver, truck } = data

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-sub">{driver.code} · {user?.email}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/') }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">My Profile</div>
            <StatusBadge status={driver.status} /></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 19 }}>
                {driver.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{driver.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 13 }}>
                  <Star size={14} color="var(--orange)" fill="var(--orange)" />
                  {driver.rating} · {driver.total_trips} trips
                </div>
              </div>
            </div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{driver.phone}</span></div>
            <div className="kv-row"><span className="kv-key">Email</span><span className="kv-val">{driver.email}</span></div>
            <div className="kv-row"><span className="kv-key">Licence</span><span className="kv-val">{driver.license_number}</span></div>
            <div className="kv-row"><span className="kv-key">Licence expiry</span><span className="kv-val">{fmtDate(driver.license_expiry)}</span></div>
            <div className="kv-row"><span className="kv-key">Experience</span><span className="kv-val">{driver.experience_years || 0} years</span></div>
            <div className="kv-row"><span className="kv-key">Base location</span><span className="kv-val">{driver.current_location}</span></div>
            <div className="kv-row"><span className="kv-key">KYC</span>
              <span className="kv-val"><StatusBadge status={driver.kyc_status} /></span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">My Vehicle</div>
            {truck && <StatusBadge status={truck.status} />}</div>
          <div className="card-body">
            {!truck ? (
              <div className="muted-copy">No vehicle registered against your account.</div>
            ) : (
              <>
                <div className="kv-row"><span className="kv-key">Truck number</span><span className="kv-val">{truck.truck_number}</span></div>
                <div className="kv-row"><span className="kv-key">Type</span><span className="kv-val">{truck.truck_type}</span></div>
                <div className="kv-row"><span className="kv-key">Capacity</span><span className="kv-val">{truck.capacity_ton} Ton</span></div>
                <div className="kv-row"><span className="kv-key">Model</span><span className="kv-val">{truck.model || '—'}</span></div>
                <div className="kv-row"><span className="kv-key">Owner</span><span className="kv-val">{truck.owner_name}</span></div>
                <div className="kv-row"><span className="kv-key">Insurance expiry</span><span className="kv-val">{fmtDate(truck.insurance_expiry)}</span></div>
                <div className="kv-row"><span className="kv-key">Verified</span>
                  <span className="kv-val">{truck.is_verified ? 'Yes' : 'Pending'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
