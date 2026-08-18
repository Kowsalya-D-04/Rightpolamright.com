import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import api, { fmtDate, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import MapView from '../components/MapView'
import Loader from '../components/Loader'

export default function LoadRequestDetail() {
  const { id } = useParams()
  const [load, setLoad] = useState(null)

  useEffect(() => { api.get(`/load-requests/${id}`).then(({ data }) => setLoad(data)) }, [id])
  if (!load) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{load.code}</div>
          <div className="page-sub">{load.pickup_location} → {load.drop_location} · {load.weight_ton} Ton</div>
        </div>
        <div className="page-actions">
          <Link to="/load-requests" className="btn btn-outline">Back</Link>
          {load.status === 'Pending' && (
            <Link to={`/smart-load-matching/${load.id}`} className="btn btn-primary">
              <Sparkles size={15} /> Find matching drivers
            </Link>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Load details</div>
            <StatusBadge status={load.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Customer</span><span className="kv-val">{load.customer_name}</span></div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{load.customer_phone}</span></div>
            <div className="kv-row"><span className="kv-key">Pickup</span><span className="kv-val">{load.pickup_location}</span></div>
            <div className="kv-row"><span className="kv-key">Drop</span><span className="kv-val">{load.drop_location}</span></div>
            <div className="kv-row"><span className="kv-key">Distance</span><span className="kv-val">{load.distance_km} km</span></div>
            <div className="kv-row"><span className="kv-key">Load type</span><span className="kv-val">{load.load_type}</span></div>
            <div className="kv-row"><span className="kv-key">Truck type</span><span className="kv-val">{load.truck_type}</span></div>
            <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{load.weight_ton} Ton</span></div>
            <div className="kv-row"><span className="kv-key">Required</span>
              <span className="kv-val">{fmtDate(load.required_date)} · {load.required_time}</span></div>
            <div className="kv-row"><span className="kv-key">Budget</span><span className="kv-val">{money(load.budget)}</span></div>
            <div className="kv-row"><span className="kv-key">Estimated fare</span>
              <span className="kv-val">{money(load.estimated_fare)}</span></div>
            {load.special_instructions && (
              <div className="kv-row"><span className="kv-key">Instructions</span>
                <span className="kv-val">{load.special_instructions}</span></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Route</div></div>
          <div style={{ padding: 13 }}>
            <MapView height={320} showLegend={false}
              markers={[
                { lat: load.pickup_lat, lng: load.pickup_lng, label: load.pickup_location, type: 'pickup' },
                { lat: load.drop_lat, lng: load.drop_lng, label: load.drop_location, type: 'drop' },
              ]}
              route={load.pickup_lat && load.drop_lat
                ? { from: { lat: load.pickup_lat, lng: load.pickup_lng },
                    to: { lat: load.drop_lat, lng: load.drop_lng } } : null} />
          </div>
        </div>
      </div>
    </div>
  )
}
