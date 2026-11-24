# CBS Stays Bangladesh — Phase 2: Core Listing MVP — Technical Development Plan

Companion to `CBS_Stays_Phase2_CoreMVP_Plan.md`. Builds on the stack and
foundation established in `CBS_Stays_Phase1_TechnicalDevPlan.md`, as
`src/modules/{listings,bookings}/` backend modules and a `features/{listings}/`
slice on the frontend (per the module shape defined in the Phase 1 tech plan).

## 1. New Infrastructure This Phase

| Addition | Why |
|---|---|
| Payment aggregator SDK (SSLCommerz or aamarPay — resolve OQ-5 before Sprint 5) | FR-B3 online payment with hold |
| bKash/Nagad merchant API (direct, for token deposits in Phase 3 — stub the interface now) | Forward-compatible with FR-B2 |
| Geo search: PostGIS extension on Postgres | FR-S1/S2 bounding-box map search |
| Image pipeline: on-upload resize/compress/watermark (Sharp, run as a BullMQ job) | FR-H7 |
| SMS/push notification dispatcher module | Booking lifecycle events |

## 2. Frontend Component & State Plan

This is the phase where the component tree stops being mostly auth/admin
screens and becomes the real marketplace UI, so it's worth being explicit about
the atomic breakdown before Sprint 1 starts.

| Atomic layer | Examples (new this phase) |
|---|---|
| Atoms (shadcn primitives, mostly as-is) | `Button`, `Input`, `Checkbox`, `Badge`, `Tabs`, `Dialog`, `Skeleton` |
| Molecules | `PriceTag`, `TenantTypeChip`, `StatusBadge`, `MapPin`, `PhotoThumb`, `FilterChip` |
| Organisms | `PropertyCard`, `UnitSelectionTable` (the FR-H3 UI — see below), `BookingPriceBreakdown`, `PaymentMethodPicker`, `ArrivalPassCard` |
| Templates | `SearchMapLayout` (split list/map), `PropertyDetailLayout`, `CheckoutLayout` |

**`UnitSelectionTable` is the component to get right first.** It consumes a
single RTK Query `useGetPropertyUnitsQuery(propertyId)` and renders the
dependency-blocking state purely from server data (`unit.blockedBy` resolved
server-side from `unit_dependencies`) — the component must never compute
blocking itself from client state, because the booking engine's exclusion
constraint is the source of truth and the UI has to reflect it, not duplicate
it. On select, it calls a mutation (`useCreateBookingHoldMutation`) and relies
on RTK Query's cache invalidation (tag: `['Unit', propertyId]`) to refetch the
table so a second browser tab sees the unit go unavailable without a manual
refresh.

**RTK Query API slices this phase**: `listingsApi` (search, property detail,
units), `bookingsApi` (booking, payment, arrival pass, disputes). Each injects
into the single root `apiSlice` created in Phase 1, rather than standing up
separate `createApi` instances — this keeps the RTK Query cache and tag
invalidation graph in one place.

## 3. Data Model (Phase 2 tables, additive to Phase 1)

```
owners (extends users)
  user_id, nid_number_encrypted, nid_photo_url, proof_of_authority_url,
  verification_status ('pending'|'approved'|'rejected'), verified_at

properties
  id, owner_id, title, division, district, thana, area,
  lat, lng (PostGIS point), exact_address_encrypted,
  tenant_type ('family'|'bachelor_m'|'bachelor_f'|'student'|'any'),
  status ('draft'|'pending_review'|'live'|'paused'|'rejected'|'expired'|'deleted'),
  utilities_json (electricity meter type, gas, water, internet, service charge)

units
  id, property_id, kind ('whole_flat'|'room'|'seat'),
  name, capacity, bed_count, nightly_price, monthly_price,
  meals_included (bool, for mess seats), gender_restriction

unit_dependencies
  unit_id, blocks_unit_id            -- whole-flat row blocks every room/seat row and vice versa (FR-H3)

unit_photos
  id, unit_id, url, sort_order, moderation_status

bookings
  id, unit_id, tenant_id, check_in, check_out,
  mode ('instant'|'request_to_book'), status
    ('pending'|'confirmed'|'rejected'|'expired'|'cancelled'|'completed'),
  cancellation_policy ('flexible'|'moderate'|'strict')

booking_line_items
  booking_id, kind ('rent'|'deposit'|'service_charge'|'platform_fee'|'vat'),
  amount_bdt

payments
  id, booking_id, method ('bkash'|'nagad'|'rocket'|'card'|'token'),
  amount_bdt, status ('held'|'released'|'refunded'|'failed'),
  aggregator_txn_id, held_until, released_at

arrival_passes
  booking_id, address_decrypted_snapshot, caretaker_contact,
  lock_instructions, wifi_json, released_at   -- only written once payment/token clears
```

