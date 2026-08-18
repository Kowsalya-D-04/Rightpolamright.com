# RightPolamRight implementation gap analysis

## Existing and retained
- React/Vite role portals for Customer, Driver and Admin.
- FastAPI + SQLAlchemy + SQLite backend, JWT role authentication and bcrypt hashing.
- Customer load creation, persisted price snapshots, driver availability, persisted LoadMatch records, driver accept/reject, Admin verification/assignment, trip records, notifications, payments/invoices, ratings, GPS location history and reports.
- `start.bat` using the Windows `py -3` launcher.

## Corrected / expanded in this update
- Orange/white logistics design system applied globally, including orange CTAs/active navigation and white admin sidebar.
- Google Places-backed location search; no production hard-coded city suggestion list.
- Google driving route distance/duration and route towns derived from actual route step coordinates via reverse geocoding.
- Google Maps JS route rendering in Customer/Driver map views when the browser key is configured.
- Blueprint matching weights: pickup 25, route 25, truck type 15, capacity 10, schedule 10, rating 10, price 5; minimum recommendation score 60.
- Mandatory compliance checks now reject expired licence/truck compliance or explicitly rejected/expired document records.
- Driver availability adds trip type and available capacity and matching uses available capacity, not only nominal truck capacity.
- Pricing retains a single backend source of truth and adds configurable fuel-per-km charge.
- Pricing edits require a reason and create an AuditLog record.
- Customer payment initiation supports UPI/Card/Net Banking/Wallet/Cash as real intent states; no fake gateway success is generated.
- Driver tracking now uses browser/device geolocation and pushes it every 15 seconds during active trips; the previous simulated movement helper was removed.
- Proof of Delivery requires a delivery photo and signature image before Delivered can be set.

## External configuration required
- Google Maps Platform credentials are intentionally not hard-coded. Enable Places, Directions and Geocoding APIs and configure `GOOGLE_MAPS_API_KEY` plus `VITE_GOOGLE_MAPS_API_KEY`.
- Online UPI/Card/Net Banking/Wallet payment success requires a real payment-provider integration/webhook. This build records `INITIATED` and never invents success. Admin can maintain payment state using the existing protected payment endpoint until a provider is connected.
- HTTPS termination and production rate limiting belong at the production reverse proxy/API gateway and require deployment environment configuration.
