# CBS Stays Bangladesh — Phase 3: Differentiators — Screens & Field Specification

Field-level companion to `CBS_Stays_Phase3_Differentiators_Plan.md` and
`CBS_Stays_Phase3_TechnicalDevPlan.md`. All pages here extend existing Phase 2
routes (reviews attach to a property page, loyalty to an account page, etc.) —
listed as standalone entries for clarity.

---

## P3-01 — Pay-at-Property Token Checkout (extends P2-05)

**Src:** FR-B2, FR-B4, FR-B5

Already scoped in Phase 2's P2-06 eligibility check. Phase 3 completes the flow:

| Field | Type | Notes |
|---|---|---|
| Token percentage | Read-only, admin-configured (e.g. 15%) | |
| Token amount | ৳, computed from first period's rent | |
| Payment method for token | bKash / Nagad / Rocket | full payment methods not offered here — token is wallet-only |
| Acknowledgement checkbox | "I understand the balance is paid in cash or wallet at check-in" | Y, required |

**On success:** booking status → `confirmed_with_token`; **owner-side guarantee panel** (new, real-time):
| Field | Notes |
|---|---|
| Tenant name + verified badge | |
| Token amount received | ৳, timestamp |
| Balance due at check-in | ৳ |
| Guarantee status | "Secured" badge, updates live via websocket the instant the token clears |

**No-show admin view (FR-B5):** `/admin/no-shows` — table: tenant name, incident count (visual: 2 dots, filled = hit), booking reference, resulting status (Flagged / Suspended), `Suspend privilege` / `Restore privilege` manual override buttons, with the automatic rule stated inline: *"2 no-shows within a rolling 6 months auto-suspends Pay-at-Property; full online payment remains available."*

---

## P3-02 — Reviews (write + display)

**Route (write):** `/bookings/:id/review` · **Route (display):** extends P2-03 · **Src:** FR-T4

**Write form (only reachable from a booking with `status='completed'` — no route exists for any other state):**
| Field | Type | Req |
|---|---|---|
| Cleanliness | 1–5 star | Y |
| Accuracy | 1–5 star | Y |
| Location | 1–5 star | Y |
| Owner behaviour | 1–5 star | Y |
| Written review | Textarea, 20–1000 chars | Y |
| Photos (optional) | Multi-upload, up to 6 | N |

**Submit** → review enters moderation queue (banned-word filter, FR-T6) → published on approval. **No edit button is ever shown to the review's author after submission** (FR-T4 — "no edits by owners" extends to the reviewer too, by product convention: corrections go through a removal request to admin, not a self-edit).

**Display (on P2-03):** average of the 4 sub-ratings shown as one headline score + individual bars, review list (reviewer name+avatar, date, star row, text, photos), **Owner reply** (single reply per review, owner-only, shown indented under the review, no further threading), `Report this review` link (FR-T6).

**Superhost computation (FR-T3), shown as a badge, not a separate page:** nightly batch job computes `rating_avg`, `response_rate`, `cancellation_rate` → `is_superhost` boolean. No admin UI control sets this flag manually.

---

## P3-03 — CBS Club Loyalty

**Route:** `/account/loyalty` · **Src:** FR-T9, FR-T10

Three tier cards (Member / Plus / VIP), each showing: tier name, unlock requirement (1 stay / 2 stays / 5 stays or 6-month tenancy), benefit list, and — for the tenant's current tier — a "You are here" marker plus progress toward the next tier ("3 more stays to unlock VIP").

**Admin — Loyalty Rules (`/admin/loyalty`, FR-T10):**
| Field | Type |
|---|---|
| Tier | Select (Member/Plus/VIP) |
| Discount % on partner-service platform fee | Number |
| Cost cap (৳, max discount value per booking) | Number |
| Benefit description text | Textarea (shown to members) |

---

## P3-04 — Roommate / Mess Matcher

**Route (profile setup):** `/account/roommate-profile` · **Route (matches):** `/account/roommate-matches` · **Src:** FR-C3

**Profile form:**
| Field | Type | Req |
|---|---|---|
| Opt in to matching | Toggle | Y |
| Monthly budget | ৳ range | Y |
| Gender | Select | Y |
| Dietary preference | Select: No restriction / Halal only / Vegetarian / Vegan | Y |
| Schedule | Select: Day shift / Night shift / Student hours / Flexible | N |
| Preferred area | Autocomplete (same vocabulary as search) | Y |
| University/workplace (optional, improves matching) | Text | N |

**Matches list:** match card per candidate — avatar+name, match-score badge (%), key-overlap chips (budget, gender, diet, area), `Message` button (opens masked chat).

---

## P3-05 — Digital Rental Agreement

**Route:** `/bookings/:id/agreement` · **Src:** FR-C4, FR-C5 (legal-gated — OQ-4)

**Document view (prefilled, read-only fields pulled from the booking):** Owner name, Tenant name, Property address, Term (start date + duration in months), Monthly rent, Security deposit, Service charge, Stamp-paper requirement line (৳ amount, "attached on final sign").

**Signature panel:**
| Element | Notes |
|---|---|
| Owner signature status | "Awaiting" / "✓ Signed — `<name>`, `<timestamp>`" |
| Tenant signature status | same pattern |
| `Sign as owner` / `Sign as tenant` | opens a signature-capture pad (draw or type-and-style), writes a hash + IP + timestamp on confirm |
| `Download signed copy` | enabled only once both parties have signed |

**Police registration export (FR-C5, admin-only):** `/admin/police-export/:bookingId` — generates and lets an admin download the same booking data formatted per the applicable local tenant-information form, with a visible note: *"Applicability confirmed per jurisdiction — OQ-4."*

---

## P3-06 — Notification Preferences & Live Feed

**Route:** `/account/notifications` (user-facing) · `/admin/notifications` (matrix admin view) · **Src:** Section 11 (notification matrix), FR-T9 indirectly

**User-facing preferences:** a toggle grid — rows = event type (Booking confirmed, Payment received, Payout sent, Review request, Listing expiry, Verification result, New message, Marketing digests), columns = channel (SMS, Email, Push, WhatsApp). Marketing-type rows carry a mandatory "unsubscribe" affordance per BRD's consent requirement — these rows cannot be force-enabled by the platform.

**Admin matrix view:** same grid shape but describing the platform's *default* per-event channel configuration (what fires by default for new users), separate from each individual user's personal overrides above.

**Live feed (demo/ops view):** chronological list of recently dispatched notifications — channel icon, recipient (masked), event type, message preview, timestamp, delivery status (Sent/Failed).

---

## P3-07 — Admin: Platform Reporting Dashboard

**Route:** `/admin/reports` · **Src:** Section 11 reporting & analytics

Stat tiles: Daily active users, Total listings, Enquiries, Bookings, Visit→enquiry conversion %, Enquiry→booking conversion %, GMV, Revenue, Cancellation rate, Dispute rate. Breakdown tables: Top areas, Top property types. `Export CSV` (owner/finance exports) and a monthly-statement generator.

---

## Cross-cutting notes for Phase 3

- Every write-path gated by a precondition (review requires `completed` booking, agreement e-sign requires a 30+ day tenancy, no-show suspension is automatic) is enforced server-side; the UI never shows an action it will then reject — buttons that can't currently be used are either hidden or explicitly disabled with the reason stated inline (e.g. "Available once your stay is marked complete").
- Loyalty, Superhost, and urgency badges are all read-only displays of server-computed values — no admin screen anywhere in Phase 3 lets a human directly set a trust badge, per the BRD's R-8 risk note (fake urgency badges erode trust).
