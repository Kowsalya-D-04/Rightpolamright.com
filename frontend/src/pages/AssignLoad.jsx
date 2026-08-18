import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Send } from 'lucide-react'
import api, { fmtDate, money, apiError } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'

export default function AssignLoad() {
  const { loadId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [load, setLoad] = useState(null)
  const [matches, setMatches] = useState([])
  const [driverId, setDriverId] = useState(params.get('driver') || '')
  const [truckId, setTruckId] = useState(params.get('truck') || '')
  const [fare, setFare] = useState(params.get('fare') || '')
  const [advance, setAdvance] = useState('')
  const [message, setMessage] = useState('Reach the pickup point 30 minutes early.')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  useEffect(() => {
    api.get(`/load-requests/${loadId}`).then(({ data }) => {
      setLoad(data)
      if (!fare) setFare(data.estimated_fare || '')
    })
    api.get(`/load-requests/${loadId}/matches`).then(({ data }) => setMatches(data.matches))
  }, [loadId])

  const onPickDriver = (id) => {
    setDriverId(id)
    const m = matches.find((x) => String(x.driver_id) === String(id))
    if (m) { setTruckId(m.truck_id); setFare(m.estimated_fare) }
  }

  const assign = async () => {
    setError(''); setBusy(true)
    try {
      const { data } = await api.post(`/load-requests/${loadId}/assign`, {
        driver_id: Number(driverId), truck_id: Number(truckId),
        offered_fare: fare ? Number(fare) : null,
        advance_amount: advance ? Number(advance) : 0,
        message_to_driver: message,
      })
      setDone(data)
    } catch (err) {
      setError(apiError(err, 'The assignment did not go through.'))
    } finally { setBusy(false) }
  }

  if (!load) return <Loader />

  if (done) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 520, margin: '50px auto', textAlign: 'center', padding: 34 }}>
          <CheckCircle2 size={46} color="var(--green)" style={{ margin: '0 auto' }} />
          <div className="page-title" style={{ marginTop: 14 }}>Load assigned</div>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>{done.message}</p>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            <Link to={`/trips/${done.trip_id}`} className="btn btn-primary">Track {done.trip_code}</Link>
            <Link to="/load-requests" className="btn btn-outline">Back to loads</Link>
          </div>
        </div>
      </div>
    )
  }

  const selected = matches.find((m) => String(m.driver_id) === String(driverId))

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Assign Load</div>
          <div className="page-sub">Confirm the truck, driver and commercials for {load.code}.</div>
        </div>
        <div className="page-actions">
          <Link to={`/smart-load-matching/${loadId}`} className="btn btn-outline">Back to matches</Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.25fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Load Summary</div>
            <StatusBadge status={load.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Load ID</span><span className="kv-val">{load.code}</span></div>
            <div className="kv-row"><span className="kv-key">Customer</span><span className="kv-val">{load.customer_name}</span></div>
            <div className="kv-row"><span className="kv-key">Route</span>
              <span className="kv-val">{load.pickup_location} → {load.drop_location}</span></div>
            <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{load.distance_km} km</span></div>
            <div className="kv-row"><span className="kv-key">Date & time</span>
              <span className="kv-val">{fmtDate(load.required_date)} · {load.required_time}</span></div>
            <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{load.weight_ton} Ton</span></div>
            <div className="kv-row"><span className="kv-key">Truck type</span><span className="kv-val">{load.truck_type}</span></div>
            <div className="kv-row"><span className="kv-key">Estimated fare</span>
              <span className="kv-val">{money(load.estimated_fare)}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Assignment</div></div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            {load.status !== 'Pending' && (
              <div className="alert alert-info">This load is already {load.status}. Assignment is closed.</div>
            )}

            <div className="field">
              <label className="label">Select driver</label>
              <select className="select" value={driverId} onChange={(e) => onPickDriver(e.target.value)}>
                <option value="">Choose from ranked matches</option>
                {matches.map((m) => (
                  <option key={m.driver_id} value={m.driver_id}>
                    {m.match_score}% — {m.driver_name} ({m.current_location}, {m.distance_from_pickup_km} km)
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label">Select truck</label>
              <select className="select" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
                <option value="">Choose a truck</option>
                {matches.map((m) => (
                  <option key={m.truck_id} value={m.truck_id}>
                    {m.truck_number} — {m.truck_type}, {m.truck_capacity} Ton
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="alert alert-info" style={{ display: 'block' }}>
                <strong>{selected.driver_name}</strong> · {selected.driver_phone} · {selected.truck_number} ·
                {' '}{selected.match_score}% match · {selected.distance_from_pickup_km} km from pickup
              </div>
            )}

            <div className="grid grid-2">
              <div className="field">
                <label className="label">Offered fare</label>
                <input className="input" type="number" value={fare} onChange={(e) => setFare(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Advance</label>
                <input className="input" type="number" value={advance}
                  onChange={(e) => setAdvance(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="field">
              <label className="label">Message to driver</label>
              <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button className="btn btn-primary" onClick={assign}
                disabled={busy || !driverId || !truckId || load.status !== 'Pending'}>
                <Send size={15} /> {busy ? 'Assigning…' : 'Assign & notify'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
