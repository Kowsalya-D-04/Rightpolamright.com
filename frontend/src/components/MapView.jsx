import { useEffect, useRef, useState } from 'react'

let loader
function loadGoogle() {
  if (window.google?.maps) return Promise.resolve(window.google)
  if (loader) return loader
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'))
  loader = new Promise((resolve, reject) => {
    const script=document.createElement('script')
    script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.async=true; script.defer=true; script.onload=()=>resolve(window.google); script.onerror=reject
    document.head.appendChild(script)
  })
  return loader
}

export default function MapView({ markers=[], route=null, height=340 }) {
  const ref=useRef(null); const [error,setError]=useState('')
  useEffect(()=>{
    let map
    loadGoogle().then((g)=>{
      if (!ref.current) return
      const valid=markers.filter(m=>m?.lat!=null&&m?.lng!=null)
      const center=valid[0] || route?.from || {lat:13.0827,lng:80.2707}
      map=new g.maps.Map(ref.current,{center,zoom:8,mapTypeControl:false,streetViewControl:false,fullscreenControl:false})
      const bounds=new g.maps.LatLngBounds()
      valid.forEach(m=>{ new g.maps.Marker({map,position:{lat:Number(m.lat),lng:Number(m.lng)},title:m.label||''}); bounds.extend({lat:Number(m.lat),lng:Number(m.lng)}) })
      if (route?.from?.lat!=null && route?.to?.lat!=null) {
        const renderer=new g.maps.DirectionsRenderer({map,suppressMarkers:false})
        const service=new g.maps.DirectionsService()
        service.route({origin:{lat:Number(route.from.lat),lng:Number(route.from.lng)},destination:{lat:Number(route.to.lat),lng:Number(route.to.lng)},travelMode:g.maps.TravelMode.DRIVING},(result,status)=>{ if(status==='OK') renderer.setDirections(result) })
      } else if(valid.length>1) map.fitBounds(bounds)
    }).catch(e=>setError(e.message || 'Google Maps failed to load'))
    return ()=>{ map=null }
  },[JSON.stringify(markers),JSON.stringify(route)])
  if(error) return <div className="map-frame" style={{height,display:'grid',placeItems:'center',padding:24,textAlign:'center'}}><div><strong>Google Maps configuration required</strong><div style={{marginTop:6,color:'var(--muted)',fontSize:12}}>{error}</div></div></div>
  return <div ref={ref} className="map-frame" style={{height}} />
}
