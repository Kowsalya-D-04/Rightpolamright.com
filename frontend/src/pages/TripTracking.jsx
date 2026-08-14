import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Navigation } from 'lucide-react'
import api, { fmtDateTime, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import MapView from '../components/MapView'
import Loader from '../components/Loader'

const FLOW = ['Assigned', 'Pickup Reached', 'Loading', 'In Transit', 'Reached', 'Delivered']

export default function TripTracking() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [loc, setLoc] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = () => {
    api.get(`/trips/${tripId}`).then(({ data }) => setTrip(data))
    api.get(`/trips/${tripId}/location`).then(({ data }) => setLoc(data))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(() => api.get(`/trips/${tripId}/location`)
      .then(({ data }) => setLoc(data)).catch(() => {}), 10000)
    return () => clearInterval(id)
  }, [tripId])

  const advance = async (status) => {
    setBusy(true)
    try { await api.put(`/trips/${tripId}/status`, { status }); refresh() }
    finally { setBusy(false) }
  }

  /** Nudge the truck along the route — stands in for the driver app's GPS ping. */
  const simulateMove = async () => {
    if (!loc?.pickup?.lat || !loc?.drop?.lat) return
    const cur = loc.current.lat ? loc.current : loc.pickup
    const lat = cur.lat + (loc.drop.lat - cur.lat) * 0.25
    const lng = cur.lng + (loc.drop.lng - cur.lng) * 0.25
    await api.post(`/trips/${tripId}/location`, { lat, lng, speed_kmph: 52 })
    refresh()
  }

  if (!trip || !loc) return <Loader label="Loading trip…" />
  const idx = FLOW.indexOf(trip.status)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Live Tracking — {trip.code}</div>
          <div className="page-sub">{trip.pickup_location} → {trip.drop_location}</div>
        </div>
        <div className="page-actions">
          <Link to="/trips" className="btn btn-outline">All trips</Link>
          <button className="btn btn-outline" onClick={simulateMove}><Navigation size={15} /> Ping location</button>
          {idx >= 0 && idx < FLOW.length - 1 && (
            <button className="btn btn-primary" disabled={busy} onClick={() => advance(FLOW[idx + 1])}>
              Mark {FLOW[idx + 1]}
            </button>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', alignItems: 'start', marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Trip Details</div><StatusBadge status={trip.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Load ID</span><span className="kv-val">{trip.load_code}</span></div>
            <div className="kv-row"><span className="kv-key">Customer</span><span className="kv-val">{trip.customer_name}</span></div>
            <div className="kv-row"><span className="kv-key">Truck</span><span className="kv-val">{trip.truck_number}</span></div>
            <div className="kv-row"><span className="kv-key">Driver</span><span className="kv-val">{trip.driver_name}</span></div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{trip.driver_phone}</span></div>
            <div className="kv-row"><span className="kv-key">From</span><span className="kv-val">{trip.pickup_location}</span></div>
            <div className="kv-row"><span className="kv-key">To</span><span className="kv-val">{trip.drop_location}</span></div>
            <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{trip.distance_km} km</span></div>
            <div className="kv-row"><span className="kv-key">ETA</span>
              <span className="kv-val">{trip.eta_minutes ? `${Math.round(trip.eta_minutes / 60)} h` : '—'}</span></div>
            <div className="kv-row"><span className="kv-key">Fare</span><span className="kv-val">{money(trip.offered_fare)}</span></div>
            <div className="kv-row"><span className="kv-key">Started</span><span className="kv-val">{fmtDateTime(trip.start_date)}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Live Map</div>
            <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
              {loc.history.length} location pings</span></div>
          <div style={{ padding: 13 }}>
            <MapView height={370}
              markers={[
                { ...loc.pickup, label: loc.pickup.name, type: 'pickup' },
                { ...loc.drop, label: loc.drop.name, type: 'drop' },
                ...(loc.current.lat ? [{ ...loc.current, label: trip.truck_number, type: 'trip' }] : []),
              ]}
              route={loc.pickup.lat && loc.drop.lat ? { from: loc.pickup, to: loc.drop } : null} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Trip Progress</div></div>
        <div className="card-body">
          <div className="timeline">
            {FLOW.map((s, i) => (
              <div className="tl-step" key={s}>
                <div className={`tl-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}`}>
                  {i < idx ? <Check size={15} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                </div>
                <div className={`tl-label ${i <= idx ? 'active' : ''}`}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
