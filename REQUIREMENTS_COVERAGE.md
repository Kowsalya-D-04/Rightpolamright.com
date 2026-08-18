# RightPolamRight – Requirements Coverage

This build merges the handwritten 4-page requirements with the earlier RightPolamRight blueprint/UI specification.

## Customer
- Registration/login, including Individual / Business / Transport Company account type.
- Real pickup/drop selection and route/distance flow.
- Load request persists pickup/drop, distance, load type, weight, truck type, pickup date/time, expected delivery date, contact number and load image.
- My Loads uses backend data and supports status-oriented views.
- Assigned trip exposes driver/truck details only after Admin confirmation.
- Payments use persisted payment state; no fake successful online payment.
- Rating/feedback is persisted as DriverRating.

## Driver
- Registration/login with driver, licence and truck details.
- Truck model and colour plus driver/licence/RC/insurance/truck image fields are persisted.
- New drivers remain Pending/Unverified until Admin approval.
- Availability supports NEW_LOAD, RETURN_LOAD, PARTIAL_LOAD and ON_THE_WAY_LOAD.
- Availability persists total and available capacity.
- Matching uses real DB loads, verification, truck state, capacity, schedule, pickup proximity, route compatibility and score threshold.
- Driver can Accept/Reject; Admin remains final assignment authority.
- Assigned trips, GPS tracking, proof of delivery, profile and earnings use backend data.

## Admin
- Dashboard/customer/driver/load/trip/payment/pricing/report/notification areas use backend APIs.
- Driver verification changes both driver and truck matching eligibility.
- Driver controls include verification/blocking flows already present in the project.
- Load Matching shows persisted matching results and scores.
- Admin final confirmation creates the assignment/trip.
- Cost Management includes Base Fare, Rate Per KM and explicit Rate Per KG, while retaining detailed charges.
- Pricing changes require an audit reason.

## Pricing
Single backend pricing service is the source of truth:
Base fare + distance/rate-per-km + weight/rate-per-kg + fuel + toll + loading + unloading + driver bata + platform fee + GST + surge.

## Real-data rule
No load, driver, payment, availability, match or dashboard value should be fabricated in production UI. External services such as Google Maps and a real online payment gateway still require valid deployment credentials/provider configuration.
