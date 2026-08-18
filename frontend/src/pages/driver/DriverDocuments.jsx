import { useEffect, useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import api, { fmtDate } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import Loader, { EmptyState } from '../../components/Loader'

function DocTable({ title, rows }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><div className="card-title">{title}</div></div>
      {rows.length === 0 ? (
        <EmptyState icon={<FileText size={28} color="var(--muted-light)" />}
          title="Nothing uploaded yet"
          hint="Operations will add these once you submit them." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Document</th><th>Number</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="cell-strong">{d.doc_type}</td>
                  <td className="cell-mono">{d.doc_number || '—'}</td>
                  <td className="cell-mono">{fmtDate(d.expiry_date)}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function DriverDocuments() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/driver/documents').then(({ data }) => setData(data)) }, [])
  if (!data) return <Loader />

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Documents</div>
          <div className="page-sub">Your KYC and vehicle paperwork.</div>
        </div>
        <div className="page-actions">
          <span className="badge badge-gray"><ShieldCheck size={12} /> KYC</span>
          <StatusBadge status={data.kyc_status} />
        </div>
      </div>

      {data.kyc_status !== 'Verified' && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Send your licence, ID proof, RC book and insurance to support@rightpolamright.com.
          Once operations verify them, loads open up automatically.
        </div>
      )}

      <DocTable title="Driver documents" rows={data.driver_documents} />
      <DocTable title="Vehicle documents" rows={data.vehicle_documents} />
    </div>
  )
}
