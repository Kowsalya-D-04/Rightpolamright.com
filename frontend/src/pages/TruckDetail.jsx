import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { fmtDate } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'

export default function TruckDetail() {
  const { id } = useParams()
  const [truck, setTruck] = useState(null)
  const [docs, setDocs] = useState([])

  useEffect(() => {
    api.get(`/trucks/${id}`).then(({ data }) => setTruck(data))
    api.get(`/trucks/${id}/documents`).then(({ data }) => setDocs(data))
  }, [id])
  if (!truck) return <Loader />

  const setStatus = async (status) => {
    const { data } = await api.put(`/trucks/${id}`, { status })
    setTruck(data)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{truck.truck_number}</div>
          <div className="page-sub">{truck.model} · {truck.truck_type} · {truck.capacity_ton} Ton</div>
        </div>
        <div className="page-actions">
          <Link to="/trucks" className="btn btn-outline">Back</Link>
          <select className="select" style={{ width: 160 }} value={truck.status}
            onChange={(e) => setStatus(e.target.value)}>
            {['Available', 'Busy', 'Maintenance', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Truck details</div><StatusBadge status={truck.status} /></div>
          <div className="card-body">
            <div className="kv-row"><span className="kv-key">Truck number</span><span className="kv-val">{truck.truck_number}</span></div>
            <div className="kv-row"><span className="kv-key">Truck type</span><span className="kv-val">{truck.truck_type}</span></div>
            <div className="kv-row"><span className="kv-key">Capacity</span><span className="kv-val">{truck.capacity_ton} Ton</span></div>
            <div className="kv-row"><span className="kv-key">Owner</span><span className="kv-val">{truck.owner_name}</span></div>
            <div className="kv-row"><span className="kv-key">Model</span><span className="kv-val">{truck.model}</span></div>
            <div className="kv-row"><span className="kv-key">Chassis number</span><span className="kv-val">{truck.chassis_number}</span></div>
            <div className="kv-row"><span className="kv-key">Engine number</span><span className="kv-val">{truck.engine_number}</span></div>
            <div className="kv-row"><span className="kv-key">Driver</span><span className="kv-val">{truck.driver_name || 'Unassigned'}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Documents</div></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Document</th><th>Number</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.doc_type}</td>
                    <td className="cell-mono">{d.doc_number}</td>
                    <td className="cell-mono">{fmtDate(d.expiry_date)}</td>
                    <td><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
