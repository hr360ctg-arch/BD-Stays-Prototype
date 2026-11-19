# CBS Stays Bangladesh — Phase 4: Scale — Technical Development Plan

Companion to `CBS_Stays_Phase4_Scale_Plan.md`. Builds on
`CBS_Stays_Phase3_TechnicalDevPlan.md`'s full transactional core.

## 1. New Infrastructure This Phase

| Addition | Why |
|---|---|
| Server-side rendering / static generation for SEO pages (Next.js ISR) | FR-S12 — crawlable area+type landing pages |
| Sitemap generator job (nightly, writes `sitemap.xml`) | FR-S12 |
| Service worker + web push (VAPID keys, push subscription storage) | PWA install/push scope |
| Multi-currency display layer (FX rate cache, display-only — settlement stays in BDT) | FR-C6 NRB cards |
| Seasonal pricing engine (date-range price overrides on `units`) | FR-C8 hotel inventory |
| Partner-service booking adapter | FR-C9 |
| Multi-city config (per-city delivery zones, tax/commission overrides if any) | city expansion |
| Load-testing harness (k6 or similar) against NFR-6 | |

## 2. Frontend Component & State Plan

This phase is the one place the Next.js App Router's SSR/ISR matters directly
(every earlier phase's screens are fine as client-rendered RTK-Query-driven
pages behind auth): the SEO landing pages (`/[division]/[area]/[type]`) must
be statically generated or ISR'd, not client-fetched, or they're invisible to
crawlers — these routes read directly from a server-side data loader, not from
an RTK Query hook, since RTK Query's cache is a client concept.

New organisms: `SeoLandingHero` + `SeoListingGrid` (SSR'd), `InstallPromptSheet`
(the bottom-sheet component from the Phase 4 prototype, driven by the browser's
`beforeinstallprompt` event captured in a small client-only hook, not Redux —
this is transient browser state, not app state), `PushPreferenceRow`,
`CurrencyToggle`, `SeasonalPriceBadge`, `PartnerServiceCard`, `CityStatusCard`,
`KpiScorecardTable`.

New RTK Query slices: `partnerServicesApi`, `citiesApi`, `kpiApi`. The push
subscription write (`POST /push/subscribe`) is a one-off mutation, not
something that needs cache invalidation elsewhere, so it doesn't need its own
slice — add it to the existing `notificationsApi` from Phase 3.

## 3. Data Model (Phase 4 tables/additions)

```
seo_pages
  id, url_path, locale, h1, meta_description, json_ld,
  area, listing_type, generated_at, indexed (bool)

push_subscriptions
  user_id, endpoint, keys_json, created_at

nrb_profiles
  user_id, home_country, preferred_currency, trusted_host_required (bool)

tourist_inventory (extends units)
  unit_id, destination ('coxs_bazar'|'sylhet'|'sundarbans'), room_type

seasonal_price_overrides
  id, unit_id, date_range, price_bdt, reason ('peak'|'weekend'|'event')

guest_registration_records
  id, booking_id, guest_name, nid_or_passport_encrypted, captured_at
  -- hospitality guest-registration rules, local requirement per destination

partner_services
  id, category ('movers'|'cleaning'|'furniture'|'internet'|'repair'),
  provider_name, commission_pct, active (bool)

partner_bookings
  id, user_id, partner_service_id, linked_booking_id (nullable),
  status, amount_bdt, commission_bdt

cities
  id, name, division, launch_status ('planned'|'onboarding'|'active'),
  field_agent_lead_user_id

city_delivery_zones (extends Phase 2's delivery-zone concept per city)
  id, city_id, polygon_geojson, base_fee_bdt, per_km_fee_bdt, min_order_bdt
```

## 4. API Surface (Phase 4 additions)

| Method & Path | Purpose |
|---|---|
| `GET /seo/sitemap.xml` | generated, cached |
| (SSR pages, not API) `/[division]/[area]/[type]` | FR-S12 landing pages |
| `POST /push/subscribe`, `POST /push/unsubscribe` | web push |
| `GET /search/properties?currency=USD` (display-only conversion) | FR-C6 |
| `GET /tourist/inventory?destination=` | FR-C8 |
| `POST /partner-services/:id/book` | FR-C9 |
| `GET /admin/cities`, `PATCH /admin/cities/:id/launch-status` | city expansion ops |
| `GET /admin/kpi-scorecard` | Section 2 KPI rollup, backed by the Phase 3 materialized views |

## 5. Sprint-Level Engineering Tasks (maps to the 8×2-week plan)

**Sprint 1** — `seo_pages` generation job (one row per area×type combination
that has ≥N live listings, to avoid thin/empty pages hurting SEO); Next.js
ISR routes consuming it; JSON-LD output matching the schema.org `Apartment`
type (as prototyped); sitemap job.

**Sprint 2** — service worker registration, offline shell caching (cache the
app shell + last-viewed search results, not transactional data); install
prompt handling (`beforeinstallprompt`); `push_subscriptions` + VAPID setup.

**Sprint 3** — `nrb_profiles`; FX rate cache (daily pull from a rate API,
display-only, BDT remains the settlement currency so this never touches the
payment-aggregator integration); card payment path tested specifically against
foreign-issued cards through the chosen aggregator.

**Sprint 4 (gated on OQ-8)** — **confirm OQ-8 before starting**: if the tourist/
hotel vertical is deferred, redirect this sprint's capacity to Sprint 7 (city
expansion) instead. If confirmed: `tourist_inventory`, `seasonal_price_overrides`,
and `guest_registration_records` tables; seasonal pricing resolved into the
existing booking price-breakdown logic from Phase 2 (extend, don't fork, the
pricing calculator).

