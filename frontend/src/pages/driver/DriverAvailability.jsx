import { useEffect, useState } from 'react'
import { CalendarCheck, Power, Plus, Trash2, Truck } from 'lucide-react'
import api, { apiError, fmtDate } from '../../services/api'
import LocationPicker from '../../components/LocationPicker'
import Loader, { EmptyState } from '../../components/Loader'

/**
 * Driver availability is real backend state. Publishing a slot immediately
 * triggers matching against waiting customer loads; switching availability OFF
 * releases any unaccepted offers and lets the backend try another driver.
 */
export default function DriverAvailability() {
  const [slots, setSlots] = useState(null)
  const [trucks, setTrucks] = useState([])
  const [status, setStatus] = useState('Offline')
  const [truckId, setTruckId] = useState('')
  const [from, setFrom] = useState({ name: '', lat: null, lng: null })
  const [drop, setDrop] = useState({ name: '', lat: null, lng: null })
  const [dates, setDates] = useState({
    available_from: '', available_to: '',
    available_from_time: '00:00', available_to_time: '23:59',
  })
  const [radius, setRadius] = useState(250)
  const [notes, setNotes] = useState('')
  const [tripType, setTripType] = useState('NEW_LOAD')
  const [availableCapacity, setAvailableCapacity] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const [matchedNow, setMatchedNow] = useState(null)

  const load = async () => {
    try {
      const [slotRes, truckRes, profileRes] = await Promise.all([
        api.get('/driver/availability'),
        api.get('/driver/trucks'),
        api.get('/driver/profile'),
      ])
      setSlots(slotRes.data)
      setTrucks(truckRes.data)
      setStatus(profileRes.data?.driver?.status || 'Offline')
      if (!truckId && truckRes.data.length) setTruckId(String(truckRes.data[0].id))
    } catch {
      setSlots([])
    }
  }
  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])

  const toggleAvailability = async () => {
    const next = status === 'Online' ? 'Offline' : 'Online'
    setBusy(true); setError(''); setOk('')
    try {
      const { data } = await api.put('/driver/status', { status: next })
      setStatus(data.status)
      if (data.status === 'Online') {
        setOk(data.matched_loads
          ? `Availability ON. ${data.matched_loads} waiting load(s) matched to you.`
          : 'Availability ON. Publish a date, truck and route below to enter the matching pool.')
      } else {
        setOk('Availability OFF. Unaccepted load offers were released for rematching.')
      }
    } catch (err) {
      setError(apiError(err, 'Could not change availability.'))
    } finally { setBusy(false) }
  }

  const save = async () => {
    setError(''); setOk('')
    if (!truckId) return setError('Select the truck you will use.')
    if (!from.name || from.lat == null || from.lng == null) {
      return setError('Choose your starting location from the map suggestions.')
    }
    if (!dates.available_from) return setError('Pick the first date you are free.')
    if (dates.available_to && dates.available_to < dates.available_from) {
      return setError('Available-to date cannot be before available-from date.')
    }
    setBusy(true)
    try {
      await api.post('/driver/availability', {
        available_from: dates.available_from,
        available_to: dates.available_to || dates.available_from,
        available_from_time: dates.available_from_time,
        available_to_time: dates.available_to_time,
        from_location: from.name,
        from_lat: from.lat,
        from_lng: from.lng,
        preferred_drop: drop.name || null,
        preferred_drop_lat: drop.lat,
        preferred_drop_lng: drop.lng,
        max_distance_km: Number(radius) || 250,
        truck_id: Number(truckId),
        trip_type: tripType,
        total_capacity_ton: truckById(Number(truckId))?.capacity_ton || null,
        available_capacity_ton: availableCapacity === '' ? (truckById(Number(truckId))?.capacity_ton || null) : Number(availableCapacity),
        notes: notes || null,
      })
      // The POST runs backend matching; fetch the matching API immediately so
      // this screen reports what the database actually produced.
      const { data: matches } = await api.get('/driver/available-loads')
      setMatchedNow(matches)
      setStatus('Online')
      setOk(matches.matched_count > 0
        ? `Availability published. ${matches.matched_count} matching load(s) are ready in Matching Loads.`
        : (matches.reason || 'Availability published. No compatible waiting load exists right now.'))
      setDates({ available_from: '', available_to: '', available_from_time: '00:00', available_to_time: '23:59' })
      setNotes(''); setDrop({ name: '', lat: null, lng: null })
      await load()
    } catch (err) {
      setError(apiError(err, 'Could not publish that availability.'))
    } finally { setBusy(false) }
  }

  const remove = async (id) => {
    setError(''); setOk('')
    try {
      await api.delete(`/driver/availability/${id}`)
      setOk('Availability slot removed. Any affected unaccepted offers were rematched.')
      await load()
    } catch (err) {
      setError(apiError(err, 'Could not remove availability.'))
    }
  }

  const truckById = (id) => trucks.find((t) => t.id === id)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">My Availability</div>
          <div className="page-sub">Go online, choose your truck and route, and receive only compatible real customer loads.</div>
        </div>
        <button className={`btn ${status === 'Online' ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleAvailability} disabled={busy}>
          <Power size={15} /> {status === 'Online' ? 'AVAILABLE · ON' : 'UNAVAILABLE · OFF'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}
      {matchedNow?.matched_count > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          {matchedNow.matched_count} real customer load(s) matched.{' '}
          <a href="/driver/available-loads" className="link">Open Matching Loads</a>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="card-title" style={{ marginBottom: 8 }}>How automatic matching works</div>
          <div className="muted-copy">
            A waiting customer load is offered only when your availability window covers its pickup time,
            your selected truck can carry the weight, the truck type is compatible, your start location is
            within your pickup radius, and the load destination follows your preferred route when you set one.
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.25fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Publish availability</div></div>
          <div className="card-body">
            <div className="field">
              <label className="label">Truck / vehicle</label>
              <select className="input" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
                <option value="">Select your truck</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.truck_number} · {t.truck_type} · {t.capacity_ton} Ton
                  </option>
                ))}
              </select>
              {truckId && truckById(Number(truckId)) && (
                <div className="cell-sub">
                  <Truck size={12} style={{ verticalAlign: 'middle' }} />{' '}
                  Backend matching uses this truck's real type and capacity.
                </div>
              )}
            </div>

            <div className="grid grid-2">
              <div className="field">
                <label className="label">Available from</label>
                <input className="input" type="date" value={dates.available_from}
                  onChange={(e) => setDates((d) => ({ ...d, available_from: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Available to</label>
                <input className="input" type="date" value={dates.available_to}
                  onChange={(e) => setDates((d) => ({ ...d, available_to: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label">Available from time</label>
                <input className="input" type="time" value={dates.available_from_time}
                  onChange={(e) => setDates((d) => ({ ...d, available_from_time: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Available to time</label>
                <input className="input" type="time" value={dates.available_to_time}
                  onChange={(e) => setDates((d) => ({ ...d, available_to_time: e.target.value }))} />
              </div>
            </div>

            <LocationPicker label="Pickup / starting location" value={from.name}
              onChange={setFrom} placeholder="e.g. Chennai" />
            <LocationPicker label="Drop / preferred destination (optional)" value={drop.name}
              onChange={setDrop} placeholder="e.g. Coimbatore" />


            <div className="grid grid-2">
              <div className="field"><label className="label">Trip type</label><select className="select" value={tripType} onChange={(e)=>setTripType(e.target.value)}><option value="NEW_LOAD">New load</option><option value="RETURN_LOAD">Return load</option><option value="PARTIAL_LOAD">Partial load</option><option value="ON_THE_WAY_LOAD">On-the-way load</option></select></div>
              <div className="field"><label className="label">Available capacity (Ton)</label><input className="input" type="number" min="0" step="0.5" value={availableCapacity} onChange={(e)=>setAvailableCapacity(e.target.value)} placeholder={truckById(Number(truckId))?.capacity_ton || 'Capacity'} /></div>
            </div>

            <div className="field">
              <label className="label">Maximum distance to pickup (km)</label>
              <input className="input" type="number" min="1" max="250" value={radius}
                onChange={(e) => setRadius(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Notes (optional)</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. return leg only" />
            </div>

            <button className="btn btn-primary" onClick={save} disabled={busy || !trucks.length}>
              <Plus size={15} /> {busy ? 'Publishing…' : 'Publish & Match Loads'}
            </button>
            {!trucks.length && <div className="cell-sub" style={{ marginTop: 8 }}>No truck is registered to this driver account.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Published slots</div>
            {slots?.length > 0 && <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{slots.length}</span>}
          </div>
          {slots === null ? <Loader /> : slots.length === 0 ? (
            <EmptyState icon={<CalendarCheck size={30} color="var(--muted-light)" />}
              title="No availability published"
              hint="Publish a real availability slot to enter the automatic matching pool." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Dates</th><th>Truck</th><th>From</th><th>Preferred drop</th><th>Radius</th><th></th></tr></thead>
                <tbody>
                  {slots.map((s) => {
                    const t = truckById(s.truck_id)
                    return (
                      <tr key={s.id}>
                        <td className="cell-strong">{fmtDate(s.available_from)}
                          <div className="cell-sub">{s.available_from_time} → {s.available_to_time}</div>
                          <div className="cell-sub">to {fmtDate(s.available_to)}</div></td>
                        <td>{t ? <>{t.truck_number}<div className="cell-sub">{t.truck_type} · {t.capacity_ton}T</div></> : '—'}</td>
                        <td>{s.from_location}</td>
                        <td>{s.preferred_drop || 'Any route'}</td>
                        <td className="cell-mono">{s.max_distance_km} km</td>
                        <td><button className="btn-ghost" style={{ color: 'var(--red)' }}
                          onClick={() => remove(s.id)}><Trash2 size={14} /> Remove</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
