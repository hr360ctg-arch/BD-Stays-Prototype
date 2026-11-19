# CBS Stays Bangladesh — Phase 2: Core Listing MVP — Implementation Plan

Source: CBS_Stays_Bangladesh_BRD.pdf, Section 12 (Release plan, Phase 2)
Timing: Months 2–4 (≈12 weeks, starts after Phase 1 sign-off)
Covers requirements: FR-S1–S5, S11, S13, FR-H1–H8, FR-B1, B3, B6–B8, FR-T1–T6,
FR-C1, C2, C7, plus Food MVP: FR-F1–F6, F10–F12, F14–F18
Exit criteria (from BRD): first paid bookings in Dhaka; 1,000 live verified listings

## 1. Objective

Ship a usable, trustworthy, bookable Dhaka-only marketplace plus a parallel food
MVP, on the identity/admin/audit/backup foundation built in Phase 1. This is the
largest phase in the whole plan and covers two products at once — it must run as
two parallel workstreams with separate backlogs (per BRD risk R-11), not one queue.

## 2. Workstream Split

Per BRD mitigation for R-11 ("two products launched together split team focus"):
run **Stays** and **Food** as two parallel tracks sharing only identity, payments,
notifications and admin — each with its own owner and backlog. Below, the two
tracks are laid out side by side by sprint so they can be staffed independently.

## 3. Sprint Plan (six 2-week sprints)

### Sprint 1 (Weeks 1–2) — Trust & Verification Core
**Stays:** FR-T1 (owner verification: OTP, NID/passport, proof of ownership/authority),
FR-T2 (tenant/guest verification: OTP, NID/passport; encrypted ID storage with
retention policy), FR-T8 carry-over integration (verified flags gate publishing).
**Food:** FR-F10 (restaurant onboarding: owner details, trade licence, NID, payout
account, delivery radius — admin approval gate), FR-F14 (rider onboarding: NID,
licence, vehicle, photo, emergency contact — admin approval + training checklist).
**Shared:** admin verification queue UI (extends FR-A3 console from Phase 1).

### Sprint 2 (Weeks 3–4) — Listing & Menu Creation
**Stays:** FR-H1 (owner onboarding wizard, Bangla/English, phone-assisted),
FR-H2 (unit selection table data model: rooms/seats/whole-flat as rows), FR-H7
(photo rules: min 5 photos live / 1 draft, resize/compress/watermark, moderation
hook), FR-H8 (listing states: Draft → Pending review → Live → Paused →
Rented/Booked → Rejected → Expired → Deleted-soft; admin approval before first
publish).
**Food:** FR-F2 (restaurant page/menu: categories, photos, size/add-ons, hours,
prep time), FR-F11 partial (menu/stock edit, opening hours in dashboard).

### Sprint 3 (Weeks 5–6) — Inventory Rules & Discovery
**Stays:** FR-H3 (inventory dependency rules: whole-flat booking blocks all
rooms/seats and vice versa — this is the single highest-risk logic in the phase;
needs its own test matrix across date ranges), FR-S1–S3 (split-screen map/list
results, bounding-box search, division/district/thana/area search with stay-type
filter), FR-C1 (tenant-type rule: Family/Bachelor-M/F/Student/Any declared per
listing).
**Food:** FR-F1 (restaurant discovery by area/near-me, cuisine/rating/time/price/
halal tags, Bangla+English search).

### Sprint 4 (Weeks 7–8) — Filters, Rules Enforcement, Cart
**Stays:** FR-S4–S5 (full filter set incl. tenant-type filter shown on card), FR-C2
(mess/seat rental: per-seat price, gender, meals, house rules), FR-C7 (utilities
clarity: electricity meter type, gas, water, internet, service charge stated per
listing), FR-C1 enforcement in booking flow (declared profile + verified ID checked
before a bachelor can book a family-only listing — this is a named BRD acceptance
criterion, test explicitly).
**Food:** FR-F3 (single-restaurant cart, delivery address + map pin + landmark,
schedule-now/later, price breakdown in ৳).

