# CBS Stays Bangladesh — Phase 2: Core Listing MVP — Screens & Field Specification

Field-level companion to `CBS_Stays_Phase2_CoreMVP_Plan.md` and
`CBS_Stays_Phase2_TechnicalDevPlan.md`. Covers the **Stays** marketplace
(public search through booking). Builds on the Phase 1 admin shell — new
admin screens here extend `/admin`.

---

## P2-01 — Search & Map (home)

**Route:** `/search` · **Access:** public · **Src:** FR-S1–S9, FR-S13

**Top search bar:**
| Field | Type | Notes |
|---|---|---|
| Location | Autocomplete text | Division → District → Thana → Area (e.g. "Mirpur-10"); Banglish-tolerant (FR-S9) |
| Check-in / Check-out dates | Date range picker | hidden/disabled for monthly-rent stay types |
| Guests | Stepper (adults) | |
| Stay type | Select | Short stay / Monthly rent / Room / Flat / Mess seat / Sublet |

**Filter bar (chips + a "More filters" drawer):**
| Filter | Control | Src |
|---|---|---|
| Tenant type | Chip group: Any / Family only / Bachelor (M) / Bachelor (F) / Student | FR-S5 |
| Price range | Dual slider + min/max number inputs, per night or per month toggle | FR-S4 |
| Bedrooms / Bathrooms | Stepper each | FR-S4 |
| Furnished | Toggle (Any/Furnished/Unfurnished) | FR-S4 |
| Amenities | Checkbox group: Lift, Generator/IPS, Gas supply, Water, Parking, Wi-Fi, Security guard/CCTV | FR-S4 |
| Booking options | Checkbox group: Instant booking, Free cancellation, Pay at property | FR-S4 |
| Proximity | Checkbox + distance slider per: Metro station, Bus stop, University, Hospital, Mosque, Market, Office zone | FR-S6 |
| Sort | Select: Relevance, Price (low-high/high-low), Rating, Distance, Newest | FR-S9 |

**Listing card (repeated in list + as map pin popup):** photo carousel (swipeable) · title · area/neighbourhood · tenant-type badge · price (৳, per-night or per-month) · star rating + review count · conversion badges (Free cancellation until `<date>`, Pay at property, "Only 1 room left", "Booked N times this week" — FR-S7, data-driven only) · `♡` favourite icon (FR-S10) · location score badge with hover tooltip showing the formula (FR-S8).

**Map panel:** interactive map, ৳ price pins, bounding-box refresh on pan/zoom (FR-S2), cluster pins when zoomed out, map/list toggle on mobile (<760px stacks instead of split-screen).

**Secondary actions:** `Save this search` (prompts: alert via SMS or email — FR-S9) · `Share search results` link.

**Empty state:** "No listings match these filters" + `Clear filters` + 2–3 nearby/relaxed suggestions.

---

## P2-02 — SEO Area Landing Page

**Route:** `/[division]/[area]/[type]` e.g. `/dhaka/mirpur/bachelor-flats` · **Src:** FR-S12 (built out fully in Phase 4; stubbed here as a thin wrapper around P2-01 with a canonical URL, H1, and meta description so the URL pattern exists from Phase 2 onward)

---

## P2-03 — Property Detail

**Route:** `/properties/:id` · **Src:** FR-S11, FR-H2, FR-H3, FR-C1, FR-C7, FR-T3, FR-S10

**Gallery:** photo grid (hero + thumbnail strip), full-screen lightbox, optional video/360 tour embed if present, photo count badge.

**Header block:** title · area (exact address hidden — "Dhanmondi 27, Dhaka · exact address shown after booking") · tenant-type badge · Verified Owner / Verified Property / Superhost badges (FR-T3, wiring completed Phase 3) · star rating + review count · `♡ Save` · `Share` (WhatsApp/Messenger link, FR-S10).

**Unit selection table (the FR-H2/H3 centerpiece):**
| Column | Notes |
|---|---|
| Thumbnail | per-unit photo |
| Unit name | e.g. "Room A", "Master Bedroom with attached bath", "Whole Flat" |
| Capacity | guest icon + count |
| Bed/seat count | |
| Features | icon row: attached bath, balcony, AC, etc. |
| Privacy | "Private room" / "Shared room" / "Entire place" |
| Nightly price | ৳, shown only if the unit supports short stay |
| Monthly price | ৳ |
| Select | button — disabled + "Unavailable (blocked by another selection)" styling when `unit.blockedBy` is set |

