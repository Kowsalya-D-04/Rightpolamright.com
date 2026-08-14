import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, IndianRupee, Route as RouteIcon, Send } from 'lucide-react'
import api, { apiError, money } from '../../services/api'
import LocationPicker from '../../components/LocationPicker'
import ImageUpload from '../../components/ImageUpload'
import MapView from '../../components/MapView'

const LOAD_TYPES = ['General Goods', 'Fragile', 'Perishable', 'Machinery', 'Textiles', 'Cement']
const TRUCK_TYPES = ['Open Truck', 'Container', 'Trailer', 'Tipper', 'Tanker']

export default function BookLoad() {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState({ name: '', lat: null, lng: null })
  const [drop, setDrop] = useState({ name: '', lat: null, lng: null })
  const [form, setForm] = useState({
    load_type: 'General Goods', truck_type: 'Open Truck', weight_ton: '',
    required_date: '', required_time: '09:00', special_instructions: '',
  })
  const [image, setImage] = useState(null)
  const [quote, setQuote] = useState(null)
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Distance and price come from the backend as soon as there is enough to
  // price. The customer never types a distance or works out a fare.
  useEffect(() => {
    if (!pickup.name || !drop.name || !form.weight_ton || Number(form.weight_ton) <= 0) {
      setQuote(null); setQuoteError('')
      return
    }
    const t = setTimeout(() => {
      setQuoting(true); setQuoteError('')
      api.post('/pricing/quote', {
        pickup_location: pickup.name, drop_location: drop.name,
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        drop_lat: drop.lat, drop_lng: drop.lng,
        weight_ton: Number(form.weight_ton), truck_type: form.truck_type,
      })
        .then(({ data }) => setQuote(data))
        .catch((err) => { setQuote(null); setQuoteError(apiError(err, 'Could not price that route.')) })
        .finally(() => setQuoting(false))
    }, 400)
    return () => clearTimeout(t)
  }, [pickup.name, drop.name, form.weight_ton, form.truck_type])

  const submit = async () => {
    setError('')
    if (!pickup.name || !drop.name) return setError('Choose both a pickup and a drop location.')
    if (!form.weight_ton || Number(form.weight_ton) <= 0) return setError('Enter the load weight in tons.')
    if (!form.required_date) return setError('Pick the date the load needs to move.')

    setSaving(true)
    try {
      await api.post('/customer/loads', {
        pickup_location: pickup.name, drop_location: drop.name,
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        drop_lat: drop.lat, drop_lng: drop.lng,
        load_type: form.load_type, truck_type: form.truck_type,
        weight_ton: Number(form.weight_ton),
        required_date: form.required_date, required_time: form.required_time,
        special_instructions: form.special_instructions || null,
        load_image_url: image,
      })
      navigate('/customer/loads')
    } catch (err) {
      setError(apiError(err, 'Could not create the load request.'))
    } finally {
      setSaving(false)
    }
  }

  const markers = [
    ...(quote?.pickup ? [{ ...quote.pickup, label: quote.pickup.name, type: 'pickup' }] : []),
    ...(quote?.drop ? [{ ...quote.drop, label: quote.drop.name, type: 'drop' }] : []),
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Book a Load</div>
          <div className="page-sub">Tell us the route and the goods — we price it and find the truck.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Consignment details</div></div>
          <div className="card-body">
            {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

            <div className="grid grid-2">
              <LocationPicker label="Pickup location" value={pickup.name}
                onChange={setPickup} placeholder="e.g. Chennai" />
              <LocationPicker label="Drop location" value={drop.name}
                onChange={setDrop} placeholder="e.g. Bangalore" />
            </div>

            <div className="grid grid-2">
              <div className="field">
                <label className="label">Load type</label>
                <select className="select" value={form.load_type} onChange={set('load_type')}>
                  {LOAD_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Truck type</label>
                <select className="select" value={form.truck_type} onChange={set('truck_type')}>
                  {TRUCK_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Weight (tons)</label>
                <input className="input" type="number" min="0.5" step="0.5"
                  value={form.weight_ton} onChange={set('weight_ton')} placeholder="10" />
              </div>
              <div className="field">
                <label className="label">Pickup date</label>
                <input className="input" type="date" value={form.required_date}
                  onChange={set('required_date')} />
              </div>
              <div className="field">
                <label className="label">Pickup time</label>
                <input className="input" type="time" value={form.required_time}
                  onChange={set('required_time')} />
              </div>
            </div>

            <ImageUpload value={image} onChange={setImage} />

            <div className="field">
              <label className="label">Special instructions</label>
              <textarea className="textarea" value={form.special_instructions}
                onChange={set('special_instructions')}
                placeholder="Anything the driver should know before pickup." />
            </div>

            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              <Send size={15} /> {saving ? 'Creating…' : 'Submit load request'}
            </button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <div className="card-title">Route</div>
              {quote?.distance_km && (
                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
                  {quote.distance_km} km
                </span>
              )}
            </div>
            <div style={{ padding: 13 }}>
              {markers.length === 2 ? (
                <MapView height={230} showLegend={false} markers={markers}
                  route={{ from: quote.pickup, to: quote.drop }} />
              ) : (
                <div style={{
                  height: 230, display: 'grid', placeItems: 'center', color: 'var(--muted)',
                  background: '#F8FAFC', borderRadius: 8, border: '1px dashed var(--line)',
                  textAlign: 'center', padding: 20,
                }}>
                  <div>
                    <RouteIcon size={26} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13 }}>
                      Choose a pickup and drop location to see the route and distance.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Estimated price</div>
              <IndianRupee size={16} color="var(--muted)" style={{ marginLeft: 'auto' }} />
            </div>
            <div className="card-body">
              {quoting && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Pricing the route…</div>}
              {!quoting && quoteError && (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>{quoteError}</div>
              )}
              {!quoting && !quoteError && !quote && (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Add the route and weight and we'll price it automatically.
                </div>
              )}
              {!quoting && quote && (
                <>
                  <div style={{ fontSize: 27, fontWeight: 750, letterSpacing: '-.6px' }}>
                    {money(quote.estimated_fare)}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                    {money(quote.unit_price_per_km)}/km × {quote.distance_km} km
                  </div>
                  {[['Base price (distance × rate)', 'base_price'], ['Fixed base charge', 'base_fare'],
                    ['Weight charge', 'weight_charge'], ['Toll', 'toll_charge'],
                    ['Loading', 'loading_charge'], ['Unloading', 'unloading_charge'],
                    ['Driver bata', 'driver_bata'], ['Platform fee', 'platform_fee'],
                    ['GST', 'gst'],
                    [`Surge (${quote.breakdown.surge_level} · ${quote.breakdown.surge_multiplier}×)`, 'surge_amount'],
                  ].map(([label, key]) => (
                    <div className="kv-row" key={key}>
                      <span className="kv-key">{label}</span>
                      <span className="kv-val">{money(quote.breakdown[key])}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>
                    Estimate is calculated by the backend from the admin-configured rate and charges.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
