import { useEffect, useState } from 'react'
import { MapPin, Package, Weight, XCircle } from 'lucide-react'
import api, { fmtDate, money, apiError } from '../../services/api'
import Modal from '../../components/Modal'
import Loader, { EmptyState } from '../../components/Loader'

export default function AvailableLoads() {
  const [data, setData] = useState(null)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState('')

  const load = (clear = false) => {
    if (clear) setData(null)
    api.get('/driver/available-loads').then(({ data }) => setData(data))
  }
  useEffect(() => {
    load(true)
    const timer = setInterval(() => load(false), 5000)
    const onFocus = () => load(false)
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])

  const accept = async (l) => {
    setBusy(true); setError(''); setAccepted('')
    try {
      const { data: r } = await api.post(`/driver/loads/${l.id}/accept`)
      setDetail(null)
      // Acceptance reserves the load; operations confirm it before the trip
      // exists, so there is no trip to open yet.
      setAccepted(r.message || `You accepted ${l.code}. Operations will confirm shortly.`)
      load()
    } catch (err) {
      setError(apiError(err, 'Could not accept this load.'))
      load()
    } finally { setBusy(false) }
  }

  const reject = async (l) => {
    setBusy(true); setError(''); setAccepted('')
    try {
      const { data: r } = await api.post(`/driver/loads/${l.id}/reject`)
      setDetail(null)
      setAccepted(r.message || `You rejected ${l.code}.`)
      load()
    } catch (err) {
      setError(apiError(err, 'Could not reject this load.'))
      load()
    } finally { setBusy(false) }
  }

  if (!data) return <Loader label="Finding loads for your truck…" />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Available Loads</div>
          <div className="page-sub">
            {data.eligible
              ? (data.matched_count > 0 ? 'Real customer loads matched to your active availability.' : 'Matching uses your verified truck and published availability.')
              : 'Loads your truck can carry will appear here.'}
          </div>
        </div>
        {data.eligible && data.matched_count > 0 && (
          <div className="page-actions">
            <span className="badge badge-green">
              {data.matched_count} matched for you
            </span>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {accepted && (
        <div className="alert alert-success">
          {accepted} You'll see it under My Trips once operations confirm.
        </div>
      )}

      {!data.eligible ? (
        <div className="card">
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />}
            title="No loads available right now" hint={data.reason} />
        </div>
      ) : data.loads.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />}
            title="No matching loads available"
            hint={data.reason || "We only show loads within your capacity, type, route and availability window."} />
        </div>
      ) : (
        <div className="grid grid-2">
          {data.loads.map((l) => (
            <div className="card load-card" key={l.id}
              style={l.matched_to_you ? { borderColor: 'var(--green)' } : undefined}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {l.matched_to_you && (
                      <span className="badge badge-green" style={{ marginBottom: 6 }}>
                        Matched for you
                      </span>
                    )}
                    <div className="card-title">{l.pickup_location} → {l.drop_location}</div>
                    <div className="muted-copy" style={{ margin: '4px 0 0' }}>
                      {l.code} · {l.load_type} · {l.customer_name}
                    </div>
                    {l.match_score != null && (
                      <div className="cell-sub" style={{ marginTop: 4 }}>
                        Automatic match score: {l.match_score}/100
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 750 }}>{money(l.estimated_fare)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>estimated</div>
                  </div>
                </div>

                <div className="match-specs" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  <div><div className="spec-label">Weight</div><div className="spec-value">{l.weight_ton} T</div></div>
                  <div><div className="spec-label">Trip distance</div><div className="spec-value">{l.distance_km} km</div></div>
                  <div><div className="spec-label">From you</div>
                    <div className="spec-value">{l.distance_from_you_km ?? '—'} km</div></div>
                  <div><div className="spec-label">Required</div>
                    <div className="spec-value">{fmtDate(l.required_date)}</div></div>
                </div>

                <div className="match-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setDetail(l)}>View Details</button>
                  <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}
                    onClick={() => reject(l)} disabled={busy}><XCircle size={14} /> Reject</button>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => accept(l)} disabled={busy}>Accept Load</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <Modal title={`${detail.code} — load details`} onClose={() => setDetail(null)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
            <button className="btn btn-outline" onClick={() => reject(detail)} disabled={busy}>Reject</button>
            <button className="btn btn-primary" onClick={() => accept(detail)} disabled={busy}>
              {busy ? 'Accepting…' : 'Accept Load'}
            </button>
          </>}>
          <div className="kv-row"><span className="kv-key">Pickup</span><span className="kv-val">{detail.pickup_location}</span></div>
          <div className="kv-row"><span className="kv-key">Drop</span><span className="kv-val">{detail.drop_location}</span></div>
          {detail.load_image_url && <img src={detail.load_image_url} alt="Load" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />}
          <div className="kv-row"><span className="kv-key">Customer</span><span className="kv-val">{detail.customer_name}</span></div>
          <div className="kv-row"><span className="kv-key">Customer contact</span><span className="kv-val">Available after admin confirms the assignment</span></div>
          <div className="kv-row"><span className="kv-key">Load type</span><span className="kv-val">{detail.load_type}</span></div>
          <div className="kv-row"><span className="kv-key">Truck type required</span><span className="kv-val">{detail.truck_type}</span></div>
          {detail.matched_truck && <div className="kv-row"><span className="kv-key">Matched truck</span>
            <span className="kv-val">{detail.matched_truck.number} · {detail.matched_truck.type} · {detail.matched_truck.capacity_ton} T</span></div>}
          <div className="kv-row"><span className="kv-key">Weight</span><span className="kv-val">{detail.weight_ton} Ton</span></div>
          <div className="kv-row"><span className="kv-key">Trip distance</span><span className="kv-val">{detail.distance_km} km</span></div>
          <div className="kv-row"><span className="kv-key">Distance from you</span>
            <span className="kv-val">{detail.distance_from_you_km ?? '—'} km</span></div>
          <div className="kv-row"><span className="kv-key">Required</span>
            <span className="kv-val">{fmtDate(detail.required_date)} · {detail.required_time}</span></div>
          <div className="kv-row"><span className="kv-key">Estimated fare</span>
            <span className="kv-val">{money(detail.estimated_fare)}</span></div>
          {detail.match_score != null && (
            <div className="kv-row"><span className="kv-key">Match score</span>
              <span className="kv-val">{detail.match_score}/100</span></div>
          )}
          {detail.availability && (
            <div className="kv-row"><span className="kv-key">Matched against</span>
              <span className="kv-val">
                {detail.availability.from} → {detail.availability.preferred_drop || 'Any destination'} · {' '}
                {fmtDate(detail.availability.available_from)} {detail.availability.available_from_time}
              </span></div>
          )}
          {detail.special_instructions && (
            <div className="kv-row"><span className="kv-key">Instructions</span>
              <span className="kv-val">{detail.special_instructions}</span></div>
          )}
        </Modal>
      )}
    </div>
  )
}
