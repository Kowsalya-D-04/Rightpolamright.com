import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Phone, Star } from 'lucide-react'
import api, { apiError, fmtDate, fmtDateTime, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import MapView from '../components/MapView'
import Loader from '../components/Loader'

/** Everything the admin needs to confirm one driver-accepted load. */
export default function AssignmentReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get(`/load-requests/${id}/assignment`)
    .then(({ data }) => setData(data))
    .catch((e) => setError(apiError(e, 'Could not load this assignment.')))

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [id])
  if (error && !data) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!data) return <Loader />

  const { load: l, customer, pricing, accepted_driver: drv, driver_availability: slots,
          truck, workflow, trip } = data

  const confirm = async () => {
    setError(''); setBusy(true)
    try {
      const { data: r } = await api.post(`/load-requests/${id}/confirm`)
      navigate(`/trips/${r.trip_id}`)
    } catch (e) {
      setError(apiError(e, 'Could not confirm the assignment.'))
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Assignment review — {l.code}</div>
          <div className="page-sub">{l.pickup_location} → {l.drop_location} · {l.weight_ton} Ton</div>
        </div>
        <div className="page-actions">
          <Link to="/load-requests" className="btn btn-outline">Back</Link>
          {workflow.current === 'DRIVER_ACCEPTED' && (
            <button className="btn btn-success" onClick={confirm} disabled={busy}>
              <CheckCircle2 size={15} /> {busy ? 'Confirming…' : 'Confirm assignment'}
            </button>
          )}
          {trip && <Link to={`/trips/${trip.id}`} className="btn btn-primary">Open trip {trip.code}</Link>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Progress</div>
          <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{workflow.label}</span>
        </div>
        <div className="card-body">
          <div className="timeline">
            {workflow.steps.map((s, i) => (
              <div className="tl-step" key={s.key}>
                <div className={`tl-dot ${s.done ? 'done' : s.current ? 'current' : ''}`}>
                  {s.done ? <CheckCircle2 size={15} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                </div>
                <div className={`tl-label ${s.done || s.current ? 'active' : ''}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Customer</div></div>
            <div className="card-body">
              {customer ? (
                <>
                  <div className="kv-row"><span className="kv-key">Name</span><span className="kv-val">{customer.name}</span></div>
                  <div className="kv-row"><span className="kv-key">Company</span><span className="kv-val">{customer.company || '—'}</span></div>
                  <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{customer.phone}</span></div>
                  <div className="kv-row"><span className="kv-key">Email</span><span className="kv-val">{customer.email}</span></div>
                  <div className="kv-row"><span className="kv-key">Address</span><span className="kv-val">{customer.address || customer.city}</span></div>
                </>
              ) : <div style={{ color: 'var(--muted)' }}>No customer on this load.</div>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <div className="card-title">Load</div>
              <StatusBadge status={l.status} />
            </div>
            <div className="card-body">
              {l.load_image_url && (
                <img src={l.load_image_url} alt="Load"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover',
                           borderRadius: 8, border: '1px solid var(--line)', marginBottom: 14 }} />
              )}
              <div className="kv-row"><span className="kv-key">Pickup</span><span className="kv-val">{l.pickup_location}</span></div>
              <div className="kv-row"><span className="kv-key">Drop</span><span className="kv-val">{l.drop_location}</span></div>
              <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{pricing.distance_km} km</span></div>
              <div className="kv-row"><span className="kv-key">Load type</span><span className="kv-val">{l.load_type}</span></div>
              <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{l.weight_ton} Ton</span></div>
              <div className="kv-row"><span className="kv-key">Truck type</span><span className="kv-val">{l.truck_type}</span></div>
              <div className="kv-row"><span className="kv-key">Required</span>
                <span className="kv-val">{fmtDate(l.required_date)} · {l.required_time}</span></div>
              {l.special_instructions && (
                <div className="kv-row"><span className="kv-key">Instructions</span>
                  <span className="kv-val">{l.special_instructions}</span></div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Route</div></div>
            <div style={{ padding: 13 }}>
              <MapView height={220} showLegend={false}
                markers={[
                  { lat: l.pickup_lat, lng: l.pickup_lng, label: l.pickup_location, type: 'pickup' },
                  { lat: l.drop_lat, lng: l.drop_lng, label: l.drop_location, type: 'drop' },
                ]}
                route={l.pickup_lat && l.drop_lat
                  ? { from: { lat: l.pickup_lat, lng: l.pickup_lng },
                      to: { lat: l.drop_lat, lng: l.drop_lng } } : null} />
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Matched driver</div></div>
            <div className="card-body">
              {drv ? (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <div className="avatar" style={{ width: 46, height: 46, fontSize: 16 }}>
                      {drv.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{drv.name} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({drv.code})</span></div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--muted)' }}>
                        <span><Star size={12} color="var(--orange)" fill="var(--orange)" /> {drv.rating}</span>
                        <span>{drv.total_trips} trips</span>
                        <span><Phone size={12} /> {drv.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="kv-row"><span className="kv-key">KYC</span>
                    <span className="kv-val"><StatusBadge status={drv.kyc_status} /></span></div>
                  <div className="kv-row"><span className="kv-key">Current location</span>
                    <span className="kv-val">{drv.current_location}</span></div>
                  <div className="kv-row"><span className="kv-key">Accepted at</span>
                    <span className="kv-val">{fmtDateTime(drv.accepted_at)}</span></div>
                </>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  No driver has accepted this load yet. Use Smart Load Matching to offer it.
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Driver availability</div></div>
            <div className="card-body">
              {slots?.length ? slots.map((s) => (
                <div className="kv-row" key={s.id}>
                  <span className="kv-key">{fmtDate(s.from)} {s.from_time || ''} – {fmtDate(s.to)} {s.to_time || ''}</span>
                  <span className="kv-val">{s.from_location} → {s.preferred_drop || 'Any'}</span>
                </div>
              )) : (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  This driver has not published an availability window.
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Truck</div></div>
            <div className="card-body">
              {truck ? (
                <>
                  <div className="kv-row"><span className="kv-key">Number</span><span className="kv-val">{truck.truck_number}</span></div>
                  <div className="kv-row"><span className="kv-key">Type</span><span className="kv-val">{truck.truck_type}</span></div>
                  <div className="kv-row"><span className="kv-key">Capacity</span><span className="kv-val">{truck.capacity_ton} Ton</span></div>
                  <div className="kv-row"><span className="kv-key">Model</span><span className="kv-val">{truck.model || '—'}</span></div>
                  <div className="kv-row"><span className="kv-key">Status</span>
                    <span className="kv-val"><StatusBadge status={truck.status} /></span></div>
                </>
              ) : <div style={{ color: 'var(--muted)', fontSize: 13 }}>No truck reserved yet.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">Price</div></div>
            <div className="card-body">
              <div style={{ fontSize: 25, fontWeight: 750, letterSpacing: '-.5px' }}>
                {money(pricing.estimated_fare)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                {money(pricing.unit_price_per_km)}/km × {pricing.distance_km} km
              </div>
              {pricing.breakdown && [
                ['Base price (distance × rate)', 'base_price'], ['Fixed base charge', 'base_fare'],
                ['Weight charge', 'weight_charge'], ['Toll', 'toll_charge'],
                ['Loading', 'loading_charge'], ['Unloading', 'unloading_charge'],
                ['Driver bata', 'driver_bata'], ['Platform fee', 'platform_fee'],
                ['GST', 'gst'], ['Surge', 'surge_amount'],
              ].map(([label, key]) => (
                <div className="kv-row" key={key}>
                  <span className="kv-key">{label}</span>
                  <span className="kv-val">{money(pricing.breakdown[key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
