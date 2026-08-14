import { LifeBuoy, Mail, MessageSquare, Phone } from 'lucide-react'

const FAQ = [
  ['How soon will a truck be assigned?',
   'Most loads are matched within a couple of hours. You get a notification the moment a driver accepts, and the truck and driver details appear on the load.'],
  ['How is my fare calculated?',
   'From the base rate for your truck type, the distance, the weight, tolls, loading and unloading, driver allowance, platform fee and GST. A surge applies when demand is high on your route.'],
  ['Can I cancel a load?',
   'Pending loads can be cancelled by contacting support. Once a driver has accepted, cancellation charges may apply.'],
  ['When do I pay?',
   'An itemised invoice is raised when the consignment is delivered. You will see it under Payments.'],
]

export default function CustomerSupport() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Support</div>
          <div className="page-sub">We're here if something needs sorting out.</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <a className="card support-card" href="tel:+919876500000">
          <span className="feature-icon"><Phone size={20} /></span>
          <div className="card-title">Call support</div>
          <p className="muted-copy">+91 98765 00000 · 8am to 10pm daily</p>
        </a>
        <a className="card support-card" href="mailto:support@rightpolamright.com">
          <span className="feature-icon"><Mail size={20} /></span>
          <div className="card-title">Email us</div>
          <p className="muted-copy">support@rightpolamright.com · reply within a day</p>
        </a>
        <div className="card support-card">
          <span className="feature-icon"><MessageSquare size={20} /></span>
          <div className="card-title">Raise an issue</div>
          <p className="muted-copy">Mention your Load ID and we'll pick it up from there.</p>
        </div>
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
