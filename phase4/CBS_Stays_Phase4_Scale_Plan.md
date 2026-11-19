# CBS Stays Bangladesh — Phase 4: Scale — Implementation Plan

Source: CBS_Stays_Bangladesh_BRD.pdf, Section 12 (Release plan, Phase 4)
Timing: Months 8–12 (≈16 weeks, starts after Phase 3 exit criteria met)
Covers requirements: FR-S12, FR-C6, FR-C8, FR-C9
Exit criteria (from BRD): Section 2 (Business Objectives) targets met

## 1. Objective

By the start of this phase, CBS Stays is a working, trusted, Dhaka-proven product
with a mature food vertical. Phase 4 is about reach and ceiling: organic discovery
(SEO), the NRB/tourist segment, adjacent revenue (partner services), and
geographic expansion beyond Dhaka — while holding every Section 2 KPI (BO-1
through BO-9) to its 12-month target.

## 2. Sprint Plan (eight 2-week sprints)

### Sprint 1 (Weeks 1–2) — SEO Foundation
**FR-S12:** SEO landing pages per area + type (e.g. "Bachelor flats in Mirpur"),
structured data (schema.org), sitemaps, canonical URLs. Audit existing listing/
search pages for crawlability and Core Web Vitals (ties to NFR-1 performance
budget already enforced since Phase 2).

### Sprint 2 (Weeks 3–4) — PWA Install & Push Maturity
Full "installable PWA" polish referenced in Phase 4 scope line: add-to-home-
screen prompts, offline shell caching for low-connectivity users (ties to the
Assumption that most users are on variable mobile data), web push opt-in flows
beyond the transactional notifications already shipped in Phase 1–3.

### Sprint 3 (Weeks 5–6) — NRB & Visitor Stays
**FR-C6:** furnished short-stay filter, foreign-currency price display for card
payments, trusted-host badge, optional Hazrat Shahjalal Airport pickup booking,
family-friendly care contact channel. Coordinate with Marketing on NRB-targeted
acquisition (this segment pays in advance by card — validate the payment flow
specifically for non-BD-issued cards via the licensed aggregator).

### Sprint 4 (Weeks 7–8) — Tourist/Hotel Inventory, Part 1
**FR-C8 (gated by OQ-8):** hotel/resort/guest-house inventory model with room
types and seasonal pricing for Cox's Bazar, Sylhet, Sundarbans. Guest-registration
data capture per local hospitality rules. **Do not start this sprint until OQ-8 (is
tourist/hotel vertical in year one?) is confirmed** — this is a "Could" priority item
in the BRD and the largest net-new inventory model in this phase; if OQ-8 comes
back "later," reallocate this sprint to Sprint 5/6 work early instead.

### Sprint 5 (Weeks 9–10) — Tourist/Hotel Inventory, Part 2
Continuation: seasonal pricing engine, multi-room hotel booking reusing the
FR-H2/H3 unit-selection and inventory-dependency logic from Phase 2 (hotel
rooms are a new unit type on the same engine, not a new system). Field-agent
onboarding push for Cox's Bazar/Sylhet properties (reuse Phase 2's R-3 cold-start
playbook for the new cities).

### Sprint 6 (Weeks 11–12) — Partner Services Marketplace
**FR-C9:** movers, cleaners, furniture rental, internet providers, home repair —
bookable at checkout. Scope as a thin marketplace layer (partner listings +
referral/commission booking) reusing existing owner-listing and payment
infrastructure rather than building a second marketplace engine.

### Sprint 7 (Weeks 13–14) — Other-City Expansion
Roll the proven Dhaka playbook (field-agent onboarding, verification, launch
checklist from Phase 1–2) to Chattogram, Sylhet, Khulna, Rajshahi per the BRD's
stated city sequence. Validate area/thana data coverage, delivery-zone config
(FR-F18) and localized content for each new city before opening search there.

### Sprint 8 (Weeks 15–16) — KPI Hardening & Program Close-Out
Full pass against every Section 2 KPI (BO-1–BO-9): verified-listing count, visit-to-
enquiry/enquiry-to-booking conversion, wallet-payment share, NID-verification
rate, revenue break-even status, retention rates, scam-report rate, backup/
uptime record, food-order volume and on-time rate. Remediate any KPI short of
target with a scoped follow-up rather than letting the phase close open-ended.
Native iOS/Android app decision revisited here per BRD's stated "reconsidered
after Phase 4 based on usage" — make this a decision checkpoint, not a build item.

## 3. Acceptance / Exit Criteria

All Section 2 targets met at the 12-month mark, specifically:

| KPI | Target |
|---|---|
| BO-1 Active verified listings (Dhaka first) | 5,000 |
| BO-2 Visit-to-enquiry / enquiry-to-booking | 8% / 12% |
| BO-3 Bookings paid via wallet/card/token | 70% |
| BO-4 Owners NID-verified / listings with 5+ photos | 90% / 90% |
| BO-5 Revenue (commission, featured, subscriptions) | Monthly break-even by month 12 |
| BO-6 Repeat tenants/guests / owner MAU | 25% / 70% |
| BO-7 Scam reports per 1,000 listings | Below 5 |
| BO-8 Backup success rate / uptime | 100% of days / 99.5% |
| BO-9 Active restaurants / orders per month / on-time rate | 300 / 30,000 / 85% |

Plus feature-level checks: SEO pages indexable and ranking for at least a sample
of target area+type queries; an NRB user can complete a card payment in a
foreign-issued card; (if OQ-8 confirmed) a tourist can book seasonal hotel
inventory in Cox's Bazar end-to-end; at least one partner service is bookable at
checkout; at least one additional city beyond Dhaka has live, verified listings.

## 4. Dependencies, Risks, Open Questions

- **OQ-8** gates Sprints 4–5 entirely — resolve before this phase starts, not mid-phase,
  so the 16-week budget isn't spent waiting.
- **OQ-7** (launch city list, budget, team size, target date) directly determines how
  many cities Sprint 7 can realistically cover — confirm scope before committing a
  city list to stakeholders.
- **NFR-6 (scalability: 100k monthly users, 5,000 concurrent)** should be load-tested
  explicitly in this phase, since multi-city + tourist + partner-services traffic is the
  first time the platform sees combined load anywhere near this ceiling.
- **R-10 (delivery economics)** — city expansion must repeat the "2–3 dense areas
  first" discipline from Phase 2 in each new city, not launch city-wide delivery on
  day one.
- If any BO target in Section 3's table is materially short at Sprint 8, treat it as a
  scope item for a Phase 5 (not yet defined in the BRD) rather than silently
  declaring the program complete.

## 5. What Remains Open Beyond This Plan

Native app reconsideration (post-Phase-4 usage-based decision), any further city
expansion beyond the five BRD-named divisions, and jobs/services/shops
categories on the same engine (mentioned in BRD Section 1 as a future
possibility, explicitly not scoped into Phases 1–4).
