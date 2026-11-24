# CBS Stays Bangladesh — Phase 5: Transport Ticketing — Implementation Plan

Source: New vertical, added after Phase 4 (supersedes the retired food-delivery
vertical covered in earlier drafts of Phase 2–4). Not present in the original
CBS_Stays_Bangladesh_BRD.pdf — this document is the primary source of truth
for Phase 5 requirements until the BRD itself is reissued to include it.
Timing: Months 9–12 (≈12 weeks, starts after Phase 4 sign-off; can also run
in parallel with late Phase 4 work since it shares only identity/admin/payment)
Covers requirements: FR-TK1–FR-TK12 (defined below)
Exit criteria: first paid bus ticket sold end-to-end; 25 verified operators;
500 live seat-inventoried trips across at least 3 popular Dhaka-origin routes

## 1. Objective

Add a second, independent revenue vertical to CBS Stays: a transport ticketing
marketplace where verified bus operators publish trips with a real seat map,
and tenants/guests book and pay for a specific seat in full, upfront — no token
or escrow, consistent with how a real bus-ticket counter works. Bus is the only
mode in this phase; Air and Ship are intentionally deferred to Phase 5b/5c so
the seat-map and booking engine can be proven on the simplest, highest-volume
mode first.

This is a new, mostly-independent product: it shares the platform's identity,
admin console, audit log, and payment-aggregator integration with Stays, but
has its own role (Transport Operator), its own onboarding, its own data model,
and its own booking logic (seat-level, not unit-level). Treat it as a third
parallel-track module, not an extension of the Stays booking flow.

## 2. Scope (in this phase)

| Requirement | Description |
|---|---|
| FR-TK1 | Transport operator onboarding: company/operator name, owner NID, trade licence number + upload, payout account (bKash/Nagad merchant or bank), default routes served — admin approval gate before any trip can be published |
| FR-TK2 | Route & trip creation: origin, destination, departure date/time, arrival estimate, bus identifier/registration, fare per seat class (e.g. AC/Non-AC/Business) |
| FR-TK3 | Seat map configuration per bus: row/column layout, seat numbers, seat class per seat/row, aisle position — reusable template per bus so operators don't redraw it per trip |
| FR-TK4 | Seat inventory lifecycle: Available → Held (mid-checkout) → Sold → Cancelled → Blocked (operator-side maintenance/out-of-service seat) |
| FR-TK5 | Trip search: origin + destination + date, results list with operator name, departure/arrival time, duration, fare range, seats remaining |
| FR-TK6 | Seat selection UI: visual seat map matching the real bus layout, colour-coded by state, click-to-select (single or multiple seats in one booking), running fare total |
| FR-TK7 | Checkout: passenger details per seat (name, phone, age optional), full payment upfront via bKash/Nagad/Rocket/card — no token/partial-payment option, consistent with counter-ticket norms |
| FR-TK8 | Digital ticket issuance: reference/PIN code, QR code, passenger name, seat number(s), trip details, operator contact — issued immediately on payment success |
| FR-TK9 | Cancellation & refund policy: operator-configured window (e.g. full refund up to 6h before departure, 50% up to 2h, none after), tenant-facing cancel action subject to that policy |
| FR-TK10 | Operator dashboard: upcoming trips, seat occupancy per trip, today's/this-week's revenue, passenger manifest per trip (for boarding) |
| FR-TK11 | Admin: operator verification queue (reuses the Phase 1 FR-A3 console pattern) |
| FR-TK12 | Admin: trip/route oversight (pause/delist a trip or operator) and ticket dispute handling (refund override, reusing the Phase 2 dispute-resolution pattern) |

Out of scope for Phase 5 (deferred to Phase 5b/5c or later): Air and Ship/Launch
modes (same data model, extended with mode-specific fields — cabin class for
ships, aisle/window for air — once Bus is proven), dynamic/surge pricing,
multi-leg/connecting trips, loyalty-point integration with the Stays CBS Club,
operator-side promotions/discounts.

## 3. Sprint Plan (six 2-week sprints)

### Sprint 1 (Weeks 1–2) — Operator Identity & Bus/Seat-Map Templates
FR-TK1 (operator onboarding, admin approval gate), FR-TK3 (seat-map template
builder: define a bus's row/column layout and seat classes once, reuse across
trips). **Shared:** extend the Phase 1 admin verification queue to a second
applicant type (`operator`) rather than building a parallel queue UI.

