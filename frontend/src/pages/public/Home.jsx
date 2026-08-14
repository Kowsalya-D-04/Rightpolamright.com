import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, CheckCircle2, Clock, IndianRupee, MapPin, Menu,
  Navigation, Package, Phone, Mail, Shield, Sparkles, Truck, Users, Wallet,
} from 'lucide-react'
import { useState } from 'react'

const FEATURES = [
  { icon: Sparkles, title: 'Smart Load Matching',
    body: 'Every load is scored against your whole fleet on capacity, truck type, distance, driver availability and rating — so the right truck is the first one you see.' },
  { icon: Navigation, title: 'Real-Time Trip Tracking',
    body: 'Follow each consignment from pickup to delivery. Customers see the truck, the driver and a live ETA without calling anyone.' },
  { icon: IndianRupee, title: 'Dynamic Pricing',
    body: 'Fares built from base rate, distance, weight, tolls and duties, with a surge that responds to live demand across your routes.' },
  { icon: Users, title: 'Driver & Truck Management',
    body: 'Licences, insurance, fitness, permits and pollution certificates tracked in one register, with KYC status on every driver.' },
  { icon: Wallet, title: 'Secure Payments',
    body: 'Itemised invoices generated on delivery, with collections and outstanding balances reconciled per customer and per trip.' },
  { icon: BarChart3, title: 'Logistics Analytics',
    body: 'Revenue trends, load volumes, top routes and driver performance — the numbers you need to plan next quarter.' },
]

const STEPS = [
  { n: '01', title: 'Book a load', body: 'Tell us the pickup, the drop, the weight and when it needs to move. You get an indicative fare immediately.' },
  { n: '02', title: 'We match the truck', body: 'Our matching engine ranks every eligible truck and driver, and the load goes out to the best fit.' },
  { n: '03', title: 'Track it live', body: 'Watch the trip move through pickup, loading, transit and delivery, with notifications at every step.' },
  { n: '04', title: 'Settle and rate', body: 'An itemised invoice is raised on delivery. Pay, then rate the driver who moved it.' },
]

