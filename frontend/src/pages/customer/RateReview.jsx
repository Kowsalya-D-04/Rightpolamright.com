import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import api, { apiError } from '../../services/api'
import Loader, { EmptyState } from '../../components/Loader'

function Stars({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}
          style={{ lineHeight: 0 }}>
          <Star size={26} color="var(--orange)" fill={n <= value ? 'var(--orange)' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function RateReview() {
  const [trips, setTrips] = useState(null)
  const [active, setActive] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get('/customer/reviewable-trips').then(({ data }) => setTrips(data))
  useEffect(() => { load() }, [])

  const submit = async () => {
    setBusy(true); setError('')
    try {
      const { data } = await api.post(`/customer/trips/${active.id}/review`, { rating, comment })
      setMsg(data.message)
      setActive(null); setComment(''); setRating(5)
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setError(apiError(err, 'Could not submit the review.'))
    } finally { setBusy(false) }
  }

  if (trips === null) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Rate & Review</div>
          <div className="page-sub">Tell us how your delivered trips went.</div>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {trips.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Star size={30} color="var(--muted-light)" />}
            title="No delivered trips yet"
            hint="Once a consignment is delivered you can rate the driver here." />
        </div>
      ) : (
        <div className="grid grid-2">
          {trips.map((t) => (
            <div className="card" key={t.id}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="card-title">{t.code}</div>
                    <div className="muted-copy" style={{ margin: '4px 0 0' }}>{t.route}</div>
                    <div className="muted-copy" style={{ margin: 0 }}>
                      {t.driver_name} · {t.truck_number}
                    </div>
                  </div>
                  {t.reviewed && <span className="badge badge-green">Reviewed</span>}
                </div>

                {!t.reviewed && active?.id !== t.id && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }}
                    onClick={() => { setActive(t); setError('') }}>Write a review</button>
                )}

                {active?.id === t.id && (
                  <div style={{ marginTop: 14 }}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <label className="label">Rate your experience</label>
                    <Stars value={rating} onChange={setRating} />
                    <div className="field" style={{ marginTop: 12 }}>
                      <label className="label">Your review (optional)</label>
                      <textarea className="textarea" value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Great service!" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setActive(null)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
                        {busy ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
