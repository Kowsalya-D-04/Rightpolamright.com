import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Package, Route, User, Wallet } from 'lucide-react'
import api, { fmtDate, money, apiError } from '../../services/api'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

export default function DriverDashboard() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [matches, setMatches] = useState(null)
  const [matchError, setMatchError] = useState('')
  const [matchMessage, setMatchMessage] = useState('')

  const load = () => {
    api.get('/driver/dashboard').then(({ data }) => setData(data)).catch(() => {})
    api.get('/driver/available-loads').then(({ data }) => { setMatches(data); setMatchError('') })
      .catch((err) => setMatchError(apiError(err, 'Could not load matching loads.')))
  }
  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])
  if (!data) return <Loader label="Loading your day…" />
  const { driver, stats, schedule } = data

  const toggle = async () => {
    setBusy(true)
    try {
      await api.put('/driver/status', { status: driver.status === 'Online' ? 'Offline' : 'Online' })
      load()
    } catch (err) {
      alert(apiError(err, 'Could not change your status.'))
    } finally { setBusy(false) }
  }

  const respondToLoad = async (loadId, action) => {
    setBusy(true); setMatchError(''); setMatchMessage('')
    try {
      const { data: result } = await api.post(`/driver/loads/${loadId}/${action}`)
      setMatchMessage(result.message || `Load ${action}ed.`)
      load()
    } catch (err) {
      setMatchError(apiError(err, `Could not ${action} this load.`))
      load()
    } finally { setBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Hi, {driver.name}</div>
          <div className="page-sub">{driver.code} · rated {driver.rating} ★</div>
        </div>
        <div className="page-actions">
          <button className={`btn ${driver.status === 'Online' ? 'btn-success' : 'btn-outline'}`}
            onClick={toggle} disabled={busy || driver.status === 'Busy'}>
            <span className={`status-dot ${driver.status === 'Online' ? 'on' : 'off'}`} />
            {driver.status === 'Busy' ? 'On a trip' : driver.status}
          </button>
        </div>
      </div>

      {driver.kyc_status !== 'Verified' && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Your documents are being verified. Loads open up as soon as operations approve your account.
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon={<Route size={19} />} label="Today's Trips" value={stats.todays_trips} tone="blue" />
        <StatCard icon={<CheckCircle2 size={19} />} label="Completed Trips" value={stats.completed_trips}
          foot={`${stats.total_trips} lifetime`} tone="green" />
        <StatCard icon={<Wallet size={19} />} label="Today's Earnings" value={money(stats.todays_earnings)} tone="purple" />
        <StatCard icon={<User size={19} />} label="Status" value={driver.status}
          foot={driver.kyc_status === 'Verified' ? 'Verified' : 'Awaiting verification'}
          tone={driver.status === 'Online' ? 'green' : driver.status === 'Busy' ? 'orange' : 'blue'} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><div className="card-title">Quick Actions</div></div>
        <div className="card-body quick-actions">
          <Link to="/driver/available-loads" className="quick-action">
            <span className="feature-icon"><Package size={19} /></span> Available Loads</Link>
          <Link to="/driver/trips" className="quick-action">
            <span className="feature-icon"><Route size={19} /></span> My Trips</Link>
          <Link to="/driver/earnings" className="quick-action">
            <span className="feature-icon"><Wallet size={19} /></span> Earnings</Link>
          <Link to="/driver/profile" className="quick-action">
            <span className="feature-icon"><User size={19} /></span> Profile</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Matching Loads</div>
          {matches?.matched_count > 0 && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>{matches.matched_count} matched</span>}
        </div>
        {matchMessage && <div className="card-body" style={{ paddingBottom: 0 }}><div className="alert alert-success">{matchMessage}</div></div>}
        {matchError ? (
          <div className="card-body"><div className="alert alert-error">{matchError}</div></div>
        ) : !matches ? (
          <Loader label="Checking real customer loads…" />
        ) : matches.loads.length === 0 ? (
          <EmptyState icon={<Package size={30} color="var(--muted-light)" />}
            title="No matching loads available" hint={matches.reason || 'No compatible customer load currently matches your availability.'}
            action={<Link to="/driver/availability" className="btn btn-outline">Update Availability</Link>} />
        ) : (
          <div className="card-body">
            {matches.loads.slice(0, 3).map((l) => (
              <div className="schedule-row" key={l.id}>
                <div style={{ flex: 1 }}>
                  <div className="card-title">{l.pickup_location} → {l.drop_location}</div>
                  <div className="muted-copy" style={{ margin: '3px 0 0' }}>
                    {l.code} · {l.weight_ton} T · {l.truck_type} · pickup {fmtDate(l.required_date)} {l.required_time}
                  </div>
                </div>
                <span className="badge badge-green">{l.match_score}/100</span>
                <Link to="/driver/available-loads" className="btn btn-outline btn-sm">Details</Link>
                <button className="btn btn-outline btn-sm" disabled={busy}
                  onClick={() => respondToLoad(l.id, 'reject')}>Reject</button>
                <button className="btn btn-primary btn-sm" disabled={busy}
                  onClick={() => respondToLoad(l.id, 'accept')}>Accept</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Today's Schedule</div></div>
        {schedule.length === 0 ? (
          <EmptyState icon={<Route size={30} color="var(--muted-light)" />}
            title="No active trip" hint="Pick up a load and it will show here."
            action={<Link to="/driver/available-loads" className="btn btn-primary">See available loads</Link>} />
        ) : (
          <div className="card-body">
            {schedule.map((t) => (
              <div className="schedule-row" key={t.id}>
                <div className="schedule-time">{t.required_time || '—'}</div>
                <div style={{ flex: 1 }}>
                  <div className="card-title">{t.pickup_location} → {t.drop_location}</div>
                  <div className="muted-copy" style={{ margin: '3px 0 0' }}>
                    {t.code} · {t.weight_ton} T · {t.customer_name} · {money(t.offered_fare)}
                  </div>
                </div>
                <StatusBadge status={t.status} />
                <Link to={`/driver/trips/${t.id}`} className="btn btn-outline btn-sm">Open</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
