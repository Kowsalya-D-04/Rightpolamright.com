import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Truck } from 'lucide-react'
import api, { fmtDate, money } from '../services/api'
import Loader from '../components/Loader'

export default function InvoiceView() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  useEffect(() => { api.get(`/invoices/${id}`).then(({ data }) => setData(data)) }, [id])
  if (!data) return <Loader />
  const { invoice, trip, load, customer, payment } = data

  const lines = [
    ['Base fare', invoice.base_fare], ['Distance charge', invoice.distance_charge],
    ['Weight charge', invoice.weight_charge], ['Toll charges', invoice.toll_charge],
    ['Loading charges', invoice.loading_charge], ['Unloading charges', invoice.unloading_charge],
    ['Driver bata', invoice.driver_bata], ['Platform fee', invoice.platform_fee],
    ['GST', invoice.gst], ['Surge', invoice.surge_amount],
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Invoice {invoice.code}</div>
          <div className="page-sub">Raised against trip {trip.code}</div>
        </div>
        <div className="page-actions">
          <Link to="/payments" className="btn btn-outline">Back</Link>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download size={15} /> Download invoice
          </button>
        </div>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-head">
          <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
            <span className="brand-mark"><Truck size={19} /></span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>RightPolamRight</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Smart Logistics Partner</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{invoice.code}</div>
            <div style={{ color: 'var(--muted)' }}>{fmtDate(invoice.created_at)}</div>
            <div style={{ color: 'var(--muted)' }}>{payment.status} · {payment.mode}</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ margin: '22px 0' }}>
          <div>
            <div className="spec-label">Billed to</div>
            <div style={{ fontWeight: 700, marginTop: 5 }}>{customer.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{customer.address}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{customer.phone}</div>
            {customer.gst_number && <div style={{ color: 'var(--muted)', fontSize: 13 }}>GST: {customer.gst_number}</div>}
          </div>
          <div>
            <div className="spec-label">Trip</div>
            <div style={{ fontSize: 13, marginTop: 5 }}>Load {load.code} · Trip {trip.code}</div>
            <div style={{ fontSize: 13 }}>{load.pickup} → {load.drop}</div>
            <div style={{ fontSize: 13 }}>{load.distance_km} km · {load.weight_ton} Ton</div>
            <div style={{ fontSize: 13 }}>{trip.driver} · {trip.truck}</div>
          </div>
        </div>

        <div>
          {lines.map(([label, val]) => (
            <div className="invoice-line" key={label}>
              <span style={{ color: 'var(--muted)' }}>{label}</span>
              <span className="cell-mono">{money(val)}</span>
            </div>
          ))}
        </div>

        <div className="invoice-total">
          <span>Final amount</span>
          <span>{money(invoice.total_amount)}</span>
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          This is a computer-generated invoice and does not require a signature.
        </div>
      </div>
    </div>
  )
}
