import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, Bookmark, Gauge, MapPin, Package, Search, Sparkles, Star, Truck, Weight,
} from 'lucide-react'
import api, { fmtDate, money, apiError } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import MapView from '../components/MapView'
import Modal from '../components/Modal'
import Loader, { EmptyState } from '../components/Loader'

function ScoreRing({ score }) {
  const r = 26, c = 2 * Math.PI * r
  const color = score >= 93 ? 'var(--green)' : score >= 88 ? 'var(--blue)'
    : score >= 80 ? 'var(--purple)' : 'var(--orange)'
  return (
    <div className="score-ring">
      <svg width="62" height="62" viewBox="0 0 62 62">
        <circle cx="31" cy="31" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="31" cy="31" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} transform="rotate(-90 31 31)" />
      </svg>
      <div className="score-ring-text" style={{ color }}>{score}%</div>
    </div>
  )
}

/** Load picker shown when no load is selected yet. */
function LoadPicker() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    api.get('/load-requests', { params: { status: 'Pending' } })
      .then(({ data }) => setRows(data)).catch(() => setRows([]))
  }, [])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Smart Load Matching</div>
          <div className="page-sub">Find the best matching trucks for this load request</div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><div className="card-title">Pick a pending load to match</div></div>
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />} title="No pending loads"
            hint="Every load has a truck against it. Raise a new load to run matching."
            action={<Link to="/load-requests" className="btn btn-primary">Go to load requests</Link>} />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Load ID</th><th>Customer</th><th>Route</th><th>Weight</th><th>Truck Type</th><th>Required</th><th></th></tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="cell-strong">{l.code}</td>
                    <td>{l.customer_name}</td>
                    <td>{l.pickup_location} → {l.drop_location}</td>
                    <td className="cell-mono">{l.weight_ton} T</td>
                    <td>{l.truck_type}</td>
                    <td className="cell-mono">{fmtDate(l.required_date)}</td>
                    <td><Link to={`/smart-load-matching/${l.id}`} className="btn btn-primary btn-sm">
                      <Sparkles size={14} /> Find trucks</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SmartLoadMatching() {
  const { loadId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  const runMatching = () => {
    setLoading(true); setError('')
    api.get(`/load-requests/${loadId}/matches`)
      .then(({ data }) => setData(data))
      .catch((e) => setError(apiError(e, 'Matching could not run. Try again.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (loadId) runMatching() }, [loadId])

  if (!loadId) return <LoadPicker />
  if (loading && !data) return <Loader label="Scoring available trucks…" />
  if (error && !data) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!data) return <Loader />

  const { load, criteria, matches, total_candidates } = data

  const shortlist = async (m) => {
    try {
      const { data: r } = await api.post(`/load-requests/${loadId}/matches/${m.driver_id}/shortlist`)
      setData((d) => ({
        ...d,
        matches: d.matches.map((x) => x.driver_id === m.driver_id ? { ...x, is_shortlisted: r.is_shortlisted } : x),
      }))
    } catch { /* the match row is rebuilt on every run */ }
  }

  const mapMarkers = [
    ...(load.pickup_lat ? [{ lat: load.pickup_lat, lng: load.pickup_lng, label: load.pickup_location, type: 'pickup' }] : []),
    ...(load.drop_lat ? [{ lat: load.drop_lat, lng: load.drop_lng, label: load.drop_location, type: 'drop' }] : []),
    ...matches.filter((m) => m.current_lat).map((m) => ({
      lat: m.current_lat, lng: m.current_lng, label: m.truck_number, type: 'available',
    })),
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Smart Load Matching</div>
          <div className="page-sub">Find the best matching trucks for this load request</div>
        </div>
        <div className="page-actions">
          <Link to={`/load-requests/${load.id}`} className="btn btn-outline">Load details</Link>
          <button className="btn btn-primary" onClick={runMatching} disabled={loading}>
            <Sparkles size={15} /> {loading ? 'Matching…' : 'Find matching drivers'}
          </button>
        </div>
      </div>

      {/* ---- load details ---- */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Load Details</div>
          <StatusBadge status={load.status} />
        </div>
        <div className="card-body">
          <div className="grid grid-4" style={{ gap: 14 }}>
            <div><div className="spec-label">Load ID</div><div className="spec-value">{load.code}</div></div>
            <div><div className="spec-label">Customer</div><div className="spec-value">{load.customer_name}</div></div>
            <div><div className="spec-label">Pickup</div><div className="spec-value">{load.pickup_location}</div></div>
            <div><div className="spec-label">Drop</div><div className="spec-value">{load.drop_location}</div></div>
            <div><div className="spec-label">Load type</div><div className="spec-value">{load.load_type}</div></div>
            <div><div className="spec-label">Truck type</div><div className="spec-value">{load.truck_type}</div></div>
            <div><div className="spec-label">Weight</div><div className="spec-value">{load.weight_ton} Ton</div></div>
            <div><div className="spec-label">Distance</div><div className="spec-value">{load.distance_km} km</div></div>
            <div><div className="spec-label">Required date</div><div className="spec-value">{fmtDate(load.required_date)} · {load.required_time}</div></div>
          </div>
        </div>
      </div>

      {/* ---- criteria ---- */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Matching Criteria</div>
          <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
            {total_candidates} trucks screened
          </span>
        </div>
        <div className="card-body">
          <div className="criteria-grid">
            <div className="criteria-item"><div className="spec-label">Pickup location</div>
              <div className="spec-value">{criteria.pickup_location}</div></div>
            <div className="criteria-item"><div className="spec-label">Drop location</div>
              <div className="spec-value">{criteria.drop_location}</div></div>
            <div className="criteria-item"><div className="spec-label">Required date</div>
              <div className="spec-value">{fmtDate(criteria.required_date)} · {criteria.required_time}</div></div>
            <div className="criteria-item"><div className="spec-label">Truck type</div>
              <div className="spec-value">{criteria.truck_type}</div></div>
            <div className="criteria-item"><div className="spec-label">Load type</div>
              <div className="spec-value">{criteria.load_type}</div></div>
            <div className="criteria-item"><div className="spec-label">Weight</div>
              <div className="spec-value">{criteria.weight_ton} Ton</div></div>
            <div className="criteria-item"><div className="spec-label">Maximum budget</div>
              <div className="spec-value">{criteria.max_budget ? money(criteria.max_budget) : 'Not set'}</div></div>
            <div className="criteria-item"><div className="spec-label">Search radius</div>
              <div className="spec-value">{criteria.search_radius_km} km from pickup</div></div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr', alignItems: 'start' }}>
        {/* ---- matches ---- */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Best Matching Trucks</div>
            <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{matches.length} eligible</span>
          </div>
          <div className="card-body">
            {matches.length === 0 ? (
              <EmptyState icon={<Truck size={30} color="var(--muted-light)" />}
                title="No truck clears the filters for this load"
                hint="Every candidate failed on capacity, truck type, verification, distance, or is already on a trip. Widen the truck type or move the required date." />
            ) : matches.map((m, i) => (
              <div key={`${m.driver_id}-${m.truck_id}`}
                className={`match-card ${selected?.driver_id === m.driver_id ? 'selected' : ''} ${i === 0 ? 'best' : ''}`}>
                <div className="match-head">
                  <ScoreRing score={m.match_score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15.5, fontWeight: 700 }}>{m.truck_number}</span>
                      <StatusBadge status={m.grade} />
                      {m.is_shortlisted && <span className="badge badge-purple"><Bookmark size={11} /> Shortlisted</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
                      {m.truck_model || m.truck_type} · {m.driver_name} · {m.driver_phone}
                    </div>
                    <div style={{ display: 'flex', gap: 13, marginTop: 7, fontSize: 12.5, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} color="var(--orange)" fill="var(--orange)" /> {m.driver_rating}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
                        <MapPin size={13} /> {m.current_location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
                        <Truck size={13} /> {m.driver_total_trips} trips
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: '-.4px' }}>{money(m.estimated_fare)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>estimated fare</div>
                  </div>
                </div>

                <div className="match-specs">
                  <div><div className="spec-label">Capacity</div><div className="spec-value">{m.truck_capacity} Ton</div></div>
                  <div><div className="spec-label">Truck type</div><div className="spec-value">{m.truck_type}</div></div>
                  <div><div className="spec-label">Distance from pickup</div>
                    <div className="spec-value">{m.distance_from_pickup_km ?? '—'} km away</div></div>
                  <div><div className="spec-label">Availability</div>
                    <div className="spec-value"><StatusBadge status={m.driver_status} /></div></div>
                </div>

                <div className="match-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setDetail(m)}>View details</button>
                  <button className={`btn btn-sm ${selected?.driver_id === m.driver_id ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => setSelected(selected?.driver_id === m.driver_id ? null : m)}>
                    {selected?.driver_id === m.driver_id ? 'Selected' : 'Select'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => shortlist(m)}>
                    <Bookmark size={14} /> {m.is_shortlisted ? 'Remove' : 'Shortlist'}
                  </button>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
                    onClick={() => navigate(`/assign-load/${load.id}?driver=${m.driver_id}&truck=${m.truck_id}&fare=${m.estimated_fare}`)}>
                    Assign load <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- map + weights ---- */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Live Truck Locations</div></div>
            <div style={{ padding: 13 }}>
              <MapView markers={mapMarkers} height={290}
                route={load.pickup_lat && load.drop_lat
                  ? { from: { lat: load.pickup_lat, lng: load.pickup_lng },
                      to: { lat: load.drop_lat, lng: load.drop_lng } } : null} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">How the score is built</div>
              <Gauge size={16} color="var(--muted)" style={{ marginLeft: 'auto' }} />
            </div>
            <div className="card-body">
              {Object.entries(criteria.weights).map(([k, w]) => (
                <div className="score-bar-row" key={k}>
                  <span className="score-bar-name">{k.replace('_', ' ')}</span>
                  <span className="score-bar-track">
                    <span className="score-bar-fill" style={{ width: `${(w / 25) * 100}%` }} />
                  </span>
                  <span className="score-bar-val">{w} pts</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 11, lineHeight: 1.5 }}>
                Trucks below capacity, of the wrong type, unverified, already on a trip,
                or beyond {criteria.search_radius_km} km are filtered out before scoring.
              </div>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <Modal title={`${detail.truck_number} — ${detail.driver_name}`} onClose={() => setDetail(null)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
            <button className="btn btn-primary"
              onClick={() => navigate(`/assign-load/${load.id}?driver=${detail.driver_id}&truck=${detail.truck_id}&fare=${detail.estimated_fare}`)}>
              Assign this truck
            </button>
          </>}>
          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div className="kv-row"><span className="kv-key">Driver</span><span className="kv-val">{detail.driver_name}</span></div>
            <div className="kv-row"><span className="kv-key">Phone</span><span className="kv-val">{detail.driver_phone}</span></div>
            <div className="kv-row"><span className="kv-key">Truck number</span><span className="kv-val">{detail.truck_number}</span></div>
            <div className="kv-row"><span className="kv-key">Truck type</span><span className="kv-val">{detail.truck_type}</span></div>
            <div className="kv-row"><span className="kv-key">Capacity</span><span className="kv-val">{detail.truck_capacity} Ton</span></div>
            <div className="kv-row"><span className="kv-key">Location</span><span className="kv-val">{detail.current_location}</span></div>
            <div className="kv-row"><span className="kv-key">Distance from pickup</span><span className="kv-val">{detail.distance_from_pickup_km} km</span></div>
            <div className="kv-row"><span className="kv-key">Rating</span><span className="kv-val">{detail.driver_rating} ★</span></div>
          </div>

          <div className="card-title" style={{ marginBottom: 10 }}>Score breakdown — {detail.match_score}%</div>
          {Object.entries(detail.score_breakdown || {}).map(([k, v]) => (
            <div className="score-bar-row" key={k}>
              <span className="score-bar-name">{k.replace('_', ' ')}</span>
              <span className="score-bar-track">
                <span className="score-bar-fill" style={{ width: `${v.score * 100}%` }} />
              </span>
              <span className="score-bar-val">{v.points} / {v.weight}</span>
            </div>
          ))}

          <div className="card-title" style={{ margin: '18px 0 10px' }}>Estimated fare — {money(detail.estimated_fare)}</div>
          {detail.fare_breakdown && (
            <div>
              {[['Base fare', 'base_fare'], ['Distance charge', 'distance_charge'],
                ['Weight charge', 'weight_charge'], ['Toll', 'toll_charge'],
                ['Loading', 'loading_charge'], ['Unloading', 'unloading_charge'],
                ['Driver bata', 'driver_bata'], ['Platform fee', 'platform_fee'],
                ['GST', 'gst'], [`Surge (${detail.fare_breakdown.surge_level} · ${detail.fare_breakdown.surge_multiplier}x)`, 'surge_amount'],
              ].map(([label, key]) => (
                <div className="kv-row" key={key}>
                  <span className="kv-key">{label}</span>
                  <span className="kv-val">{money(detail.fare_breakdown[key])}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
