import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Phone, Truck } from 'lucide-react'
import api, { fmtDateTime, money } from '../../services/api'
import MapView from '../../components/MapView'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

const FLOW = ['Assigned', 'Pickup Reached', 'Loading', 'In Transit', 'Reached', 'Delivered']

export default function TrackLoad() {
  const [params, setParams] = useSearchParams()
  const loadId = params.get('load')
  const [loads, setLoads] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const refreshLoads = () => api.get('/customer/loads').then(({ data }) => {
      setLoads(data)
      if (!loadId && data.length) setParams({ load: String(data[0].id) }, { replace: true })
    }).catch(() => {})
    refreshLoads()
    const timer = setInterval(refreshLoads, 5000)
    return () => clearInterval(timer)
  }, [loadId, setParams])

  useEffect(() => {
    if (!loadId) return
    const fetch = () => api.get(`/customer/loads/${loadId}/track`)
      .then(({ data }) => setData(data)).catch(() => setData(null))
    setLoading(true); fetch().finally(() => setLoading(false))
    const id = setInterval(fetch, 5000)   // live backend status/location refresh
    const onFocus = () => fetch()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [loadId])

  if (!loads.length) {
    return (
      <div className="page">
        <div className="page-head"><div><div className="page-title">Track Load</div></div></div>
        <div className="card">
          <EmptyState icon={<MapPin size={30} color="var(--muted-light)" />}
            title="Nothing to track yet" hint="Book a load and you can follow it here."
            action={<Link to="/customer/book-load" className="btn btn-primary">Book a load</Link>} />
        </div>
      </div>
    )
  }

  const trip = data?.trip
  const load = data?.load
  const idx = trip ? FLOW.indexOf(trip.status) : -1

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Track Load</div>
          <div className="page-sub">Live position and status of your consignment.</div>
        </div>
        <div className="page-actions">
          <select className="select" style={{ width: 280 }} value={loadId || ''}
            onChange={(e) => setParams({ load: e.target.value })}>
            {loads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.pickup_location} → {l.drop_location} ({l.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !data ? <Loader /> : !data ? <Loader /> : (
        <>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.6fr', alignItems: 'start', marginBottom: 16 }}>
            <div className="card">
              <div className="card-head"><div className="card-title">Consignment</div>
                <StatusBadge status={trip?.status || load.status} /></div>
              <div className="card-body">
                <div className="kv-row"><span className="kv-key">Load ID</span><span className="kv-val">{load.code}</span></div>
                <div className="kv-row"><span className="kv-key">Pickup</span><span className="kv-val">{load.pickup_location}</span></div>
                <div className="kv-row"><span className="kv-key">Drop</span><span className="kv-val">{load.drop_location}</span></div>
                <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{load.weight_ton} Ton</span></div>
                <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{load.distance_km} km</span></div>
                <div className="kv-row"><span className="kv-key">Fare</span><span className="kv-val">{money(load.estimated_fare)}</span></div>
                {trip ? (
                  <>
                    <div className="kv-row"><span className="kv-key">Driver</span><span className="kv-val">{trip.driver_name}</span></div>
                    <div className="kv-row"><span className="kv-key">Phone</span>
                      <span className="kv-val"><a className="link" href={`tel:${trip.driver_phone}`}>
                        <Phone size={13} /> {trip.driver_phone}</a></span></div>
                    <div className="kv-row"><span className="kv-key">Truck number</span><span className="kv-val">{trip.truck_number}</span></div>
                    <div className="kv-row"><span className="kv-key">ETA</span>
                      <span className="kv-val">{trip.eta_minutes ? `${Math.round(trip.eta_minutes / 60)} h` : '—'}</span></div>
                    <div className="kv-row"><span className="kv-key">Started</span>
                      <span className="kv-val">{fmtDateTime(trip.start_date)}</span></div>
                  </>
                ) : (
                  <div className="alert alert-info" style={{ marginTop: 12 }}>{data.message}</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Live Map</div></div>
              <div style={{ padding: 13 }}>
                <MapView height={360}
                  markers={[
                    { lat: load.pickup_lat, lng: load.pickup_lng, label: load.pickup_location, type: 'pickup' },
                    { lat: load.drop_lat, lng: load.drop_lng, label: load.drop_location, type: 'drop' },
                    ...(trip?.current?.lat ? [{ lat: trip.current.lat, lng: trip.current.lng,
                      label: trip.truck_number, type: 'trip' }] : []),
                  ]}
                  route={load.pickup_lat && load.drop_lat
                    ? { from: { lat: load.pickup_lat, lng: load.pickup_lng },
                        to: { lat: load.drop_lat, lng: load.drop_lng } } : null} />
              </div>
            </div>
          </div>

          {trip && (
            <div className="card">
              <div className="card-head"><div className="card-title">Progress</div></div>
              <div className="card-body">
                <div className="timeline">
                  {FLOW.map((s, i) => (
                    <div className="tl-step" key={s}>
                      <div className={`tl-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}`}>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                      </div>
                      <div className={`tl-label ${i <= idx ? 'active' : ''}`}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