### Sprint 2 (Weeks 3–4) — Trip & Route Management
FR-TK2 (trip creation form: route, schedule, bus assignment, fare per class),
operator-side trip list (upcoming/past, edit/cancel a trip before any seat is
sold), route data model (origin/destination as structured area references,
reusing Phase 1/2's division/district/thana vocabulary where sensible for
consistency, not a separate free-text field).

### Sprint 3 (Weeks 5–6) — Search & Seat Map UI
FR-TK5 (trip search results), FR-TK6 (the seat-map component — this is the
highest-risk UI in the phase; it must render real-time seat state from the
server, not a client-cached snapshot, so two tenants never see the same seat
as available simultaneously past the point one has it held).

### Sprint 4 (Weeks 7–8) — Checkout & Payment
FR-TK7 (full-payment checkout, passenger-details-per-seat form), seat hold
mechanism (a short TTL hold from seat-click to payment completion, released
automatically on timeout or payment failure), FR-TK8 (ticket issuance: QR +
reference code generation, ticket detail page/printable view).

### Sprint 5 (Weeks 9–10) — Cancellation, Operator Dashboard
FR-TK9 (cancellation/refund policy engine, tenant-facing cancel flow), FR-TK10
(operator dashboard: occupancy, revenue, passenger manifest export for
boarding-gate use).

### Sprint 6 (Weeks 11–12) — Admin Oversight, Hardening, Launch Readiness
FR-TK11 (operator verification queue wired to real data), FR-TK12 (trip/route
oversight, dispute handling reusing Phase 2's dispute pattern), concurrency
test on the seat-hold mechanism (two simultaneous bookings on the same seat —
exactly one must succeed), load test on trip search, field-outreach push to
onboard the first 25 bus operators to reach the exit-criteria trip count.

## 4. Acceptance / Exit Criteria

1. At least one real, paid bus ticket booked end-to-end (search → seat select →
   pay in full → ticket with QR issued).
2. 25 verified bus operators onboarded and approved.
3. 500 live trips with real seat inventory across at least 3 popular Dhaka-origin
   routes (e.g. Dhaka–Chattogram, Dhaka–Sylhet, Dhaka–Cox's Bazar).
4. Two simultaneous attempts to book the same seat: exactly one succeeds, the
   other sees "This seat was just taken" without a double-sale ever reaching
   payment — verified by a written concurrency test, the same rigor as the
   Phase 2 FR-H3 inventory-exclusion test matrix.
5. A ticket cannot be issued before payment succeeds — verified the same way
   Phase 2 verified the arrival pass never renders before payment (FR-B8).
6. Cancellation refund amount matches the operator's configured policy exactly
   at every policy-window boundary (test at the boundary minutes, not just
   mid-window).

## 5. Dependencies, Risks, and Open Questions

- **New risk (seat double-sale)** — the single highest-risk logic in this phase,
  directly analogous to Phase 2's FR-H3 whole-flat/room exclusion problem.
  Solve it the same way: a database-level constraint/lock, not an
  application-level check-then-insert. Do not ship seat selection without a
  concurrency test proving it.
- **New risk (seat-hold abandonment)** — a tenant who selects seats and
  abandons checkout must not permanently lock those seats. The hold needs a
  short, enforced TTL (e.g. 5–10 minutes) with a background job or
  query-time check that releases expired holds, not reliance on the client
  calling a "release" endpoint on page-unload (which is unreliable).
- **OQ-TK1 (payment partner reuse)** — confirm the same aggregator integration
  from Phase 2 (FR-B3) can be reused for ticketing, or whether ticket payments
  need a separate merchant account per the chosen aggregator's rules.
- **OQ-TK2 (operator payout cadence)** — decide whether operator payouts
  follow the same T+24h-after-service pattern as Stays owner payouts, or a
  different cadence appropriate to single-day travel bookings (e.g. payout
  after trip departure, since there's no "check-in" equivalent to anchor to).
- **OQ-TK3 (refund-to-source vs wallet)** — confirm whether cancelled-ticket
  refunds return to the original payment method or to a CBS wallet balance,
  since full-payment-only (no token) changes the refund-amount math compared
  to the Stays token-forfeiture model.
- **R-TK1 (operator trust/cold start)** — same cold-start risk as Phase 2's
  R-3 for property owners; field-outreach onboarding of operators should start
  in Sprint 1, not wait for the product to be feature-complete.

## 6. What Explicitly Does Not Start Yet

Air and Ship/Launch ticketing (same engine, mode-specific fields — deferred to
Phase 5b/5c), dynamic pricing, multi-leg/connecting trips, CBS Club loyalty
integration for ticket purchases, operator-side promotions. These are
intentionally sequenced after Bus proves the seat-map and booking-concurrency
model in production.
