# CBS Stays Bangladesh — Phase 3: Differentiators — Technical Development Plan

Companion to `CBS_Stays_Phase3_Differentiators_Plan.md`. Builds on
`CBS_Stays_Phase2_TechnicalDevPlan.md`'s booking/payment core.

## 1. New Infrastructure This Phase

| Addition | Why |
|---|---|
| E-signature capability (self-hosted, e.g. a signing-pad + hash/audit trail — or a licensed e-sign API if counsel requires one under OQ-4) | FR-C4 |
| PDF generation (Puppeteer or a template engine) | rental agreement documents |
| Notification preference engine (per-user, per-channel) | Section 11 matrix, now fully wired to real triggers |
| Scheduled jobs: loyalty tier recompute, no-show rolling-window check | FR-T9, FR-B5 |

## 2. Frontend Component & State Plan

New organisms this phase, built from shadcn atoms per the Phase 1/2 pattern:
`PayAtPropertyEligibilityCard`, `TokenDepositGuaranteePanel` (the owner-facing
real-time view — subscribe via Socket.io, not polling, since it needs to flip
the moment a tenant's token clears), `ReviewCard` + `ReviewForm` (the form only
renders when `useGetBookingQuery` reports `status: 'completed'` — don't just
hide it with CSS, don't mount it at all, so there's no client-side path that
can submit a review for an incomplete stay even via devtools), `LoyaltyTierCard`
(the three gradient tier cards from the Phase 3 prototype), `RoommateMatchCard`,
`AgreementDocument` + `SignaturePad`, `NotificationMatrixGrid`,
`NoShowIncidentCard`.

New RTK Query slices: `loyaltyApi`, `reviewsApi`, `agreementsApi`,
`notificationsApi`. The `TokenDepositGuaranteePanel`'s live update is the one
place this phase needs something beyond RTK Query's normal fetch/cache cycle —
wire a Socket.io event to call `dispatch(bookingsApi.util.invalidateTags([{type:'Booking', id}]))`
on `token_deposit.received`, so the existing query cache stays the single
source of truth instead of growing a parallel websocket-driven state tree.

## 3. Data Model (Phase 3 tables)

```
pay_at_property_eligibility
  tenant_id, nid_verified (bool), phone_verified (bool),
  no_show_count_6mo, eligible (bool), max_token_amount_bdt

token_deposits
  id, booking_id, amount_bdt, method, status ('held'|'forfeited'|'applied'),
  no_show_at (nullable)

no_show_incidents
  id, tenant_id, booking_id, recorded_at, resulted_in_suspension (bool)

reviews
  id, booking_id, author_id, cleanliness, accuracy, location, owner_behaviour,
  text, owner_reply, created_at         -- booking_id FK enforces "completed stay only"

superhost_snapshots
  owner_id, computed_at, rating_avg, response_rate, cancellation_rate, is_superhost

loyalty_accounts
  user_id, completed_stays, tenancy_months, tier ('none'|'member'|'plus'|'vip'),
  tier_achieved_at

loyalty_discount_rules
  tier, discount_pct, cost_cap_bdt, applies_to ('partner_services')

roommate_profiles
  user_id, budget_bdt, gender, diet, schedule_json, area_preference, opt_in (bool)

roommate_matches
  user_id, matched_user_id, score, computed_at

rental_agreements
  id, booking_id, owner_id, tenant_id, term_months, monthly_rent_bdt,
  deposit_bdt, stamp_requirement_bdt, status ('draft'|'awaiting_signatures'|'signed'),
  pdf_url

agreement_signatures
  agreement_id, signer_role ('owner'|'tenant'), signed_at, signature_hash, ip

police_registration_exports
  id, booking_id, generated_at, exported_by_user_id, file_url

notification_preferences
  user_id, channel ('sms'|'email'|'push'|'whatsapp'), event_type, enabled (bool)

notification_log
  id, user_id, channel, event_type, payload_json, sent_at, status
```

