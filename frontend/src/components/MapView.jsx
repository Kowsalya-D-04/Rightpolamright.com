import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Schematic map. Real lat/lng points are projected into the viewport, so
 * markers move whenever the backend reports new coordinates.
 * The viewBox tracks the container width so the map never crops or letterboxes.
 */
export default function MapView({ markers = [], route = null, height = 340, showLegend = true }) {
  const ref = useRef(null)
  const [W, setW] = useState(900)
  const H = height

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w > 0) setW(w)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const project = useMemo(() => {
    const all = [...markers.filter((m) => m && m.lat != null && m.lng != null)]
    if (route) all.push(route.from, route.to)
    const valid = all.filter((p) => p && p.lat != null && p.lng != null)
    if (!valid.length) return () => ({ x: W / 2, y: H / 2 })

    const lats = valid.map((p) => p.lat), lngs = valid.map((p) => p.lng)
    let minLat = Math.min(...lats), maxLat = Math.max(...lats)
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const padLat = Math.max((maxLat - minLat) * 0.2, 0.3)
    const padLng = Math.max((maxLng - minLng) * 0.2, 0.3)
    minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng

    // Inset the plot area so pins and their labels never touch the edge.
    const padX = Math.min(60, W * 0.12), padY = 30
    return (lat, lng) => ({
      x: padX + ((lng - minLng) / (maxLng - minLng || 1)) * (W - padX * 2),
      y: (H - padY) - ((lat - minLat) / (maxLat - minLat || 1)) * (H - padY * 2),
    })
  }, [markers, route, W, H])

  const colorOf = (t) =>
    t === 'pickup' ? 'var(--green)' : t === 'drop' ? 'var(--red)'
      : t === 'trip' ? 'var(--blue)' : 'var(--orange)'

  const from = route && project(route.from.lat, route.from.lng)
  const to = route && project(route.to.lat, route.to.lng)
  const shown = markers.filter((m) => m && m.lat != null && m.lng != null)

  return (
    <div className="map-frame" style={{ height: H }} ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
        <rect width={W} height={H} fill="#E8EDF2" />
        {Array.from({ length: Math.max(6, Math.round(W / 70)) }).map((_, i, a) => (
          <line key={`v${i}`} className="map-grid-line"
            x1={(i * W) / a.length} y1="0" x2={(i * W) / a.length} y2={H} />
        ))}
        {Array.from({ length: Math.max(4, Math.round(H / 55)) }).map((_, i, a) => (
          <line key={`h${i}`} className="map-grid-line"
            x1="0" y1={(i * H) / a.length} x2={W} y2={(i * H) / a.length} />
        ))}

        <path className="map-road-casing" fill="none"
          d={`M0,${H * 0.66} Q${W * 0.3},${H * 0.46} ${W * 0.56},${H * 0.6} T${W},${H * 0.42}`} />
        <path className="map-road" fill="none"
          d={`M0,${H * 0.66} Q${W * 0.3},${H * 0.46} ${W * 0.56},${H * 0.6} T${W},${H * 0.42}`} />
        <path className="map-road-casing" fill="none" d={`M${W * 0.2},0 L${W * 0.32},${H}`} />
        <path className="map-road" fill="none" d={`M${W * 0.2},0 L${W * 0.32},${H}`} />

        {from && to && (
          <path className="map-route"
            d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${Math.min(from.y, to.y) - H * 0.16} ${to.x},${to.y}`} />
        )}

        {shown.map((m, i) => {
          const p = project(m.lat, m.lng)
          const c = colorOf(m.type)
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="13" fill={c} opacity="0.18" />
              <circle cx={p.x} cy={p.y} r="6.5" fill={c} stroke="#fff" strokeWidth="2.5" />
              {m.label && shown.length <= 14 && (
                <text className="map-pin-label" x={p.x} y={p.y - 16} textAnchor="middle">{m.label}</text>
              )}
            </g>
          )
        })}
      </svg>

      {showLegend && (
        <div className="map-legend">
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--blue)' }} />On trip</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--orange)' }} />Available</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--green)' }} />Pickup</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--red)' }} />Drop</div>
        </div>
      )}
    </div>
  )
}
