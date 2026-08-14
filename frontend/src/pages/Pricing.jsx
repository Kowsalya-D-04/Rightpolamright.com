import { useEffect, useState } from 'react'
import { Calculator, Check, Pencil, X } from 'lucide-react'
import api, { apiError, money } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'

const TYPES = ['Open Truck', 'Container', 'Trailer', 'Tipper', 'Tanker']

const RATE_FIELDS = [
  ['base_fare', 'Base Fare'], ['rate_per_km', 'Per KM'], ['rate_per_ton', 'Per Ton'],
  ['loading_charge', 'Loading'], ['unloading_charge', 'Unloading'],
  ['driver_bata', 'Driver Bata'], ['platform_fee_percent', 'Platform Fee %'],
  ['gst_percent', 'GST %'],
]

export default function Pricing() {
  const [rules, setRules] = useState(null)
  const [demand, setDemand] = useState(null)
  const [form, setForm] = useState({
    pickup_location: 'Chennai', drop_location: 'Bangalore', weight_ton: 10, truck_type: 'Open Truck',
  })
  const [quote, setQuote] = useState(null)
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const refreshRules = () => api.get('/pricing/rules').then(({ data }) => setRules(data))

  useEffect(() => {
    refreshRules()
    api.get('/pricing/demand').then(({ data }) => setDemand(data))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const calculate = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/pricing/calculate', { ...form, weight_ton: Number(form.weight_ton) })
      setQuote(data)
    } finally { setBusy(false) }
  }

  const startEdit = (r) => {
    setSaveError('')
    setEditingId(r.id)
    setEditForm(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, r[k]])))
  }
  const cancelEdit = () => { setEditingId(null); setSaveError('') }
  const setEditField = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))

  const saveRule = async (id) => {
    setSaving(true); setSaveError('')
    try {
      const payload = Object.fromEntries(
        RATE_FIELDS.map(([k]) => [k, editForm[k] === '' ? null : Number(editForm[k])]))
      await api.put(`/pricing/rules/${id}`, payload)
      setEditingId(null)
      await refreshRules()
      if (quote) calculate()
    } catch (err) {
      setSaveError(apiError(err, 'Could not save that rate card.'))
    } finally {
      setSaving(false)
    }
  }

  if (!rules) return <Loader />

  const lines = quote && [
    ['Base fare', quote.base_fare], [`Distance charge (${quote.distance_km} km @ ₹${quote.rate_per_km}/km)`, quote.distance_charge],
    ['Weight charge', quote.weight_charge], ['Toll charges', quote.toll_charge],
    ['Loading charges', quote.loading_charge], ['Unloading charges', quote.unloading_charge],
    ['Driver bata', quote.driver_bata], ['Platform fee', quote.platform_fee], ['GST', quote.gst],
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Tariffs & Pricing</div>
          <div className="page-sub">Rate cards and the live fare calculator.</div>
        </div>
        {demand && (
          <div className="page-actions">
            <span className="badge badge-gray">{demand.pending_loads} pending loads</span>
            <span className="badge badge-gray">{demand.available_trucks} trucks free</span>
            <StatusBadge status={demand.level} />
          </div>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start', marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Fare calculator</div></div>
          <div className="card-body">
            <div className="grid grid-2">
              <div className="field"><label className="label">Pickup</label>
                <input className="input" value={form.pickup_location} onChange={set('pickup_location')} /></div>
              <div className="field"><label className="label">Drop</label>
                <input className="input" value={form.drop_location} onChange={set('drop_location')} /></div>
              <div className="field"><label className="label">Weight (tons)</label>
                <input className="input" type="number" value={form.weight_ton} onChange={set('weight_ton')} /></div>
              <div className="field"><label className="label">Truck type</label>
                <select className="select" value={form.truck_type} onChange={set('truck_type')}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            </div>
            <button className="btn btn-primary" onClick={calculate} disabled={busy}>
              <Calculator size={15} /> {busy ? 'Calculating…' : 'Calculate fare'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Fare breakdown</div>
            {quote && <StatusBadge status={quote.surge_level} />}</div>
          <div className="card-body">
            {!quote ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Run the calculator to see how a fare is built up.
              </div>
            ) : (
              <>
                {lines.map(([label, val]) => (
                  <div className="kv-row" key={label}>
                    <span className="kv-key">{label}</span><span className="kv-val">{money(val)}</span>
                  </div>
                ))}
                <div className="kv-row">
                  <span className="kv-key">Surge ({quote.surge_multiplier}x — {quote.surge_level} demand)</span>
                  <span className="kv-val">{money(quote.surge_amount)}</span>
                </div>
                <div className="invoice-total" style={{ fontSize: 16 }}>
                  <span>Final estimated fare</span><span>{money(quote.total_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Rate card by truck type</div>
          <span className="page-sub" style={{ marginLeft: 'auto', fontSize: 12 }}>
            Admin-configurable — changes apply everywhere immediately
          </span>
        </div>
        {saveError && <div className="alert alert-error" style={{ margin: '0 16px' }}>{saveError}</div>}
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Truck Type</th><th>Base Fare</th><th>Per KM</th><th>Per Ton</th>
              <th>Loading</th><th>Unloading</th><th>Driver Bata</th><th>Platform Fee</th><th>GST</th>
              <th></th></tr></thead>
            <tbody>
              {rules.pricing_rules.map((r) => {
                const editing = editingId === r.id
                return (
                  <tr key={r.id}>
                    <td className="cell-strong">{r.truck_type}</td>
                    {RATE_FIELDS.map(([k]) => (
                      <td className="cell-mono" key={k}>
                        {editing ? (
                          <input className="input" type="number" step="0.5"
                            style={{ width: 90, padding: '4px 6px' }}
                            value={editForm[k]} onChange={setEditField(k)} />
                        ) : k.endsWith('_percent') ? `${r[k]}%`
                          : (k === 'rate_per_km' || k === 'rate_per_ton') ? `₹${r[k]}`
                          : money(r[k])}
                      </td>
                    ))}
                    <td>
                      {editing ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" title="Save" disabled={saving}
                            onClick={() => saveRule(r.id)}><Check size={14} /></button>
                          <button className="btn-icon" title="Cancel" disabled={saving}
                            onClick={cancelEdit}><X size={14} /></button>
                        </div>
                      ) : (
                        <button className="btn-icon" title="Edit rate card" onClick={() => startEdit(r)}>
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Route tariffs</div></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Origin</th><th>Destination</th><th>Distance</th><th>Toll</th><th>Demand</th></tr></thead>
            <tbody>
              {rules.route_pricing.map((r) => (
                <tr key={r.id}>
                  <td>{r.origin}</td><td>{r.destination}</td>
                  <td className="cell-mono">{r.distance_km} km</td>
                  <td className="cell-mono">{money(r.toll_charge)}</td>
                  <td><StatusBadge status={r.demand_level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