## 4. API Surface (Phase 3 additions)

| Method & Path | Purpose |
|---|---|
| `GET /bookings/:id/pap-eligibility` | FR-B4 |
| `POST /bookings/:id/token-deposit` | FR-B2 |
| `POST /admin/no-shows` (recorded by field agent/owner report) | FR-B5, drives `no_show_incidents` |
| `PATCH /admin/tenants/:id/pap-suspend` / `.../pap-restore` | admin override of the auto-suspension |
| `POST /reviews` (requires `booking.status = 'completed'`) | FR-T4 |
| `GET /owners/:id/superhost-status` | FR-T3 |
| `GET /loyalty/me` | FR-T9 |
| `POST /roommate/profile`, `GET /roommate/matches` | FR-C3 |
| `POST /agreements` (from booking), `POST /agreements/:id/sign` | FR-C4 |
| `POST /admin/police-export/:bookingId` | FR-C5 |
| `GET /notifications/preferences`, `PATCH /notifications/preferences` | Section 11 |

## 5. Sprint-Level Engineering Tasks (maps to the 8×2-week plan)

**Sprint 1** — `pay_at_property_eligibility` table + the rules engine (admin-
configurable thresholds, not hardcoded).

**Sprint 2** — token deposit flow end-to-end; `no_show_incidents` +
scheduled job that recomputes `eligible` on a rolling 6-month window and flips
`pay_at_property_eligibility.eligible` automatically — instrument this from day
one since it's the metric the phase's 30% exit target depends on.

**Sprint 3** — `reviews` table with the FK-enforced "completed stay only" rule;
`superhost_snapshots` computed by a nightly job from real rating/response/
cancellation data — never allow a manual override of `is_superhost` outside this
job, per the product plan's R-8 mitigation (fake badges erode trust).

**Sprint 4** — `loyalty_accounts` + tier-recompute job triggered on booking
completion; `loyalty_discount_rules` admin CRUD; apply discount server-side at
partner-service checkout (never trust a client-supplied discount amount).

**Sprint 5** — `roommate_profiles` + a first-pass matching job (rules-based
scoring on budget/gender/diet/schedule overlap — explicitly not ML, per the
product plan's sprint-budget note).

**Sprint 6 (legal-gated)** — `rental_agreements` + PDF generation from booking
data + e-signature capture. **Do not begin this sprint's build until OQ-4 legal
review has specified the required agreement format and stamp-paper handling** —
build a legal-review checkpoint into the sprint plan itself, not just a note.

**Sprint 7** — `police_registration_exports` (gated on the same OQ-4 answer);
`notification_preferences` + `notification_log`; wire every existing event
(booking confirmed, payment received, payout sent, review request, listing
expiry, verification result) through the preference engine instead of hardcoded
sends.

**Sprint 8** — platform reporting dashboard queries (daily users, listings,
bookings, GMV, cancellation/dispute rates) as materialized views refreshed
nightly, not live aggregate queries on the transactional tables; full regression
suite across Phase 2 + Phase 3; validate the 30% token/pay-at-property metric
against real `token_deposits` data before sign-off.

## 6. Testing Priorities

1. No-show auto-suspension: a test tenant with 2 incidents in the window must
   have `eligible = false` without any manual admin action.
2. Review gating: an attempt to POST a review for a non-completed booking must
   be rejected at the API layer, not just hidden in the UI.
3. Agreement signature integrity: a signed PDF's hash must be verifiable against
   `agreement_signatures.signature_hash` — this is the artifact that would matter
   in an actual dispute.
4. Discount calculation: server-computed only; a client sending a manipulated
   discount percentage must be ignored.

## 7. Exit Gate Into Phase 4

Legal sign-off on the rental agreement format (OQ-4) must be recorded before
Phase 4 work on tourist/hotel inventory begins, since Phase 4's hotel bookings
reuse the same agreement and booking infrastructure — an unresolved legal
question here compounds into Phase 4's scope.