export default function Home() {
  const [navOpen, setNavOpen] = useState(false)
  const go = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setNavOpen(false)
  }

  return (
    <div className="site">
      {/* ---------- nav ---------- */}
      <header className="site-nav">
        <div className="site-container site-nav-inner">
          <Link to="/" className="brand-row">
            <span className="brand-mark"><Truck size={19} /></span>
            <span>
              <div className="brand-name" style={{ color: 'var(--navy)' }}>RightPolamRight</div>
              <div className="brand-tag">Smart Logistics Partner</div>
            </span>
          </Link>

          <nav className={`site-links ${navOpen ? 'open' : ''}`}>
            <a href="#home" onClick={go('home')}>Home</a>
            <a href="#about" onClick={go('about')}>About</a>
            <a href="#services" onClick={go('services')}>Services</a>
            <a href="#how" onClick={go('how')}>How It Works</a>
            <a href="#contact" onClick={go('contact')}>Contact</a>
          </nav>

          <div className="site-nav-actions">
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            <button className="icon-btn site-burger" onClick={() => setNavOpen((v) => !v)}
              aria-label="Menu"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="hero" id="home">
        <div className="site-container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Trusted by fleet operators across South India</span>
            <h1>Move Every Load With The Right Truck.</h1>
            <p>Smart logistics platform for customers, drivers and fleet operations.</p>
            <div className="hero-cta">
              <Link to="/register/customer" className="btn btn-primary btn-lg">
                <Package size={17} /> Book a Load
              </Link>
              <Link to="/register/driver" className="btn btn-outline btn-lg btn-on-dark">
                <Truck size={17} /> Find a Truck
              </Link>
            </div>
            <div className="hero-stats">
              <div><strong>2,400+</strong><span>Loads moved</span></div>
              <div><strong>350+</strong><span>Verified drivers</span></div>
              <div><strong>18</strong><span>Cities served</span></div>
            </div>
          </div>

          {/* Illustration: a highway scene drawn inline, so it needs no asset pipeline. */}
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 460 340" width="100%" role="presentation">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" /><stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" /><stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="460" height="340" rx="16" fill="url(#sky)" />
              <circle cx="360" cy="72" r="34" fill="#FFFFFF" opacity=".16" />
              <path d="M0 214 L460 178 L460 340 L0 340 Z" fill="url(#road)" />
              <path d="M10 262 L450 224" stroke="#FBBF24" strokeWidth="3" strokeDasharray="26 20" opacity=".85" />
              {[40, 130, 220, 310, 400].map((x, i) => (
                <g key={i} opacity=".28">
                  <rect x={x} y={120 - i % 2 * 22} width="30" height={70 + i % 2 * 22} rx="3" fill="#0F172A" />
                </g>
              ))}
              {/* truck */}
              <g transform="translate(96 150)">
                <rect x="0" y="0" width="150" height="74" rx="7" fill="#F8FAFC" />
                <rect x="8" y="10" width="134" height="24" rx="3" fill="#E2E8F0" />
                <text x="18" y="58" fontSize="15" fontWeight="800" fill="#2563EB"
                  fontFamily="Inter, sans-serif">RightPolamRight</text>
                <path d="M150 20 L196 20 L214 48 L214 74 L150 74 Z" fill="#2563EB" />
                <rect x="158" y="27" width="38" height="24" rx="4" fill="#BFDBFE" />
                <circle cx="46" cy="80" r="17" fill="#0F172A" /><circle cx="46" cy="80" r="7" fill="#94A3B8" />
                <circle cx="188" cy="80" r="17" fill="#0F172A" /><circle cx="188" cy="80" r="7" fill="#94A3B8" />
              </g>
              <g transform="translate(300 96)">
                <circle cx="0" cy="0" r="21" fill="#16A34A" />
                <path d="M-8 0 L-2 7 L9 -6" stroke="#fff" strokeWidth="3.5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ---------- about ---------- */}
      <section className="site-section" id="about">
        <div className="site-container">
          <div className="section-head">
            <span className="eyebrow">About</span>
            <h2>One platform for everyone who touches a consignment.</h2>
            <p>
              RightPolamRight connects the three sides of a freight movement. Customers raise loads
              and watch them travel. Drivers see work that actually suits their truck. Operations
              keeps the fleet, the paperwork and the money in one place.
            </p>
          </div>
          <div className="grid grid-3">
            {[
              [Package, 'For customers', 'Book a load in under a minute, see the assigned driver and truck, track the trip live and settle against an itemised invoice.'],
              [Truck, 'For drivers', 'Only loads your truck can legally carry, ranked by how close they are. Accept in one tap and update status from the road.'],
              [Shield, 'For operations', 'Matching, pricing, documents, trips, collections and analytics in a single admin console.'],
            ].map(([Icon, title, body]) => (
              <div className="card" key={title}>
                <div className="card-body">
                  <span className="feature-icon"><Icon size={20} /></span>
                  <div className="card-title" style={{ marginTop: 12 }}>{title}</div>
                  <p className="muted-copy">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- services ---------- */}
      <section className="site-section site-section-alt" id="services">
        <div className="site-container">
          <div className="section-head">
            <span className="eyebrow">Services</span>
            <h2>Everything the fleet runs on.</h2>
          </div>
          <div className="grid grid-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div className="card feature-card" key={title}>
                <div className="card-body">
                  <span className="feature-icon"><Icon size={20} /></span>
                  <div className="card-title" style={{ marginTop: 12 }}>{title}</div>
                  <p className="muted-copy">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="site-section" id="how">
        <div className="site-container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From booking to settlement, in four steps.</h2>
          </div>
          <div className="grid grid-4 steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <span className="step-num">{s.n}</span>
                <div className="card-title">{s.title}</div>
                <p className="muted-copy">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta-band">
        <div className="site-container cta-inner">
          <div>
            <h2>Ready to move your next load?</h2>
            <p>Create an account in a minute. No setup fee, no contract.</p>
          </div>
          <div className="hero-cta">
            <Link to="/register/customer" className="btn btn-lg btn-white">
              Book a Load <ArrowRight size={16} />
            </Link>
            <Link to="/register/driver" className="btn btn-lg btn-outline btn-on-dark">
              Drive with us
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- contact / footer ---------- */}
      <footer className="site-footer" id="contact">
        <div className="site-container footer-grid">
          <div>
            <div className="brand-row" style={{ marginBottom: 12 }}>
              <span className="brand-mark"><Truck size={18} /></span>
              <span>
                <div className="brand-name">RightPolamRight</div>
                <div className="brand-tag">Smart Logistics Partner</div>
              </span>
            </div>
            <p className="footer-copy">
              Freight movement across Tamil Nadu, Karnataka, Kerala, Andhra Pradesh and Telangana.
            </p>
          </div>
          <div>
            <div className="footer-head">Contact</div>
            <p className="footer-copy"><Phone size={14} /> +91 98765 00000</p>
            <p className="footer-copy"><Mail size={14} /> hello@rightpolamright.com</p>
            <p className="footer-copy"><MapPin size={14} /> Anna Salai, Chennai 600002</p>
          </div>
          <div>
            <div className="footer-head">Platform</div>
            <p className="footer-copy"><Link to="/register/customer">Customer sign-up</Link></p>
            <p className="footer-copy"><Link to="/register/driver">Driver sign-up</Link></p>
            <p className="footer-copy"><Link to="/login/admin">Operations sign-in</Link></p>
          </div>
          <div>
            <div className="footer-head">Hours</div>
            <p className="footer-copy"><Clock size={14} /> Bookings 24×7</p>
            <p className="footer-copy"><CheckCircle2 size={14} /> Support 8am – 10pm</p>
          </div>
        </div>
        <div className="site-container footer-base">
          © {new Date().getFullYear()} RightPolamRight. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
