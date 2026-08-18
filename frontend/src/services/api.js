import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rpr_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const path = window.location.pathname
    // An expired session sends the person back to the sign-in for their own area.
    if (error.response?.status === 401 && !path.includes('/login')) {
      localStorage.removeItem('rpr_token')
      localStorage.removeItem('rpr_user')
      const back = path.startsWith('/customer') ? '/login/customer'
        : path.startsWith('/driver') ? '/login/driver'
        : '/login/admin'
      window.location.href = back
    }
    return Promise.reject(error)
  }
)

export const money = (n) =>
  n === null || n === undefined ? '—' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/**
 * Turn any API failure into a sentence safe to render.
 *
 * FastAPI returns `detail` as a string for HTTPException, but as a LIST OF
 * OBJECTS for 422 validation errors. Rendering that list directly crashes
 * React ("Objects are not valid as a React child"), so every catch block
 * should pass the error through here.
 */
export const apiError = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback
  if (err.response) {
    const { status, data } = err.response
    const detail = data?.detail

    if (typeof detail === 'string' && detail.trim()) return detail

    // 422 validation: [{ loc: ['body','weight_ton'], msg: '...' }, ...]
    if (Array.isArray(detail) && detail.length) {
      const lines = detail.map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((x) => x !== 'body').join('.') : ''
        const msg = d.msg || 'is invalid'
        return field ? `${field}: ${msg}` : msg
      })
      const unique = [...new Set(lines)]
      return unique.length === 1 ? unique[0] : `Please check these fields — ${unique.join('; ')}`
    }

    if (detail && typeof detail === 'object') return detail.msg || JSON.stringify(detail)

    if (status === 401) return 'Your session has expired. Sign in again.'
    if (status === 403) return "You don't have access to that."
    if (status === 404) return 'We could not find that record.'
    if (status >= 500) return 'The server hit an error. Please try again in a moment.'
    return fallback
  }
  if (err.request) return 'Could not reach the server. Check that the backend is running on port 8000.'
  return err.message || fallback
}

export default api