### Sprint 5 (Weeks 9–10) — Booking, Payment Hold, Order Lifecycle
**Stays:** FR-B1 (booking flow: unit/dates/guests, price breakdown, confirm), FR-B3
(online payment with hold via licensed aggregator — bKash/Nagad/Rocket/Upay/
cards; funds held, released 24h post-check-in absent dispute), FR-B7 (Instant
Booking vs Request-to-Book with 24h auto-expiry), FR-B8 (digital arrival pass:
address/map pin, caretaker contact, lock/Wi-Fi info, owner phone — released only
after payment/token received), FR-S11 (listing detail page assembling gallery,
amenities, rules, map, availability calendar, cancellation terms shown pre-payment).
**Food:** FR-F4 (payment: bKash/Nagad/Rocket/cards + COD with limits, optional
tip), FR-F5 (order lifecycle states with SMS/push at each step), FR-F17 (dispatch:
automatic assignment by distance/availability + manual dispatch board +
re-assignment on rejection/delay).

### Sprint 6 (Weeks 11–12) — Hardening, Commission, Cancellation, Launch Readiness
**Stays:** FR-B6 (cancellation policies: Flexible/Moderate/Strict shown on card and
pre-payment), FR-T3–T6 (verified badges incl. Superhost, verified-reviews gate
staged for Phase 3 but data model started here, masked in-app chat/call —
phone numbers hidden until confirmation, moderation queue for listings, banned-
word filter Bangla+English, report buttons), FR-S13 (Bangla default toggle,
listing page under 1MB with lazy-loaded images — perf budget enforced, ties to
NFR-1).
**Food:** FR-F6 (cancellation/refund rules: free before accept, refund to wallet/card
on complaint, admin override), FR-F12 (commission config per restaurant, VAT
handling, payout statements, reconciliation), FR-F18 (delivery zones/fees:
area-based, distance-based fee, minimum order, peak/weather surcharge).
**Both:** end-to-end payment reconciliation test, load test against NFR-1 (search
<2s p95 on 4G) and NFR-6 floor (not full 100k/5k target yet, but no architectural
blocker), Dhaka-area field-agent onboarding push begins (mitigates R-3 cold
start) to reach the 1,000-listing exit target.

## 4. Acceptance / Exit Criteria

1. At least one real, paid booking completed end-to-end in Dhaka (search → book →
   pay-with-hold → arrival pass issued → payout eligible at T+24h).
2. 1,000 live, NID-verified listings in Dhaka.
3. Booking a whole flat blocks every room/seat under it for the same dates, and the
   reverse, verified across a written test matrix (BRD-named acceptance criterion).
4. A bachelor-profile tenant is blocked from booking a Family-only listing (BRD-named
   acceptance criterion).
5. Phone numbers are not visible in chat before booking confirmation (BRD-named
   acceptance criterion).
6. Food MVP live in the same Dhaka zones: a customer can browse, order, pay
   (wallet or COD), and a rider can accept/deliver with dispatch assignment working.
7. Restaurant and rider onboarding both gated behind admin approval; no
   unapproved restaurant/rider can go live.

## 5. Dependencies, Risks, Open Questions to Resolve Before/During

- **OQ-3** (commission model/rates) must be answered before Sprint 6 (FR-F12,
  FR-B10 depend on it) — do not hardcode a placeholder rate into production.
- **OQ-5** (payment partner selection: SSLCommerz/aamarPay/bKash-Nagad direct)
  must be answered before Sprint 5 — the payment-hold integration is partner-
  specific and cannot be built against "TBD."
- **R-3 (cold start)** — field-agent owner onboarding by phone/visit should start in
  parallel from Sprint 1, not wait for the product to be feature-complete, or the
  1,000-listing exit target will slip.
- **R-10 (delivery economics)** — per BRD mitigation, scope food delivery to 2–3
  dense Dhaka areas only in this phase, not city-wide, to protect rider unit
  economics while order volume ramps.
- **R-7 (competition)** — differentiation (verified listings, multi-room booking,
  pay-at-property readiness, mess seats) should be visible in marketing/UI copy
  by launch, even though pay-at-property itself ships in Phase 3.

## 6. What Explicitly Does Not Start Yet

Pay-at-property/token deposits (FR-B2, B4, B5), reviews (FR-T4 full flow), loyalty
club (FR-T9–T10), roommate matcher (FR-C3), digital rental agreement (FR-C4),
police tenant info export (FR-C5), live order tracking (FR-F19), coupons (FR-F20),
food/stays analytics dashboards (FR-F22, reporting section) — all deferred to
Phase 3.
