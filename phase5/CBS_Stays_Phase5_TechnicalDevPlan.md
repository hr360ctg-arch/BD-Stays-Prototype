# CBS Stays Bangladesh — Phase 5: Transport Ticketing — Technical Development Plan

Companion to `CBS_Stays_Phase5_TransportTicketing_Plan.md`. Builds on the
stack and foundation established in the Phase 1–4 tech plans — as a
`src/modules/ticketing/` backend module with its own
`routes/controller/service/repository`, and a `features/ticketing/` slice on
the frontend (per the module shape defined in the Phase 1 tech plan). Shares
identity, admin console, audit log, and the payment-aggregator integration
with Stays; everything else is independent.

## 1. New Infrastructure This Phase

| Addition | Why |
|---|---|
| Redis-backed seat-hold store (short TTL keys, e.g. `seat_hold:{seatId}` → `{userId, expiresAt}`) | FR-TK6 real-time seat hold without hammering Postgres for every hold check |
| QR code generation library (e.g. `qrcode` npm package, server-side) | FR-TK8 ticket QR |
| PDF generation for ticket download (reuse whatever's chosen for Stays statements if one exists, else a lightweight library) | FR-TK8 |
| Background job (BullMQ, already used in Phase 2 for the image pipeline) for seat-hold expiry sweep | FR-TK6 — releases abandoned holds even if a query-time check is also in place, as a safety net |

## 2. Frontend Component & State Plan

| Atomic layer | Examples (new this phase) |
|---|---|
| Atoms (shadcn primitives, mostly as-is) | `Button`, `Badge`, `Dialog`, `Tabs`, `Skeleton` |
| Molecules | `SeatIcon` (state-driven: available/selected/held/sold/blocked), `TripRow`, `FareLine`, `CountdownTimer` |
| Organisms | `SeatMapGrid` (the FR-TK6 centerpiece — see below), `TripSearchResults`, `PassengerDetailsForm`, `TicketCard`, `OperatorTripTable` |
| Templates | `TicketSearchLayout`, `SeatSelectionLayout`, `OperatorDashboardLayout` (can extend the existing `DashboardLayout` template from Phase 1 rather than forking a new one) |

**`SeatMapGrid` is the component to get right first**, same priority
`UnitSelectionTable` had in Phase 2. It renders purely from server state
(`useGetTripSeatsQuery(tripId)`, polling or socket-subscribed — see Realtime
below) and never infers a seat's availability from local state. Selecting a
seat calls `useHoldSeatMutation`, which on success starts the
`CountdownTimer` from the server-returned `expiresAt`, not a client-guessed
duration — if the server and client disagree about when the hold expires,
the server wins and the client resyncs on next poll.

**Realtime:** reuse the Socket.io connection already standing from Phase 1
(originally scoped for admin live updates). Add a `trip:{tripId}` room; on
any seat state change (held/released/sold), emit to the room so every open
seat map for that trip updates live without a manual refresh. Polling every
5s is an acceptable fallback if Socket.io scope is cut, but ship the socket
version first since the whole point of this screen is that staleness causes
a visibly broken double-booking UX.

**RTK Query API slice this phase**: `ticketingApi` (operators, buses, trips,
seats, bookings), injected into the same root `apiSlice` as every other
module.

## 3. Data Model (Phase 5 tables, additive to Phases 1–4)

```
operators (extends users)
  user_id, company_name, nid_number_encrypted, trade_licence_no,
  trade_licence_doc_url, payout_account, verification_status
    ('pending'|'approved'|'rejected'), verified_at

buses
  id, operator_id, registration_no, label, total_rows, seats_per_row

seat_templates
  id, bus_id, seat_number ('1A','1B',...), row, col, class
    ('ac'|'non_ac'|'business')

routes
  id, origin_area_id, destination_area_id   -- reuses Phase 1/2 area reference data

trips
  id, operator_id, bus_id, route_id, depart_at, arrive_at_estimate,
  status ('scheduled'|'departed'|'cancelled'),
  cancellation_policy_id

trip_seats
  id, trip_id, seat_template_id, fare_bdt,
  status ('available'|'held'|'sold'|'blocked')
  -- one row per seat per trip, generated from seat_templates on trip creation

seat_holds
  trip_seat_id, user_id, expires_at   -- mirrored in Redis for fast reads; Postgres row is the durable/auditable record

ticket_bookings
  id, trip_id, booked_by_user_id, status
    ('pending_payment'|'confirmed'|'cancelled'),
  reference_code, qr_payload, total_bdt

ticket_booking_seats
  booking_id, trip_seat_id, passenger_name, passenger_phone,
  passenger_age, passenger_gender

ticket_payments
  id, booking_id, method ('bkash'|'nagad'|'rocket'|'card'),
  amount_bdt, status ('succeeded'|'failed'|'refunded'),
  aggregator_txn_id

cancellation_policies
  id, operator_id, name, rules_json   -- [{hours_before: 6, refund_pct: 100}, {hours_before: 2, refund_pct: 50}, ...]
```

## 4. The One Piece of Logic That Must Not Be Wrong: Seat Double-Sale

This is this phase's equivalent of Phase 2's FR-H3 inventory exclusion — the
highest-risk logic in the phase, and it gets the same treatment:

- A seat's `status` transition (`available` → `held` → `sold`) must be an
  atomic, single-row update guarded by a `WHERE status = 'available'` (or
  `'held' AND held_by = :userId` for the hold→sold step) clause, checking the
  affected row count is exactly 1 before proceeding. Two concurrent requests
  racing to hold the same seat: exactly one `UPDATE` affects a row, the other
  affects zero rows and the request fails cleanly with "Seat no longer
  available" — this is a compare-and-swap pattern, not a `SELECT` then
  `INSERT`/`UPDATE` in separate statements, for the same reason Phase 2
  rejected that approach.
- The Redis seat-hold key is a **performance/UX optimization** (fast reads for
  the seat map's live state), not the source of truth — the Postgres
  `trip_seats.status` column is the source of truth. If Redis and Postgres
  ever disagree (e.g. after a Redis restart), Postgres wins; do not let the
  booking-confirmation path trust Redis alone.
- Write the equivalent test matrix before this ships: hold-seat-then-second-
  user-hold-same-seat (second must fail), hold-expires-then-rebook (must
  succeed), hold-then-pay (must succeed and flip to sold), pay-after-hold-
  expired (must fail cleanly, not silently charge for an unavailable seat).

## 5. API Surface (Phase 5 additions)

| Method & Path | Purpose |
|---|---|
| `POST /operators` (onboarding) | FR-TK1 |
| `PATCH /admin/operators/:id/status` | FR-TK1 approval gate |
| `POST /operator/buses` (+ seat template) | FR-TK3 |
| `POST /operator/trips` | FR-TK2 — also generates `trip_seats` from the bus's `seat_templates` |
| `GET /tickets/search?origin=&destination=&date=` | FR-TK5 |
| `GET /tickets/trips/:id/seats` | FR-TK6 — live seat state |
| `POST /tickets/trips/:id/seats/:seatId/hold` | FR-TK6 — compare-and-swap hold |
| `POST /tickets/bookings` → `POST /tickets/bookings/:id/pay` | FR-TK7 |
| `GET /tickets/bookings/:id` | FR-TK8 ticket detail (QR payload, reference code) |
| `POST /tickets/bookings/:id/cancel` | FR-TK9 |
| `GET /operator/trips`, `GET /operator/trips/:id/manifest` | FR-TK10 |
| `GET /admin/operators` (queue) | FR-TK11 |
| `GET /admin/ticketing/trips`, `PATCH /admin/ticketing/trips/:id/pause` | FR-TK12 |
| `POST /admin/ticketing/disputes/:id/resolve` | FR-TK12 |

## 6. Sprint-Level Engineering Tasks (maps to the 6×2-week plan)

**Sprint 1** — `operators` table + verification endpoints (extends the
existing Phase 1 verification-queue service to a second applicant type
rather than forking it); `buses` + `seat_templates` CRUD.

**Sprint 2** — `routes` + `trips` CRUD; `trip_seats` generation job (runs
synchronously on trip creation since seat counts are small, no queue needed
here).

**Sprint 3** — `GET /tickets/trips/:id/seats` live-state endpoint; Socket.io
`trip:{tripId}` room wiring; trip search endpoint with basic filters.

**Sprint 4** — the compare-and-swap hold endpoint + Redis mirror + BullMQ
expiry-sweep job; checkout + `ticket_bookings`/`ticket_booking_seats`;
payment integration reusing the Phase 2 `PaymentProvider` interface (same
aggregator, new product context).

**Sprint 5** — `cancellation_policies` engine + refund-amount calculator
(tested at policy-window boundaries); operator dashboard endpoints
(occupancy, revenue, manifest export).

**Sprint 6** — admin operator queue wired to real data; admin trip/route
oversight + dispute endpoints (reusing the Phase 2 dispute-resolution
service's shape); the seat double-sale concurrency test suite; load test on
trip search.

## 7. Testing Priorities

1. The seat double-sale compare-and-swap test matrix (above) — highest
   priority in the whole phase, equivalent to Phase 2's FR-H3 priority.
2. Seat-hold TTL expiry — both the query-time check and the background
   sweep job, tested independently (one disabled at a time) so a failure in
   either is caught, not masked by the other.
3. Payment-then-ticket-issuance ordering — an automated test asserting no
   `ticket_bookings` row ever reaches `confirmed` status before its
   corresponding `ticket_payments` row reaches `succeeded`.
4. Cancellation refund-amount correctness at exact policy-window boundary
   minutes, not just mid-window.

## 8. Exit Gate Into Phase 5b (Air) / 5c (Ship)

Don't start Air or Ship mode work until: the seat double-sale concurrency
test has survived a sustained concurrent-load test (not just a two-request
unit test), at least one real aggregator payment has completed in staging
for a ticket booking, and 25 operators have been successfully onboarded in
production — proving the onboarding/verification flow works at more than
demo scale before extending the data model to new transport modes.
