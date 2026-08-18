import { LifeBuoy, Mail, Phone, ShieldAlert } from 'lucide-react'

const FAQ = [
  ['Why can I not see any loads?',
   'Loads only appear once operations verify your licence and vehicle papers, and only when you are not already on a trip. We also filter by your truck capacity, type and how far you are from the pickup.'],
  ['How is my fare decided?',
   'The fare is calculated from the route distance, the weight, your truck type, tolls and allowances, plus a surge when demand is high. You see the amount before you accept.'],
  ['When do I get paid?',
   'The amount moves into Earnings as pending when you mark the trip delivered, and settles once the customer pays.'],
  ['What if I break down mid-trip?',
   'Call support straight away on the number below. We will inform the customer and arrange a replacement truck.'],
]

export default function DriverSupport() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Support</div>
          <div className="page-sub">Help while you're on the road.</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <a className="card support-card" href="tel:+919876500000">
          <span className="feature-icon"><Phone size={20} /></span>
          <div className="card-title">Call support</div>
          <p className="muted-copy">+91 98765 00000 · 24×7 for drivers on a trip</p>
        </a>
        <div className="card support-card">
          <span className="feature-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
            <ShieldAlert size={20} />
          </span>
          <div className="card-title">Emergency / SOS</div>
          <p className="muted-copy">Accident or breakdown? Call the support line and say SOS.</p>
        </div>
        <a className="card support-card" href="mailto:drivers@rightpolamright.com">
          <span className="feature-icon"><Mail size={20} /></span>
          <div className="card-title">Email us</div>
          <p className="muted-copy">drivers@rightpolamright.com for documents and payments</p>
        </a>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Frequently asked</div>
          <LifeBuoy size={16} color="var(--muted)" style={{ marginLeft: 'auto' }} />
        </div>
        <div className="card-body">
          {FAQ.map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>{q}</summary>
              <p className="muted-copy">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