**Below the table:**
- **Amenities** — full checklist as declared by the owner (mirrors FR-S4's filter vocabulary: lift, generator/IPS, gas, water, parking, Wi-Fi, CCTV, plus free-text "other amenities").
- **House rules** — tenant-type declaration (Family/Bachelor M/F/Student/Any, FR-C1), smoking policy, pets policy, quiet hours, guest policy, meals-included flag (for mess units, FR-C2).
- **Utilities clarity block (FR-C7):** Electricity (Prepaid meter / Postpaid meter), Gas (Piped / Cylinder / None), Water (24h / Scheduled), Internet (Included / Not included / Owner can arrange), Service charge (৳ amount, what it covers).
- **Map** — static map with approximate pin (exact pin after booking).
- **Availability calendar** — read-only month view, available/booked/blocked days colour-coded (full owner-side calendar is P2-11).
- **Cancellation terms** — policy name (Flexible/Moderate/Strict) + plain-language explanation, shown here *and again* before payment (FR-B6).
- **Reviews section** — list of verified reviews (full write/display spec in Phase 3's doc; Phase 2 ships read-only display only).
- **Owner profile card** — name, photo, "Member since", response rate, response time, verified badges, `Message owner` button (opens masked chat, FR-T5).
- **Safety info block (FR-T11):** owner/caretaker contact (masked until booking), nearest police station + hospital names, "999" emergency number, `Report a problem` link.

**Sticky booking widget (desktop sidebar / mobile bottom sheet):** selected unit summary, date picker, guest stepper, price preview, `Continue to booking` button (disabled until a unit is selected).

---

## P2-04 — Booking Flow (multi-step)

**Route:** `/book/:unitId` · **Src:** FR-B1, FR-B6, FR-B7, FR-C1

**Step 1 — Dates & guests:** check-in/out (or move-in date + lease length for monthly), guest count (validated against unit capacity), special request textarea (optional).

**Step 2 — Your details:** full name, phone (prefilled from account), NID number (if not already verified), tenant-type self-declaration (must match the listing's allowed type or the flow blocks with *"This listing is Family only — your profile is declared Bachelor"*, enforcing FR-C1 at the UI layer in addition to the API).

**Step 3 — Price breakdown (FR-B1):**
| Line | Example |
|---|---|
| Rent (nightly × nights, or monthly) | ৳ 9,000 |
| Security deposit | ৳ 24,000 (2 months) |
| Service charge | ৳ 800 |
| Platform fee | ৳ 450 |
| VAT (15% on platform fee) | ৳ 68 |
| **Total due now** | ৳ 34,318 |

Cancellation policy re-shown here (FR-B6), with full terms expandable, **before** the payment step — not after.

**Step 4 — Booking mode (FR-B7):** if the unit is Instant Booking, proceeds straight to payment. If Request to Book, shows *"The owner will respond within 24 hours. This request expires automatically if there's no reply."* with a `Send request` button instead of `Pay`.

**Step 5 — Confirmation / Pending:** Instant → proceeds to P2-05 (payment). Request-to-book → a pending-request status screen with a countdown to the 24h auto-expiry, and the booking appears in the tenant's "My bookings" list as *Pending owner response*.

---

## P2-05 — Payment & Arrival Pass

**Route:** `/book/:bookingId/pay` · **Src:** FR-B2, FR-B3, FR-T5, FR-B8

**Payment method picker:**
| Option | Fields shown when selected |
|---|---|
| bKash (full, held) | redirect/PIN flow via aggregator widget |
| Nagad (full, held) | same |
| Rocket / Upay | same |
| Card (Visa/Mastercard/Amex/DBBL Nexus) | card number, expiry, CVC, cardholder name (never stored — tokenized via aggregator, NFR-3 PCI-DSS SAQ-A) |
| Internet banking | bank select + redirect |
| Pay at Property (token) | token % shown (e.g. "15% — ৳3,300 now"), eligibility check runs first (see P2-06) |

Each option shows: "Released to the owner 24h after check-in unless a dispute is raised" (full payment) or "Balance due in cash or wallet at check-in" (token).

**On successful payment/token:** Digital Arrival Pass card renders in place —
Address (with map pin), Caretaker/guard contact (now unmasked, FR-T5), Gate/lock
instructions, Wi-Fi network+password, Owner phone (unmasked). Explicitly: this
card does not render at all until payment/token clears (FR-B8) — not
greyed-out, not present-but-blurred, simply absent from the DOM.

**Failure state:** payment failed → retry button + "try a different method" + booking held in `pending_payment` for 15 minutes before auto-releasing the unit hold.

---

## P2-06 — Pay-at-Property Eligibility (inline component, not a separate page)

Shown inside P2-05 when the tenant selects the token option. **Src:** FR-B4.

| Check | Display |
|---|---|
| NID/phone verified | ✓ / ✗ with "Verify now" link if failing |
| Owner allows Pay at Property for this listing | ✓ / ✗ — if ✗, option is hidden entirely, not shown-disabled |
| Tenant's no-show history | ✓ Clean / ⚠ flagged (admin-configured threshold) |
| Maximum token amount allowed | ৳ figure, admin-configured |

If any required check fails, the Pay-at-Property option does not appear as a choice at all on P2-05 — this avoids showing tenants an option they'll just be rejected from.

---

## P2-07 — My Bookings (tenant)

**Route:** `/account/bookings` · **Src:** FR-B9, FR-B13

**Tabs:** Upcoming / Pending requests / Past / Cancelled.

**Booking card fields:** property thumbnail+title, dates, status badge, total paid, `View arrival pass` (if confirmed), `Message owner`, `Cancel booking` (opens cancellation-policy-aware refund preview before confirming), `Report an issue` (opens P2-08 dispute form, only enabled within 24h of check-in per FR-B13), `Change dates/guests` (subject to availability, FR-B9).

---

## P2-08 — Dispute Report (tenant-facing form)

**Route:** `/bookings/:id/dispute` · **Src:** FR-B13

| Field | Type | Req |
|---|---|---|
| Issue category | Select: Property not as described / Safety concern / Owner unresponsive / Cleanliness / Other | Y |
| Description | Textarea | Y |
| Photo evidence | Multi-file upload (up to 5) | N |

**On submit:** booking's payout moves to `held_pending_resolution`; tenant sees "We've received your report — the owner's payout is on hold while we review" and a reference number.

---

## P2-09 — Owner Onboarding Wizard

**Route:** `/owner/properties/new` · **Src:** FR-H1, FR-H7 (full field list — this is the most field-dense page in the product)

**Step 1 — Property type:** radio cards: Whole flat / Individual room(s) / Mess (shared rooms with seats) / Tourist/guest-house unit (Phase 4).

**Step 2 — Address:**
| Field | Type | Req |
|---|---|---|
| Division | Select | Y |
| District | Select (dependent) | Y |
| Thana | Select (dependent) | Y |
| Area/neighbourhood | Autocomplete text | Y |
| Building name / holding number | Text | Y |
| Floor | Text/number | N |
| Exact address | Textarea | Y — flagged "hidden from public listing until a booking is confirmed" |
| Map pin | Drag-to-place map picker | Y |

**Step 3 — Photos (FR-H7):** drag-drop multi-upload, minimum-5-for-live / minimum-1-for-draft counter shown live, per-photo: reorder (drag), set as cover, delete, auto-resize/compress/watermark run on upload (background), moderation-flag indicator once CBS review completes.

**Step 4 — Amenities & rules:**
- Amenities checklist (same vocabulary as the search filters — lift, generator/IPS, gas, water, parking, Wi-Fi, CCTV, security guard, plus a free-text "other").
- Utilities clarity fields (FR-C7): electricity meter type, gas source, water schedule, internet arrangement, service charge amount + description.
- House rules: tenant type (Family/Bachelor M/F/Student/Any — FR-C1), smoking allowed?, pets allowed?, meals included (mess units, FR-C2), quiet hours, max guests, additional free-text rules.

**Step 5 — Units (the multi-room setup, FR-H2/H3):** repeatable unit-row builder:
| Field | Type |
|---|---|
| Unit name | Text (e.g. "Room A") |
| Unit kind | Select: Whole flat / Room / Seat |
| Capacity | Stepper |
| Bed/seat count | Stepper |
| Attached bath? | Toggle |
| Photos for this unit | Multi-upload (subset of property photos or unit-specific) |
| Nightly price | ৳ number, N if monthly-only |
| Monthly price | ৳ number |
| Seasonal/weekend price override | Repeatable date-range + price rows (FR-H5) |
| Long-stay discount | Percent, with a "for stays over N nights/months" threshold (FR-H5) |
| Gender restriction (seats) | Select: Male/Female/Any |
| Meals included (seats) | Toggle |

Inventory-dependency relationships (whole-flat ↔ its rooms/seats) are computed automatically from the units entered in this step — no separate manual step, since every room/seat added here is implicitly understood to be "inside" the one whole-flat unit if both exist on the same property.

**Step 6 — Pricing & booking mode:**
| Field | Type |
|---|---|
| Advance/security deposit | ৳ amount or "N months" |
| Deposit shown separately at checkout | (always true, informational) |
| Booking mode | per-unit: Instant Booking / Request to Book (FR-H6) |
| Cancellation policy | per-unit: Flexible / Moderate / Strict (extra 10% discount auto-applied if Strict, FR-B6) |
| Commission acknowledgement | read-only display of the platform's current commission rate |

**Step 7 — Review & submit:** full read-only summary of every prior step, `Request agent assistance` (phone-assisted onboarding, FR-H1) always available as an escape hatch, `Submit for review` → listing enters `Pending review` (FR-H8), owner sees a status chip on their dashboard.

---

## P2-10 — Owner Dashboard

**Route:** `/owner` · **Src:** FR-H10, FR-H11, FR-H12, FR-H13

**Stat tiles:** Active listings · New enquiries (unread count) · Upcoming bookings · This month's earnings · Response rate.

**Tabs/sections:**
- **Properties** — list with status chip (Draft/Pending review/Live/Paused/Rented/Rejected/Expired), `Edit`, `Pause`/`Resume`, `Mark as rented` (FR-H11, prompts if a listing is stale), `Delete` (soft, FR-H9), `Boost this listing` (FR-H12, opens pricing for featured placement).
- **Enquiries/Requests** — inbox-style list, masked-chat thread view, `Accept`/`Decline` for Request-to-Book items.
- **Calendar** — per-property view aggregating all units (detail calendar is P2-11).
- **Earnings & Payouts** — table of completed bookings, payout schedule, `Request payout` if applicable, downloadable statement.
- **Reviews** — list of received reviews with `Reply` (Phase 3 full build).
- **Team** (FR-H13, if the owner is on a manager/agent plan) — invite team members, assign per-building permissions.
- **Subscription/Boost** (FR-H12) — current plan, upgrade options for managers with many units.

---

## P2-11 — Availability Calendar (per unit) + iCal

**Route:** `/owner/units/:id/calendar` · **Src:** FR-H4

Month-grid calendar, click-to-toggle a date as Owner-blocked, colour legend (Available/Booked/Owner-blocked), `Import .ics` (file picker) and `Export .ics link` (copyable webcal:// URL) buttons.

---

## P2-12 — Admin: Listings Management (extends Phase 1's admin console)

**Route:** `/admin/listings` · **Src:** FR-A3, FR-H8, FR-T6

Table: thumbnail+title · owner name · area · status (with the full FR-H8 state set as filterable tabs) · submitted date · reported flag (if any) · row actions: `Approve`, `Reject` (reason required), `Pause`, `View`, `Soft delete`.

Listing review detail mirrors P2-03's fields plus an admin-only moderation panel: banned-word-filter hits (highlighted in the text), duplicate-listing/duplicate-photo flags (FR-T7), `Approve for publication` (required before any listing goes Live, FR-H8).

---

## P2-13 — Admin: Bookings, Disputes & Reconciliation

**Route:** `/admin/bookings` · **Src:** FR-B13, FR-B14, FR-A3

- **Bookings table:** booking ID, tenant, property/unit, dates, status, amount, payment method.
- **Disputes sub-view:** list of `pending`/`in_review`/`resolved` disputes (from P2-08 submissions) with full tenant-submitted detail, `Resolve in tenant's favour (refund)` / `Resolve in owner's favour (release payout)` / `Request more info` actions.
- **Reconciliation sub-view:** stat tiles (Settled today, Flagged mismatches, Aggregator name), table of transaction ID ↔ booking ↔ aggregator amount ↔ platform amount ↔ match status.

---

## Cross-cutting notes for Phase 2

- Every price anywhere in the product is shown in ৳ with thousands separators and, per FR-S13, Bangla numerals are an optional display toggle, not a separate data type.
- Every page under 1MB initial load, images lazy-loaded (NFR-1) — verified per-page in CI, not just asserted here.
- The tenant-type enforcement (FR-C1) appears in three independent places: the listing card badge (P2-01), the unit table (P2-03), and a hard block in the booking flow (P2-04 step 2) — all three read from the same `tenant_type` field, never three separate copies of the rule.
