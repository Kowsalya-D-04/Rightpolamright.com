import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MapPin, Search } from 'lucide-react'
import api from '../services/api'

/**
 * Type-ahead location field backed by /api/locations/search.
 * Emits the chosen place with its coordinates so distance and price can be
 * calculated without the customer typing any numbers.
 */
export default function LocationPicker({ label, value, onChange, placeholder }) {
  const [q, setQ] = useState(value || '')
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef(null)

  useEffect(() => { setQ(value || '') }, [value])

  useEffect(() => {
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const search = (term) => {
    const clean = (term || '').trim()
    setOpen(true)
    if (clean.length < 2) { setOptions([]); return }
    api.get('/locations/search', { params: { q: clean, limit: 10 } })
      .then(({ data }) => { setOptions(data); setOpen(true); setActive(-1) })
      .catch((err) => { setOptions([]); setOpen(false); console.error('Google Places search failed', err) })
  }

  const onType = (e) => {
    const v = e.target.value
    setQ(v)
    onChange({ name: v, lat: null, lng: null })
    clearTimeout(box.current?._t)
    box.current._t = setTimeout(() => search(v), 220)
  }

  const pick = (o) => {
    setQ(o.name)
    onChange(o)
    setOpen(false)
  }

  const onKey = (e) => {
    if (!open || !options.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(options[active]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="field" ref={box} style={{ position: 'relative' }}>
      {label && <label className="label">{label}</label>}
      <div style={{ position: 'relative' }}>
        <MapPin size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'var(--muted)' }} />
        <input
          className="input" style={{ paddingLeft: 33, paddingRight: 38 }} value={q}
          onChange={onType} onFocus={() => search(q)} onKeyDown={onKey}
          placeholder={placeholder || 'Type and choose a location'} autoComplete="off"
          role="combobox" aria-expanded={open}
        />
        <button type="button" aria-label="Show location dropdown"
          onClick={() => { if (open) setOpen(false); else { setOpen(true); search(q) } }}
          style={{ position: 'absolute', right: 4, top: 4, width: 30, height: 30, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }}>
          <ChevronDown size={16} />
        </button>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          background: '#fff', border: '1px solid var(--line)', borderRadius: 8,
          marginTop: 4, boxShadow: 'var(--shadow-md)', maxHeight: 220, overflowY: 'auto',
        }}>
          {options.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--muted)' }}>Type at least 2 letters to see location dropdown options.</div>}
          {options.map((o, i) => (
            <button key={o.name} type="button" onClick={() => pick(o)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 12px', textAlign: 'left', fontSize: 13.5,
                background: i === active ? 'var(--blue-soft)' : 'transparent',
              }}>
              <Search size={13} color="var(--muted)" />{o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
