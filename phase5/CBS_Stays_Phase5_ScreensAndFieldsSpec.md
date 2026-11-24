# CBS Stays Bangladesh — Phase 5: Transport Ticketing — Screens & Field Specification

Field-level companion to `CBS_Stays_Phase5_TransportTicketing_Plan.md` and
`CBS_Stays_Phase5_TechnicalDevPlan.md`. Covers the **Transport Ticketing**
vertical (tenant/guest booking flow, Transport Operator dashboard, admin
oversight). Builds on the Phase 1 admin shell — new admin screens here extend
`/admin`. Bus only this phase.

---

## P5-01 — Transport Operator Onboarding

**Route:** `/operator/signup` · **Src:** FR-TK1

| Field | Type | Req |
|---|---|---|
| Operator/company name | Text | Y |
| Owner's full name | Text | Y |
| Owner NID number | Text + photo upload | Y |
| Trade licence number | Text + photo upload | Y |
| Payout account | bKash/Nagad merchant number or bank account + routing | Y |
| Primary routes served | Repeatable origin → destination pairs | Y |
| Fleet size (approx.) | Number | N |

**On submit:** application enters `Pending review`; operator sees a status
card on login until admin approval (FR-TK1 approval gate — no trip can be
published before approval).

---

## P5-02 — Bus & Seat-Map Template Builder

**Route:** `/operator/buses/new` · **Src:** FR-TK3

| Field | Type | Notes |
|---|---|---|
| Bus registration number | Text | Y |
| Bus name/label | Text | e.g. "Green Line — Volvo 36" |
| Total rows | Stepper | Drives the generated grid |
| Seats per row | Stepper (e.g. 4 for 2-2 layout, 5 for 2-3) | Aisle position auto-inferred from the split (e.g. 2+2, 2+3) |
| Seat class per row range | Repeatable: row range + class (AC / Non-AC / Business/Sleeper) | e.g. rows 1–3 = Business, 4–12 = AC |
| Last-row layout override | Toggle + manual seat count | Handles the common "5-across back row" case |

**Visual preview:** the generated seat grid renders live as the operator
fills the fields above, with each seat labeled (e.g. `1A`, `1B`, `1C`, `1D`)
so the operator can confirm it matches the real bus before saving. Saved
templates are reusable across many trips for the same bus.

---

## P5-03 — Trip Creation

**Route:** `/operator/trips/new` · **Src:** FR-TK2

| Field | Type | Req |
|---|---|---|
| Bus (template) | Select from operator's saved buses | Y |
| Origin | Autocomplete (division/district/area, reusing Phase 1/2 vocabulary) | Y |
| Destination | Autocomplete | Y |
| Departure date & time | Date-time picker | Y |
| Estimated arrival time | Time picker | Y |
| Fare per seat class | Number input per class defined in the bus template (e.g. AC ৳800, Non-AC ৳550) | Y |
| Boarding point(s) | Repeatable: name + address | N |
| Dropping point(s) | Repeatable: name + address | N |
| Cancellation policy | Select: operator's saved policy (see P5-09) or "Create new" | Y |

**On save:** trip appears in the operator's upcoming-trips list with status
`Scheduled`, and its full seat inventory is generated from the bus template
(every seat starts `Available`).

---

## P5-04 — Trip Search (public/tenant)

**Route:** `/tickets/search` · **Src:** FR-TK5

**Search bar:** Origin (autocomplete) · Destination (autocomplete) ·
Travel date (date picker) · `Search` button.

**Results list (one row per trip):** operator name + logo, departure time →
arrival time, duration, boarding point, bus type/class badges, fare range
(lowest–highest seat class), seats remaining (e.g. "12 seats left" — shown
in red under 5), `View seats` button.

**Filters:** departure time band (Early morning/Morning/Afternoon/
Evening/Night), bus class (AC/Non-AC/Business), operator.

**Sort:** Departure time, Price (low–high/high–low), Seats remaining.

**Empty state:** "No trips found for this route and date" + suggest nearby
dates (±1 day) if any exist.

---

## P5-05 — Seat Map & Selection

**Route:** `/tickets/trips/:id/seats` · **Src:** FR-TK6

**Trip summary bar (sticky top):** operator, route, date/time, bus class.

**Seat map (the FR-TK6 centerpiece):** visual grid matching the bus's saved
layout (P5-02), rendered from live server state:

| Seat state | Visual |
|---|---|
| Available | Outlined, seat class color-coded |
| Selected (by this user, this session) | Filled brand color |
| Held by another user (mid-checkout) | Greyed, disabled, "Held" label |
| Sold | Greyed, disabled, "Booked" label |
| Blocked (operator maintenance) | Greyed, disabled, "Unavailable" label |

Clicking an Available seat selects it (multi-select supported for group
bookings) and immediately calls a hold endpoint — the seat flips to "Held by
you" with a visible countdown timer (e.g. 8:00) so the tenant knows the
checkout window. If the timer expires before payment, the seat silently
reverts to Available and the tenant sees "Your seat hold expired — please
reselect" if they're still on the page.

