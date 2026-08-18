import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Navigation, Phone } from 'lucide-react'
import api, { fmtDateTime, money, apiError } from '../../services/api'
import MapView from '../../components/MapView'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'
import ImageUpload from '../../components/ImageUpload'

const FLOW = ['Assigned', 'Pickup Reached', 'Loading', 'In Transit', 'Reached', 'Delivered']

/** Without a trip id, pick the active trip (or the latest one). */
function Chooser() {
  const [trips, setTrips] = useState(null)
  const navigate = useNavigate()
  useEffect(() => {
    api.get('/driver/trips').then(({ data }) => {
      const active = data.find((t) => FLOW.includes(t.status) && t.status !== 'Delivered')
      if (active) navigate(`/driver/trips/${active.id}`, { replace: true })
      else if (data.length) navigate(`/driver/trips/${data[0].id}`, { replace: true })
      else setTrips([])
    })
  }, [])
  if (trips === null) return <Loader />
  return (
    <div className="page">
      <div className="page-head"><div><div className="page-title">Trip Tracking</div></div></div>
      <div className="card">
        <EmptyState icon={<Navigation size={30} color="var(--muted-light)" />}
          title="No trip to track" hint="Accept a load to start tracking."
          action={<Link to="/driver/available-loads" className="btn btn-primary">Available loads</Link>} />
      </div>
    </div>
  )
}

export default function DriverTripTracking() {
  const { tripId } = useParams()
  if (!tripId) return <Chooser />
  return <TripDetail tripId={tripId} />
}

function TripDetail({ tripId }) {
  const [trip, setTrip] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deliveryPhoto, setDeliveryPhoto] = useState(null)
  const [signature, setSignature] = useState(null)

  const load = () => api.get(`/driver/trips/${tripId}`).then(({ data }) => setTrip(data))
  useEffect(() => { load() }, [tripId])
  if (!trip) return <Loader />

  const idx = FLOW.indexOf(trip.status)

  const advance = async () => {
    if (!trip.next_status) return
    setBusy(true); setError('')
    try {
      await api.post(`/driver/trips/${tripId}/status`, { status: trip.next_status })
      load()
    } catch (err) {
      setError(apiError(err, 'Could not update the status.'))
    } finally { setBusy(false) }
  }

  const pushBrowserLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post(`/driver/trips/${tripId}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude, speed_kmph: pos.coords.speed ? pos.coords.speed * 3.6 : 0 })
        load()
      } catch {}
    }, () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 })
  }

  useEffect(() => {
    if (!trip || !['Assigned','Pickup Reached','Loading','In Transit','Reached'].includes(trip.status)) return
    pushBrowserLocation()
    const timer=setInterval(pushBrowserLocation,15000)
    return ()=>clearInterval(timer)
  }, [trip?.status, tripId])

  const saveProof=async()=>{
    setBusy(true); setError('')
    try { await api.post(`/driver/trips/${tripId}/proof-of-delivery`,{delivery_photo_url:deliveryPhoto,delivery_signature_url:signature}); await load() }
    catch(err){ setError(apiError(err,'Could not save proof of delivery.')) } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Trip Tracking — {trip.code}</div>
          <div className="page-sub">{trip.pickup_location} → {trip.drop_location}</div>
        </div>
        <div className="page-actions">
          <Link to="/driver/trips" className="btn btn-outline">All trips</Link>
          <button className="btn btn-outline" onClick={pushBrowserLocation}><Navigation size={15} /> Update GPS now</button>
          {trip.next_status && (
            <button className="btn btn-primary" onClick={advance} disabled={busy}>
              {busy ? 'Updating…' : `Update Status → ${trip.next_status}`}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', alignItems: 'start', marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Trip Details</div>
            <StatusBadge status={trip.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Trip ID</span><span className="kv-val">{trip.code}</span></div>
            <div className="kv-row"><span className="kv-key">Load ID</span><span className="kv-val">{trip.load_code}</span></div>
            <div className="kv-row"><span className="kv-key">Pickup</span><span className="kv-val">{trip.pickup_location}</span></div>
            <div className="kv-row"><span className="kv-key">Drop</span><span className="kv-val">{trip.drop_location}</span></div>
            <div className="kv-row"><span className="kv-key">Truck</span><span className="kv-val">{trip.truck_number}</span></div>
            <div className="kv-row"><span className="kv-key">Customer</span><span className="kv-val">{trip.customer_name}</span></div>
            <div className="kv-row"><span className="kv-key">Phone</span>
              <span className="kv-val"><a className="link" href={`tel:${trip.customer_phone}`}>
                <Phone size={13} /> {trip.customer_phone}</a></span></div>
            <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{trip.weight_ton} Ton</span></div>
            <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{trip.distance_km} km</span></div>
            <div className="kv-row"><span className="kv-key">ETA</span>
              <span className="kv-val">{trip.eta_minutes ? `${Math.round(trip.eta_minutes / 60)} h` : '—'}</span></div>
            <div className="kv-row"><span className="kv-key">Fare</span><span className="kv-val">{money(trip.offered_fare)}</span></div>
            <div className="kv-row"><span className="kv-key">Started</span><span className="kv-val">{fmtDateTime(trip.start_date)}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Route</div></div>
          <div style={{ padding: 13 }}>
            <MapView height={370}
              markers={[
                { lat: trip.pickup_lat, lng: trip.pickup_lng, label: trip.pickup_location, type: 'pickup' },
                { lat: trip.drop_lat, lng: trip.drop_lng, label: trip.drop_location, type: 'drop' },
                ...(trip.current_lat ? [{ lat: trip.current_lat, lng: trip.current_lng,
                  label: trip.truck_number, type: 'trip' }] : []),
              ]}
              route={trip.pickup_lat && trip.drop_lat
                ? { from: { lat: trip.pickup_lat, lng: trip.pickup_lng },
                    to: { lat: trip.drop_lat, lng: trip.drop_lng } } : null} />
          </div>
        </div>
      </div>

      {['Reached','Delivered'].includes(trip.status) && (
        <div className="card" style={{marginBottom:16}}>
          <div className="card-head"><div className="card-title">Proof of Delivery</div></div>
          <div className="card-body"><div className="grid grid-2"><ImageUpload label="Delivery photo" value={deliveryPhoto || trip.delivery_photo_url} onChange={setDeliveryPhoto} /><ImageUpload label="Customer signature image" value={signature || trip.delivery_signature_url} onChange={setSignature} /></div><button className="btn btn-primary" onClick={saveProof} disabled={busy || !(deliveryPhoto || trip.delivery_photo_url) || !(signature || trip.delivery_signature_url)}>Save Proof of Delivery</button></div>
        </div>
      )}

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
