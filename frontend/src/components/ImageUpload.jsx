import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import api, { apiError } from '../services/api'

/** Uploads a load photo and hands back the stored URL. */
export default function ImageUpload({ value, onChange, label = 'Load image' }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/uploads/load-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
    } catch (err) {
      setError(apiError(err, 'Could not upload that image.'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="field">
      <label className="label">{label}</label>
      {value ? (
        <div style={{ position: 'relative', width: 'fit-content' }}>
          <img src={value} alt="Load" style={{
            width: 190, height: 130, objectFit: 'cover', borderRadius: 8,
            border: '1px solid var(--line)',
          }} />
          <button type="button" onClick={() => onChange(null)} aria-label="Remove image"
            style={{
              position: 'absolute', top: 6, right: 6, background: 'rgba(15,23,42,.75)',
              color: '#fff', borderRadius: 6, width: 24, height: 24, display: 'grid',
              placeItems: 'center',
            }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
            width: 190, height: 130, border: '1.5px dashed var(--line)', borderRadius: 8,
            color: 'var(--muted)', background: '#F8FAFC', justifyContent: 'center',
          }}>
          {busy ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            {busy ? 'Uploading…' : 'Add a photo'}
          </span>
          <span style={{ fontSize: 11 }}>JPG, PNG or WebP · up to 5 MB</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={pick} style={{ display: 'none' }} />
      {error && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 6 }}>{error}</div>}
    </div>
  )
}