**Running total panel:** selected seat numbers + class, fare per seat,
subtotal, `Continue to checkout` button (disabled until ≥1 seat selected).

---

## P5-06 — Checkout

**Route:** `/tickets/trips/:id/checkout` · **Src:** FR-TK7

**Passenger details (one block per selected seat):**
| Field | Type | Req |
|---|---|---|
| Passenger full name | Text | Y |
| Phone number | Text (prefilled for the primary passenger from account) | Y for primary, N for others |
| Age | Number | N |
| Gender | Select | N |

**Price breakdown:**
| Line | Example |
|---|---|
| Seat 1A (AC) | ৳ 800 |
| Seat 1B (AC) | ৳ 800 |
| Platform fee | ৳ 40 |
| VAT (15% on platform fee) | ৳ 6 |
| **Total due now** | ৳ 1,646 |

**Payment method (full payment only, FR-TK7):** bKash, Nagad, Rocket, Card
(Visa/Mastercard/DBBL Nexus) — no token/partial-payment option is shown,
unlike the Stays booking flow. Each method shows "Charged in full now — no
partial payment for ticket bookings."

**On successful payment:** redirects to P5-07 (ticket view). On failure:
retry button + the seat hold is extended once by the remaining TTL to avoid
losing the seat on a transient payment error, then released if it expires.

---

## P5-07 — Digital Ticket

**Route:** `/tickets/:bookingId` · **Src:** FR-TK8

Ticket card: operator name/logo, route + date/time, boarding point + time,
seat number(s) + class, passenger name(s), reference/PIN code, QR code
(encodes the reference code for gate scanning), operator contact number,
`Download PDF`, `Add to wallet` (Google/Apple Wallet pass, stretch), `Cancel
ticket` (subject to the trip's cancellation policy, opens P5-08).

---

## P5-08 — Cancellation (inline flow, not a separate page)

Triggered from P5-07's `Cancel ticket`. **Src:** FR-TK9

Shows the applicable refund amount computed from the operator's cancellation
policy and time-to-departure (e.g. "Departure is in 8 hours — you qualify for
a 100% refund" vs. "Departure is in 1 hour — no refund per this operator's
policy"), a reason dropdown (optional), `Confirm cancellation`. On confirm,
the seat immediately flips back to Available in the live seat map for other
tenants.

---

## P5-09 — Operator: Cancellation Policy Builder

**Route:** `/operator/policies` · **Src:** FR-TK9

Repeatable rule rows: `Up to [N] hours before departure → [100/75/50/0]%
refund`. Saved policies are reusable across trips (selected in P5-03).

---

## P5-10 — Operator Dashboard

**Route:** `/operator` · **Src:** FR-TK10

**Stat tiles:** Upcoming trips · Seats sold this week · This week's revenue ·
Average occupancy rate.

**Tabs/sections:**
- **Trips** — list with status (Scheduled/Departed/Cancelled), seat occupancy
  bar per trip, `Edit` (only before any seat sold), `Cancel trip` (triggers
  automatic full refund to every booked passenger, admin-notified).
- **Bookings** — table of all tickets sold, filterable by trip/date, each row:
  passenger name(s), seat(s), amount, booking time, status.
- **Passenger manifest** — per-trip printable/exportable list (name, seat,
  phone) for boarding-gate use.
- **Earnings & Payouts** — table of completed trips, payout schedule,
  downloadable statement (mirrors the Stays owner earnings view, P2-10).
- **Buses** — manage saved bus/seat-map templates (P5-02).

---

## P5-11 — Admin: Operator Verification Queue

**Route:** `/admin/operators` · **Src:** FR-TK11, extends Phase 1 FR-A3

Table: operator name · owner name · submitted date · documents (trade
licence, NID) · status (Pending/Approved/Rejected) · row actions: `View`,
`Approve`, `Reject` (reason required). Detail view mirrors the Phase 1
owner-verification pattern (document preview, approve/reject decision panel).

---

## P5-12 — Admin: Trip/Route Oversight & Disputes

**Route:** `/admin/ticketing` · **Src:** FR-TK12

- **Trips table:** operator, route, date, seats sold/total, status, flagged
  (if reported), row actions: `Pause trip` (stops new sales), `Delist
  operator` (suspends all of an operator's trips, soft — reversible).
- **Disputes sub-view:** list of ticket disputes (wrong seat, no-show bus,
  refund request outside policy) with `Resolve in passenger's favour
  (refund)` / `Resolve in operator's favour` / `Request more info` — mirrors
  the Phase 2 P2-13 disputes pattern.

---

## Cross-cutting notes for Phase 5

- Every seat-state change (Available → Held → Sold/Available) must be read
  from and written to the server on every seat map render — no client-side
  seat-state cache survives longer than one page session, since a stale
  cache is exactly how two tenants could both believe the same seat is free.
- Fares are shown in ৳ with thousands separators, consistent with the Stays
  pricing display convention (no separate formatting rule for this vertical).
- The operator role is fully separate from Owner — an account can hold both
  roles, but the two dashboards, onboarding flows, and verification queues
  never merge into one UI.
