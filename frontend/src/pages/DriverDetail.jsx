import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Star, XCircle } from 'lucide-react'
import api, { apiError, fmtDate } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'

export default function DriverDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => api.get(`/drivers/${id}/profile`).then(({ data }) => setData(data))
  useEffect(() => { load() }, [id])
  if (!data) return <Loader />
  const { driver, trucks, current_trip, documents } = data

  const setDoc = async (docId, status) => {
    await api.put(`/drivers/${id}/documents/${docId}`, null, { params: { status } })
    load()
  }

  const verifyDriver = async (status) => {
    setBusy(true); setError(''); setMessage('')
    try {
      const { data: result } = await api.post(`/drivers/${id}/verification`, { status })
      setMessage(status === 'Verified'
        ? `Driver approved. ${result.trucks.length} truck(s) are now eligible for matching.`
        : 'Driver and assigned trucks were rejected from the matching pool.')
      await load()
    } catch (err) {
      setError(apiError(err, 'Could not update driver verification.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{driver.name}</div>
          <div className="page-sub">{driver.code} · {driver.phone}</div>
        </div>
        <div className="page-actions">
          {driver.kyc_status !== 'Verified' && (
            <button className="btn btn-primary" onClick={() => verifyDriver('Verified')} disabled={busy}>
              <CheckCircle2 size={15} /> Approve Driver & Truck
            </button>
          )}
          {driver.kyc_status !== 'Rejected' && (
            <button className="btn btn-outline" onClick={() => verifyDriver('Rejected')} disabled={busy}>
              <XCircle size={15} /> Reject
            </button>
          )}
          <Link to="/drivers" className="btn btn-outline">Back</Link>
        </div>
      </div>

      {message && <div className="alert alert-success" style={{ marginBottom: 16 }}>{message}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Profile</div><StatusBadge status={driver.status} /></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 19 }}>
                {driver.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{driver.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 13 }}>
                  <Star size={14} color="var(--orange)" fill="var(--orange)" />
                  {driver.rating} · {driver.total_trips} completed trips
                </div>
              </div>
            </div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{driver.phone}</span></div>
            <div className="kv-row"><span className="kv-key">Email</span><span className="kv-val">{driver.email}</span></div>
            <div className="kv-row"><span className="kv-key">Licence</span><span className="kv-val">{driver.license_number}</span></div>
            <div className="kv-row"><span className="kv-key">Licence expiry</span><span className="kv-val">{fmtDate(driver.license_expiry)}</span></div>
            <div className="kv-row"><span className="kv-key">KYC</span><span className="kv-val"><StatusBadge status={driver.kyc_status} /></span></div>
            {driver.kyc_status !== 'Verified' && (
              <div className="alert alert-warning" style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Driver is not eligible for load matching yet.</div>
                <div style={{ marginBottom: 10 }}>Approve the driver and assigned truck to enable Driver Availability and automatic matching.</div>
                <button className="btn btn-primary" onClick={() => verifyDriver('Verified')} disabled={busy}>
                  <CheckCircle2 size={15} /> Verify Driver & Truck
                </button>
              </div>
            )}
            {driver.kyc_status === 'Verified' && (
              <div className="alert alert-success" style={{ marginTop: 14 }}>
                Driver and assigned truck are verified for load matching.
              </div>
            )}
            <div className="kv-row"><span className="kv-key">Current location</span><span className="kv-val">{driver.current_location}</span></div>
            <div className="kv-row"><span className="kv-key">Current trip</span>
              <span className="kv-val">{current_trip
                ? <Link className="btn-ghost" to={`/trips/${current_trip.id}`}>{current_trip.code} — {current_trip.status}</Link>
                : 'Not on a trip'}</span></div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Assigned trucks</div></div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Truck</th><th>Type</th><th>Capacity</th><th>Status</th><th>Verified</th></tr></thead>
                <tbody>
                  {trucks.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-strong"><Link to={`/trucks/${t.id}`}>{t.truck_number}</Link></td>
                      <td>{t.truck_type}</td><td className="cell-mono">{t.capacity_ton} T</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><StatusBadge status={t.is_verified ? 'Verified' : 'Pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Documents</div></div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Document</th><th>Number</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.doc_type}</td>
                      <td className="cell-mono">{d.doc_number}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <button className="btn-ghost" onClick={() => setDoc(d.id, 'Verified')}>Verify</button>
                        <button className="btn-ghost" style={{ color: 'var(--red)' }}
                          onClick={() => setDoc(d.id, 'Rejected')}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