**Sprint 5** — continuation of hotel booking UI on the existing unit-selection/
inventory-dependency engine (a hotel room is a `unit` with `kind='room'` and a
`tourist_inventory` row — no new booking engine); field-agent onboarding tooling
reused from Phase 2 for Cox's Bazar/Sylhet properties.

**Sprint 6** — `partner_services` + `partner_bookings`; checkout-flow extension
point so a partner service can attach to an existing booking or stand alone;
commission calculation reusing the Phase 2/3 commission engine.

**Sprint 7** — `cities` + `city_delivery_zones`; config-driven city launch
(adding a city should be a data/config change, not a code deploy); replicate the
Phase 1 field-agent verification workflow and Phase 2 cold-start playbook per
new city.

**Sprint 8** — `admin/kpi-scorecard` endpoint and dashboard, reading from the
Phase 3 materialized views plus new Phase 4 metrics; full NFR-6 load test
(100k monthly users / 5,000 concurrent sessions, via k6) against staging sized
to match production; remediate the worst bottleneck found before declaring the
phase (and the 12-month program) complete; native-app go/no-go decision recorded
as a checkpoint, not a build task.

## 6. Testing Priorities

1. SEO pages must 200 and contain the expected JSON-LD for a sample of
   area×type combinations — automated crawl check in CI.
2. Offline shell: airplane-mode test confirms the app shell still renders and
   shows a clear "you're offline" state for anything requiring live data.
3. Foreign-card payment: at least one real test transaction with a non-BD-issued
   test card through the aggregator's sandbox.
4. Load test: capture p95 latency under the NFR-6 target load and compare
   against NFR-1's 2-second search budget — a scale test that breaks the
   latency budget is a finding, not a pass.

## 7. Program Close-Out

At the end of Sprint 8, the `admin/kpi-scorecard` output is the source of truth
for whether each BO-1–BO-9 target (Section 2 of the BRD) was met. Any KPI short
of target gets a scoped follow-up item — the technical plan ends here, but the
product plan's "What Remains Open" section (native app, further cities,
jobs/services/shops categories) is the backlog for whatever comes after.
