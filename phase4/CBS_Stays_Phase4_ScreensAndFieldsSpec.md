# CBS Stays Bangladesh — Phase 4: Scale — Screens & Field Specification

Field-level companion to `CBS_Stays_Phase4_Scale_Plan.md` and
`CBS_Stays_Phase4_TechnicalDevPlan.md`.

---

## P4-01 — SEO Landing Pages

**Route:** `/[division]/[area]/[type]` (promoted from Phase 2's P2-02 stub to a
fully server-rendered page) · **Src:** FR-S12

Server-rendered (not client-fetched): H1 ("Bachelor flats in Mirpur"), intro
paragraph (area description, generated from template + live stats — "42
verified listings currently available"), the same listing grid as P2-01 scoped
to this area+type, JSON-LD structured data per listing (schema.org `Apartment`
— name, address, numberOfRooms, priceRange, aggregateRating), canonical URL
tag, and internal links to sibling pages ("Family flats in Mirpur", "Bachelor
flats in Dhanmondi"). `sitemap.xml` is generated nightly from the set of
area×type combinations with ≥N live listings (thin/empty pages are excluded,
not published).

**Admin — SEO Page Manager:** `/admin/seo-pages` — table of generated pages
(URL, area, type, listing count, indexed status), manual `Regenerate now`
action, and an `Exclude this combination` toggle for pages CBS doesn't want
published yet.

---

## P4-02 — NRB & Visitor Stay Filter

**Route:** extends `/search` (P2-01) with an NRB mode toggle · **Src:** FR-C6

**Additional fields when NRB mode is on:**
| Field | Type |
|---|---|
| Home country | Select |
| Preferred display currency | Select (USD/GBP/CAD/AED, BDT always the settlement currency underneath) |
| Furnished only | Toggle (defaults on) |
| Trusted-host only | Toggle |
| Airport pickup requested | Toggle (Hazrat Shahjalal International Airport) |
| Family-friendly care contact needed | Toggle |

Listing cards in this mode show price in both BDT and the selected display
currency (display-only conversion, FX cache refreshed daily), plus a
"Trusted Host" badge where applicable.

---

## P4-03 — Tourist Stays (Hotel/Resort/Guest-house Inventory)

**Route:** `/stays/tourist` and `/properties/:id` (hotel units reuse the Phase
2 unit-selection table — a hotel room is simply a `unit` with `kind='room'`
plus tourist-specific fields) · **Src:** FR-C8 (gated by OQ-8)

**Additional owner-onboarding fields (extends P2-09 Step 5, shown only when
property type = Tourist/guest-house):**
| Field | Type |
|---|---|
| Destination | Select: Cox's Bazar / Sylhet / Sundarbans / Other |
| Room type | Select: Standard / Deluxe / Suite / Cottage |
| Seasonal price overrides | Repeatable date-range + price rows, reason tag (Peak/Weekend/Event) |
| Guest registration requirement | Toggle, per local hospitality rule |

**Guest registration capture (at booking, when the above toggle is on):** full
guest name + NID/passport number per guest staying, captured during the P2-04
booking flow as an extra step for tourist-destination bookings only.

**Destination landing cards:** `/stays/tourist` shows one card per destination
(Cox's Bazar, Sylhet, Sundarbans) with a representative photo, "From ৳X/night",
and a filtered link into search scoped to that destination.

---

## P4-04 — Partner Services Marketplace

**Route:** `/services` (browse) and a checkout-attach option inside P2-04/P2-16
· **Src:** FR-C9

**Browse grid:** category cards (Movers, Cleaning, Furniture rental, Internet
providers, Home repair), each showing provider name, commission-inclusive
price range, rating.

**Booking form (per service):**
| Field | Type |
|---|---|
| Service category | pre-selected from the card clicked |
| Date/time needed | Date+time picker |
| Attach to an existing booking? | Toggle + booking picker (prefills the address) |
| Address (if not attached) | Text + map pin |
| Notes | Textarea |

**Admin — Partner Services Manager:** `/admin/partner-services` — table of
providers (category, name, commission %, active toggle), `+ Add provider`
form with the same fields.

---

## P4-05 — City Expansion Console (admin)

**Route:** `/admin/cities` · **Src:** city-expansion scope, R-3 cold-start playbook reuse

| Column | Notes |
|---|---|
| City name | Chattogram, Sylhet, Khulna, Rajshahi, ... |
| Launch status | Planned / Onboarding / Active |
| Verified listings | live count |
| Field-agent lead | assigned admin/agent |

**City detail drawer:** `Change launch status`, field-agent onboarding
checklist (reused from Phase 1/2's verification workflow, scoped per city).

---

## P4-06 — PWA Install & Push Preferences

**Route:** in-app component, not a dedicated URL · **Src:** PWA/push scope

**Install prompt (bottom sheet, triggered by the browser's
`beforeinstallprompt` event):** app icon, "Install CBS Stays?", "Works offline
· add to home screen", `Not now` / `Install` buttons.

**Offline shell status (settings page, `/account/settings`):** read-only
indicator — "Shell cached · 2.1 MB" with a progress bar, explaining what stays
viewable offline (app shell, saved searches, recent bookings) vs. what
requires a connection (live search, payment).

**Push preferences:** extends P3-06's notification-preferences grid with a
`Push` column already present; Phase 4 adds the browser-permission request
flow itself (native browser prompt, triggered by a first explicit toggle, not
on page load).

---

## P4-07 — KPI Scorecard (admin/leadership)

**Route:** `/admin/kpi-scorecard` · **Src:** Section 2 (BO-1–BO-9)

Table: KPI name, target, current value, status badge (On target / Behind),
sourced from nightly materialized views (not live transactional queries).
Rows cover every BO-1 through BO-9 metric defined in the BRD: active verified
listings, visit→enquiry / enquiry→booking rates, % bookings via
wallet/card/token, owner NID-verification rate, listings-with-5+-photos rate,
monthly break-even status, repeat-tenant rate, owner MAU rate, scam-reports-
per-1000-listings, backup-success rate, uptime.

---

## Cross-cutting notes for Phase 4

- SEO pages are the one surface in the entire product that is server-rendered
  rather than client-fetched — stated explicitly so it isn't accidentally
  built as just another client route during implementation.
- NRB currency display is presentation-only: every actual charge, hold, and
  payout anywhere in the system remains BDT; no new settlement currency is
  introduced by this phase.
- Tourist-hotel bookings are explicitly *not* a new booking engine — they run
  through the same P2-04 booking flow, P2-03 unit table, and FR-H3 inventory-
  dependency logic as any other property, with only the destination/room-type/
  seasonal-pricing/guest-registration fields layered on top.
