# RightPolamRight — Smart Logistics Partner

A logistics operations console: load requests, smart truck matching, live trip tracking,
dynamic pricing, settlements and analytics.

**React + Vite** frontend · **FastAPI** backend · **MySQL** database via SQLAlchemy + PyMySQL.

---

## Run it on Windows

Double-click **`start.bat`**.

It creates the Python virtual environment, installs dependencies, configures/verifies MySQL, runs schema migrations, and opens two terminal windows — one for the API and one for the web app.

| What | Where |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

### Database

RightPolamRight now uses **MySQL only**. `start.bat` prompts for MySQL connection details on first run and stores them in the project-root `.env`. There is no SQLite fallback.

See `MYSQL_SETUP.md` for recommended MySQL user/database creation and the optional one-time importer for an older SQLite installation.

### Requirements

- Python 3.10 or newer with the Windows Python Launcher (`py -3`)
- Node.js 18 or newer
- MySQL Server 8.x

### Running it by hand

Backend:

```bat
cd backend
py -3 -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe configure_mysql.py
venv\Scripts\python.exe prepare_mysql.py
venv\Scripts\python.exe migrate.py
venv\Scripts\python.exe bootstrap_admin.py
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Frontend, in a second terminal:

```bat
cd frontend
npm install
npm run dev
```

## Three portals, one product

The platform has a public site and three signed-in areas. Roles are enforced on
both sides: the React router sends you to your own home if you land somewhere
else, and every API route is guarded by role, so a customer or driver token gets
a 403 from admin endpoints rather than a page they should not see.

### Public

| Screen | Route |
|---|---|
| Home / landing page | `/` |
| Register — role picker | `/register` |
| Customer registration | `/register/customer` |
| Driver registration | `/register/driver` |
| Sign in (role picker) | `/login` |
| Admin / customer / driver sign-in | `/login/admin`, `/login/customer`, `/login/driver` |

### Customer portal

| Screen | Route |
|---|---|
| Dashboard | `/customer/dashboard` |
| My Loads | `/customer/loads` |
| Book Load | `/customer/book-load` |
| Track Load | `/customer/track` |
| Payments | `/customer/payments` |
| Notifications | `/customer/notifications` |
| Rate & Review | `/customer/reviews` |
| Profile | `/customer/profile` |
| Support | `/customer/support` |

### Driver portal

| Screen | Route |
|---|---|
| Dashboard | `/driver/dashboard` |
| Available Loads | `/driver/available-loads` |
| My Trips | `/driver/trips` |
| Trip Tracking | `/driver/trips/:tripId` |
| Earnings | `/driver/earnings` |
| Documents | `/driver/documents` |
| Notifications | `/driver/notifications` |
| Profile | `/driver/profile` |
| Support | `/driver/support` |

### Admin console — the original twelve screens

| # | Screen | Route |
|---|---|---|
| 1 | Login | `/login` |
| 2 | Dashboard | `/dashboard` |
| 3 | Load Requests | `/load-requests`, `/load-requests/:id` |
| 4 | Smart Load Matching | `/smart-load-matching/:loadId` |
| 5 | Assign Load | `/assign-load/:loadId` |
| 6 | Trips / Live Tracking | `/trips`, `/trips/:tripId` |
| 7 | Driver Management | `/drivers`, `/drivers/:id` |
| 8 | Truck Management | `/trucks`, `/trucks/:id` |
| 9 | Customer Management | `/customers`, `/customers/:id` |
| 10 | Payments & Invoices | `/payments`, `/invoices/:id` |
| 11 | Notifications | `/notifications` |
| 12 | Reports & Analytics | `/reports` |

Plus `/pricing` (Tariffs & Pricing) and `/settings`.

---

## The end-to-end flow

1. A customer registers, signs in, and books a load. It is saved as `Pending` with a calculated fare.
2. Admin sees it in Load Requests and can run Smart Load Matching to rank trucks, then assign one.
3. Or the driver sees it under Available Loads — filtered to what their truck can legally carry, within range — and accepts it themselves.
4. Either path creates a Trip, flips the load to `Assigned`, and marks the driver and truck `Busy`.
5. The customer immediately sees the assigned driver and truck, and can track the trip on a live map.
6. The driver advances the trip: Pickup Reached → Loading → In Transit → Reached → Delivered. Each step notifies the customer.
7. On delivery the driver and truck are released, an itemised invoice and a pending payment are generated, and the amount lands in the driver's Earnings.
8. Admin marks the payment paid. Customer and driver are both notified.
9. The customer rates the driver, and the driver's headline rating is recalculated from their reviews.

A newly registered driver starts at `kyc_status = Pending` with their truck `Inactive`. They cannot see or accept loads until an admin verifies them from Driver Management — checked at both the list and the accept endpoint.

## How Smart Load Matching works

`backend/services/matching.py`. Two stages, both reading live database state.

**Stage 1 — hard filters.** A candidate is dropped outright when it fails any of these:

1. Truck capacity is below the load weight
2. Truck type doesn't match, and isn't an accepted substitute (a trailer can cover an open-truck load; the reverse is not true)
3. Driver is suspended, inactive, or not KYC-verified
4. Driver or truck is already on an active trip
5. Truck is unverified
6. Driver is further than 250 km from the pickup point
7. Driver is on leave, or booked out, on the required date

**Stage 2 — weighted score** over whatever survives, out of 100 points:

| Factor | Points | What it measures |
|---|---|---|
| Distance | 25 | Proximity to the pickup point, decaying to zero at the search radius |
| Capacity | 20 | Fit quality — a 25 T truck on a 5 T load scores low, 70–95 % utilisation scores best |
| Truck type | 15 | Exact match beats an acceptable substitute |
| Availability | 15 | Driver online plus truck free |
| Rating | 10 | Driver's historical rating, mapped from 3.0–5.0 |
| Date & time | 10 | Free on the requested date |
| Route fit | 5 | Already positioned along the corridor, so the detour is small |

Scores above 93 are labelled *Best Match*, 88+ *Excellent*, 80+ *Very Good*, 70+ *Good*.
The per-factor breakdown is returned with each result and shown in the **View details** dialog,
so any ranking can be explained.

Tune the weights in the `WEIGHTS` dict at the top of `matching.py`. They must total 100.

---

## Dynamic pricing

`backend/services/pricing.py`. Nothing is hardcoded — every component comes from
`pricing_rules` and `route_pricing`, and the surge reacts to live demand:

```
base fare + distance charge + weight charge + toll
+ loading + unloading + driver bata + platform fee + GST
= subtotal
final = subtotal + surge
```

Surge is derived from the ratio of pending loads to available trucks, the route's own
demand level, and the hour of day (a night premium after 22:00). A ratio at or above 1.5
gives 1.15×, above 0.8 gives 1.07×, otherwise 1.0×.

Try it on the **Tariffs & Pricing** screen, or `POST /api/pricing/calculate`.

---

## What happens when you use it

- **Create a load** → it appears in Load Requests with a distance and an estimated fare, and raises a *Load Created* notification.
- **Run matching** → the backend scores every eligible truck and persists the shortlist.
- **Assign** → load becomes `Assigned`, driver and truck become `Busy`, a trip is created, and the driver is notified. Re-assigning a busy driver is rejected.
- **Advance the trip** → each status change updates the load and raises the matching notification.
- **Mark Delivered** → driver and truck are released, the driver's trip count increments, and a payment plus itemised invoice are generated automatically.
- **Mark paid** → collections and dashboard revenue update.

Dashboard, reports and payment totals are all computed from the database, so they move as you work.

---

## Project layout

```
rightpolamright/
├── backend/
│   ├── main.py              FastAPI app, CORS, router registration
│   ├── database.py          MySQL-only engine, session, Base
│   ├── requirements.txt
│   ├── models/              All 17 ORM models
│   ├── schemas/             Pydantic request/response models
│   ├── routers/             auth, dashboard, load_requests, drivers, trucks,
│   │                        customers, trips, payments, notifications,
│   │                        reports, pricing
│   ├── services/            matching, pricing, geo, notifications
│   └── utils/security.py    bcrypt hashing, JWT
├── frontend/
│   ├── package.json
│   ├── vite.config.js       Dev proxy: /api → localhost:8000
│   └── src/
│       ├── pages/           20 screens
│       ├── components/      StatCard, StatusBadge, MapView, Modal, Loader
│       ├── layouts/         AdminLayout (sidebar + topbar)
│       ├── context/         AuthContext
│       ├── services/api.js  Axios client, JWT interceptor, formatters
│       └── styles/
├── start.bat
├── reset-database.bat
└── README.md
```

---

## Database

Seventeen tables: `users`, `admins`, `customers`, `drivers`, `trucks`, `load_requests`,
`load_matches`, `trips`, `trip_locations`, `payments`, `invoices`, `notifications`,
`documents`, `pricing_rules`, `route_pricing`, `driver_ratings`, `driver_availability`.

Seeded with 10 customers, 15 drivers, 15 trucks, 20 load requests, 10 trips,
20 payments, 10 invoices, 20 notifications, plus documents and route tariffs.
Every seeded customer and driver also gets a row in `users`, so they can sign in.

`customers.user_id` and `drivers.user_id` link a profile to its login account.
If you are upgrading an existing database, `backend/migrate.py` runs on startup
and adds the new columns in place — your data is kept, no re-seed needed.


## API reference

Every route below `/api` except `/api/auth/login` requires a bearer token.

**Auth** — `POST /api/auth/login` (role-agnostic), `POST /api/auth/admin/login`,
`POST /api/auth/customer/login`, `POST /api/auth/driver/login`,
`POST /api/auth/customer/register`, `POST /api/auth/driver/register`, `GET /api/auth/me`.
There is deliberately no admin registration endpoint.

**Customer portal** (customer role only) — `GET /api/customer/dashboard`, `/profile` (`GET`/`PUT`),
`GET|POST /api/customer/loads`, `GET /api/customer/loads/{id}`, `GET /api/customer/loads/{id}/track`,
`GET /api/customer/payments`, `GET /api/customer/notifications`,
`PUT /api/customer/notifications/read-all`, `GET /api/customer/reviewable-trips`,
`POST /api/customer/trips/{id}/review`

**Driver portal** (driver role only) — `GET /api/driver/dashboard`, `/profile`, `PUT /api/driver/status`,
`GET /api/driver/available-loads`, `POST /api/driver/loads/{id}/accept`,
`GET /api/driver/trips`, `GET /api/driver/trips/{id}`, `POST /api/driver/trips/{id}/status`,
`POST /api/driver/trips/{id}/location`, `GET /api/driver/earnings`, `GET /api/driver/documents`,
`GET /api/driver/notifications`, `PUT /api/driver/notifications/read-all`

The admin endpoints below are unchanged from before — they are now guarded by the
admin role rather than duplicated under an `/api/admin` prefix.

**Dashboard** — `GET /api/dashboard/summary`, `/live-operations`, `/recent-loads`

**Loads** — `GET|POST /api/load-requests`, `GET|PUT|DELETE /api/load-requests/{id}`,
`GET /api/load-requests/{id}/matches`,
`POST /api/load-requests/{id}/matches/{driver_id}/shortlist`,
`POST /api/load-requests/{id}/assign`

**Drivers** — `GET|POST /api/drivers`, `GET|PUT /api/drivers/{id}`,
`GET /api/drivers/{id}/profile`, `PUT /api/drivers/{id}/documents/{doc_id}`

**Trucks** — `GET|POST /api/trucks`, `GET|PUT /api/trucks/{id}`, `GET /api/trucks/{id}/documents`

**Customers** — `GET|POST /api/customers`, `GET|PUT /api/customers/{id}`, `GET /api/customers/{id}/loads`

**Trips** — `GET /api/trips`, `GET /api/trips/{id}`, `PUT /api/trips/{id}/status`,
`POST|GET /api/trips/{id}/location`

**Payments** — `GET /api/payments`, `/payments/summary`, `PUT /api/payments/{id}/status`,
`GET /api/invoices`, `GET /api/invoices/{id}`

**Notifications** — `GET /api/notifications`, `/unread-count`,
`PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`

**Reports** — `GET /api/reports/summary`, `/revenue`, `/daily-loads`, `/top-routes`, `/top-drivers`

**Pricing** — `POST /api/pricing/calculate`, `GET /api/pricing/demand`, `GET /api/pricing/rules`

---

## Notes

- Live tracking polls `GET /api/trips/{id}/location` every 10 seconds. **Ping location** on the
  tracking screen moves the truck along its route, standing in for the driver app's GPS feed.
  Swap the poll for a WebSocket if you need sub-second updates.
- The map is a schematic SVG that projects real coordinates, so no Google Maps key is needed.
  Replace `src/components/MapView.jsx` with a Google Maps or Leaflet component when you have one —
  it already receives `{ lat, lng, label, type }` markers and a route.
- Change `SECRET_KEY` in `backend/utils/security.py` (or set it as an environment variable)
  before putting this anywhere public.


## First Admin account

No demo Admin credentials are built into the application.

On the first `start.bat` run with a database that has no Admin, the launcher
prompts for an Admin email and password and stores the account in the real database.

For unattended startup you can instead set:

- `RPR_ADMIN_EMAIL`
- `RPR_ADMIN_PASSWORD`
- `RPR_ADMIN_NAME` (optional)

Customer and Driver accounts must be registered through the application.

## Driver matching eligibility

Registered drivers and their trucks start unverified/inactive and are intentionally excluded from load matching. An Admin must open the driver's profile and use **Approve Driver & Truck**. That action verifies the driver and assigned truck(s) atomically and activates inactive trucks. Once approved, the driver publishes a dated availability slot; the backend immediately matches real waiting customer loads and `/api/driver/available-loads` returns only persisted offers for that signed-in driver.

## Google Maps setup
Real pickup/drop search and route calculation require Google Maps Platform. Enable Places API, Directions API and Geocoding API. Set `GOOGLE_MAPS_API_KEY` before `start.bat`. Copy `frontend/.env.example` to `frontend/.env` and set a browser/referrer-restricted `VITE_GOOGLE_MAPS_API_KEY`.

The application does not ship a Google key and does not fall back to a hard-coded production city suggestion list.

## Payment provider note
Customer payment actions create real database payment-intent states (`INITIATED` or cash `PENDING`). The application deliberately does not fabricate a successful UPI/card/net-banking/wallet transaction. Connect the selected production gateway and update payment status from its verified callback/webhook.

## Admin bootstrap schema

The current MySQL `users` mapping uses `full_name`, `mobile_number`, `status`,
verification flags, timestamps, and `deleted`. `bootstrap_admin.py` uses those
physical columns directly. The compatibility names `name`, `phone`, and
`is_active` exist only in Python so older application code can keep working;
they are not inserted as database columns.

The preserved bootstrap email is `adminrightpolamright@gmail.com`.
Set `RPR_ADMIN_PASSWORD` and `RPR_ADMIN_MOBILE` before unattended startup,
or the bootstrap will prompt for missing values.

