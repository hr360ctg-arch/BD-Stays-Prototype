# CBS Stays Bangladesh — Phase 3: Differentiators — Implementation Plan

Source: CBS_Stays_Bangladesh_BRD.pdf, Section 12 (Release plan, Phase 3)
Timing: Months 4–8 (≈16 weeks, starts after Phase 2 exit criteria met)
Covers requirements: FR-B2, B4, B5, FR-T9, FR-C3–C5
Exit criteria (from BRD): 30% of bookings using token/pay-at-property

## 1. Objective

Phase 2 proved the core transaction works. Phase 3 adds the features that
differentiate CBS Stays from Facebook groups and brokers (R-7 mitigation) and
deepen retention (BO-6) and trust (BO-4) — pay-at-property, reviews-driven trust,
loyalty, and legally-grounded rental agreements.

## 2. Sprint Plan (eight 2-week sprints)

### Sprint 1 (Weeks 1–2) — Pay-at-Property Foundation
FR-B4 (pay-at-property eligibility rules: verified NID/phone, owner
consent, max amount, no-show history — admin-configurable), FR-B2 groundwork
(token deposit flow design: 10–20% via bKash/Nagad/Rocket, balance in cash/
wallet at check-in).

### Sprint 2 (Weeks 3–4) — Pay-at-Property Launch
FR-B2 full build and launch, FR-B5 (no-show handling: token forfeited
minus platform fee; repeated no-shows suspend the privilege — this directly
drives the 30% exit-criteria metric, instrument it from day one).

### Sprint 3 (Weeks 5–6) — Reviews That Matter
FR-T4 full implementation (verified reviews — completed stay/tenancy
only; rate cleanliness/accuracy/location/owner behaviour; owner reply; no owner
edits; removal only for policy violation), FR-T3 Superhost badge logic wired to
real review/response/cancellation data (no fabricated badges — ties to R-8).

### Sprint 4 (Weeks 7–8) — Loyalty
FR-T9 (CBS Club: Level 1 Member on first completed stay — 5% off
partner-service platform fee; Level 2 Plus at 2 stays — 10% off, free early
check-in subject to availability; Level 3 VIP at 5 stays or 6-month tenancy — 15%
off, priority support), FR-T10 (admin-configurable discount rules and cost cap,
visible to logged-in members).

### Sprint 5 (Weeks 9–10) — Roommate Matching
FR-C3 (roommate/mess matcher: opt-in matching by budget, gender,
diet, schedule for same university/workplace area — new matching-algorithm
component, scope a simple rules-based match first, not ML, given the 2-week
budget).

### Sprint 6 (Weeks 11–12) — Digital Rental Agreement (legal-gated)
FR-C4 (digital rental agreement / bhara chukti: prefilled from booking
data, e-signature by owner+tenant, stamp-paper requirement support, signed-
copy storage). **This requires OQ-4 legal review to be substantially resolved
before build starts** — treat legal sign-off as a hard gate, not a parallel task,
since a wrong agreement format carries real legal risk.

### Sprint 7 (Weeks 13–14) — Police Tenant Registration & Notifications/Analytics
FR-C5 (tenant info for police — Dhaka tenant information form, if OQ-4
confirms applicability; exportable copy for owners), full notification matrix wiring
(booking/payment/payout/review/expiry/verification events across SMS/email/
push/WhatsApp, with consent + unsubscribe for marketing messages, per Section
11).

### Sprint 8 (Weeks 15–16) — Reporting, Hardening, Exit Validation
Platform-wide reporting dashboard (daily users, listings,
enquiries, bookings, conversion, GMV, revenue, top areas/types, cancellation/
dispute rates — Section 11), owner/finance CSV exports and monthly statements,
field-agent workflow (FR-A5: assign verification visits, upload photos/checklist)
if not already shipped, full regression across Phase 2 + Phase 3 features, 30%
token/pay-at-property metric validated against real booking data.

## 3. Acceptance / Exit Criteria

1. ≥30% of all bookings in the measurement window use token deposit or
   pay-at-property (BRD-named exit target) — measured from live data, not a
   projection.
2. A completed stay unlocks the ability to leave a review; an incomplete/unpaid
   stay cannot generate a review.
3. Loyalty tier upgrades automatically on the 2nd and 5th/6-month thresholds and
   the correct discount is visibly applied at checkout.
4. Digital rental agreements generate correctly from booking data and are legally
   signed off (OQ-4 resolved) before this feature is marked done — if legal review
   is not complete by Sprint 6, this item slips rather than ships unreviewed.

## 4. Dependencies, Risks, Open Questions

- **OQ-4 (legal review)** is the critical path for FR-C4 and FR-C5. Start Bangladeshi
  counsel engagement at the start of this phase (ideally during Phase 2), not at
  Sprint 6 — a late answer here is the single likeliest cause of this phase slipping
  past 16 weeks.
- **R-5 (payment disputes/chargebacks)** — pay-at-property widens real cash-risk
  exposure (BRD constraint: cash cannot be escrowed); FR-B4/B5 eligibility and
  no-show rules are the only control, so tune thresholds conservatively at launch
  and adjust from real no-show data, not guesswork.
- **R-8 (fake urgency badges erode trust)** — Superhost and loyalty badges must
  only ever reflect real computed data; do not allow manual admin override of a
  badge status outside the audit-logged rules engine.
- **BO-6 (retention)** — this phase is where the 25% repeat-tenant / 70% owner
  MAU targets should start moving; instrument retention metrics from Sprint 1 so
  there's a baseline before loyalty/reviews ship.

## 5. What Explicitly Does Not Start Yet

PWA install + web push polish, SEO landing-page engine (FR-S12), tourist/hotel
inventory (FR-C6, C8), partner services marketplace (FR-C9), other-city expansion
— all deferred to Phase 4. Transport ticketing is Phase 5 and has no dependency
on this phase.
