const MAP = {
  Pending: 'badge-orange', Assigned: 'badge-blue', 'In Transit': 'badge-purple',
  Delivered: 'badge-green', Cancelled: 'badge-red',
  'Pickup Reached': 'badge-blue', Loading: 'badge-orange', Reached: 'badge-purple',
  Online: 'badge-green', Busy: 'badge-orange', Offline: 'badge-gray', Suspended: 'badge-red',
  Available: 'badge-green', Maintenance: 'badge-orange', Inactive: 'badge-gray',
  Active: 'badge-green', Paid: 'badge-green', Failed: 'badge-red', Refunded: 'badge-purple',
  Verified: 'badge-green', Rejected: 'badge-red',
  'Best Match': 'badge-green', Excellent: 'badge-blue', 'Very Good': 'badge-purple',
  Good: 'badge-orange', Fair: 'badge-gray',
  High: 'badge-red', Moderate: 'badge-orange', Normal: 'badge-green',
}

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-gray">—</span>
  return <span className={`badge ${MAP[status] || 'badge-gray'}`}>{status}</span>
}