## 4. The One Piece of Logic That Must Not Be Wrong: FR-H3

Inventory dependency is the single highest-risk rule in the whole product. Implement
it as a database constraint, not just application logic:

- A `unit_dependencies` row for every whole-flat ↔ room/seat relationship.
- On booking creation, a transaction checks for any *overlapping date range*
  booking on the target unit **or any unit in its dependency set**, using a
  Postgres exclusion constraint (`EXCLUDE USING gist`) on `(unit_id, daterange)`
  joined through dependencies. Prisma's schema language can't express an
  `EXCLUDE` constraint directly, so add it as a raw SQL block in a Prisma
  migration (`migration.sql`, hand-written after `prisma migrate dev --create-only`)
  — the constraint itself still lives in Postgres and is still what the booking
  service relies on, Prisma just can't be the thing that generates it. Do not
  substitute an application-level `SELECT` then `INSERT` inside
  `prisma.$transaction`, since Prisma's default transaction isolation won't
  stop two concurrent requests from both passing the `SELECT` check before
  either `INSERT` commits — the DB constraint is what actually closes that race.
- Write the test matrix named in the product plan's acceptance criteria as actual
  integration tests before this ships: book-whole-then-try-room (must fail),
  book-room-then-try-whole (must fail), book-two-different-rooms (must succeed),
  release-and-rebook (must succeed).

## 5. API Surface (Phase 2 additions)

| Method & Path | Purpose |
|---|---|
| `GET /search/properties?bbox=&type=&tenant_type=&...` | FR-S1–S5 |
| `GET /properties/:id` / `GET /properties/:id/units` | listing detail + unit table |
| `POST /owner/properties` (multi-step, matches onboarding wizard) | FR-H1 |
| `PATCH /admin/properties/:id/status` | FR-H8 approval gate |
| `POST /bookings` → `POST /bookings/:id/pay` | FR-B1, B3 |
| `GET /owner/calendar/:unitId`, `POST /owner/calendar/:unitId/ical-export`, `POST /owner/calendar/:unitId/ical-import` | FR-H4 |
| `POST /bookings/:id/dispute` | FR-B13 |
| `GET /admin/reconciliation` | FR-B14 |

## 6. Sprint-Level Engineering Tasks (maps to the 6×2-week plan)

**Sprint 1** — `owners` + NID verification queue endpoints; admin verification
queue UI wired to real data.

**Sprint 2** — `properties`/`units`/`unit_photos`; image pipeline (resize/
compress/watermark + moderation flag); listing state machine (`FR-H8`) enforced
server-side (a status transition table, not free-form string writes).

**Sprint 3** — `unit_dependencies` + the exclusion-constraint booking guard
described above, built and tested *before* any booking UI consumes it; PostGIS
bounding-box search endpoint; `tenant_type` enforcement on the booking endpoint
(reject a bachelor-profile user booking a family-only unit at the API layer, not
just hidden in the UI).

**Sprint 4** — full filter set on the search endpoint; mess/seat fields.

**Sprint 5** — payment aggregator integration behind an interface
(`PaymentProvider`) so OQ-5's final choice is a config swap, not a rewrite;
`payments` table with held/released state machine; `arrival_passes` write-once
logic gated on payment confirmation.

**Sprint 6** — cancellation policy engine; masked-chat proxy (phone numbers
never leave the server before booking confirmation — enforce by never sending
the raw phone number to the client, not by UI hiding); commission/VAT
calculation on bookings; load test against NFR-1 (search p95 < 2s) and fix the
worst offender before sign-off; field-agent bulk-onboarding CLI/script to seed
the 1,000-listing exit target realistically.

## 7. Testing Priorities

1. The FR-H3 exclusion-constraint test matrix (above) — highest priority in the
   whole phase.
2. Bachelor-vs-family booking rejection — integration test, not just a UI check.
3. Payment webhook idempotency (aggregator callbacks can arrive more than once;
   `payments.aggregator_txn_id` must be unique-constrained).
4. Masked-chat: an automated test asserting the phone number never appears in
   any API response before `bookings.status = 'confirmed'`.

## 8. Exit Gate Into Phase 3

Don't start Phase 3 payment/loyalty work until: the booking exclusion constraint
has survived a concurrency test (parallel booking attempts on dependent units)
and at least one real aggregator payment has completed in staging.
