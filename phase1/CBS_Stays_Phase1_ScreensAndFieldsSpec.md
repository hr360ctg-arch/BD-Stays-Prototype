# CBS Stays Bangladesh — Phase 1: Foundation — Screens & Field Specification

Every page, every field, every state for Phase 1 (Foundation). This is the
field-level companion to `CBS_Stays_Phase1_Foundation_Plan.md` (scope) and
`CBS_Stays_Phase1_TechnicalDevPlan.md` (architecture) — detailed enough to build
real forms and real tables against, not just a mock screen.

Legend: **Type** = input control. **Req** = required. **Src** = BRD source (FR-ID).

---

## P1-01 — Phone Login

**Route:** `/login` · **Access:** public · **Src:** FR-T8, FR-A1

| Field | Type | Req | Validation / Notes |
|---|---|---|---|
| Country code | Fixed display | — | `+880`, not editable |
| Phone number | Text (numeric) | Y | 10 digits, starts with `1`; inline error if malformed |
| Language toggle | Segmented control (বাং / EN) | — | Persists via cookie/localStorage; default বাং |

**Buttons:** `Send code` (primary, disabled until phone is valid) · link `Need help? Call support` (opens P1-15 contact info, FR-C10).

**States:** idle → validating → error (`"Enter a valid 10-digit number"`) → sent (navigates to P1-02).

**Non-field elements:** small print disclosure: *"We'll never share your number. Standard SMS rates may apply."*

---

## P1-02 — OTP Verification

**Route:** `/login/otp` · **Src:** FR-T8

| Field | Type | Req | Notes |
|---|---|---|---|
| OTP digit 1–4 | 4× single-digit numeric input, auto-advance | Y | Auto-submits on 4th digit |
| Masked phone display | Read-only text | — | e.g. `+880 1•••••678` |
| Countdown timer | Read-only, mm:ss | — | 120s; `Resend code` enabled only at 0:00 |

**Buttons:** `Verify` · `Resend code` (disabled during countdown) · `← Change number` (back to P1-01).

**Error states:** wrong code (`"Incorrect code. 2 attempts left."`), expired code, too many attempts (locks resend for 10 min — ties to FR-T7 rate limiting).

**On success:** if the phone belongs to an account with an admin role → P1-03 (2FA). Otherwise → the relevant app home (out of Phase 1 scope — stubbed).

---

## P1-03 — Admin 2FA Challenge

**Route:** `/login/2fa` · **Src:** FR-A1 (mandatory 2FA for every admin role)

| Field | Type | Req | Notes |
|---|---|---|---|
| 6-digit authenticator code | Single text input, numeric | Y | From TOTP app (Google Authenticator / Authy) |
| "Trust this device for 30 days" | Checkbox | N | Skips 2FA on this browser for 30 days (still requires OTP login) |

**Buttons:** `Verify & continue` · `Use a backup code instead` (reveals a second input for one of 10 pre-generated backup codes) · `Lost access? Contact super admin`.

**First-time admin flow (2FA enrollment, shown once per admin account):**
| Field | Type | Notes |
|---|---|---|
| QR code | Image | Scan into authenticator app |
| Manual setup key | Read-only text + copy button | Fallback if QR can't be scanned |
| Confirm code | Text input | Must match a valid TOTP before enrollment completes |
| Backup codes (10×) | Read-only list + "Download .txt" + "I've saved these" checkbox | Must be acknowledged before proceeding |

---

## P1-04 — Admin Dashboard (home)

**Route:** `/admin` · **Access:** any admin role · **Src:** FR-A1, FR-A6, FR-H9

**Stat tiles (4):**
| Tile | Value source | Sub-line |
|---|---|---|
| Last backup | `backup_runs` latest `completed_at` | status + "off-server" |
| Uptime (30d) | monitoring feed | vs. 99.5% NFR-2 target |
| Pending verifications | count of `owners`/`users` with `verification_status='pending'` | split: N owners, N admins |
| Last restore test | `restore_tests` latest | pass/fail + RTO duration |

**Phase exit-criteria checklist (4 rows, read-only progress indicators):** restore test passed / no placeholder content / 2FA enforced / soft-delete verified — each with a Done/In-review badge.

**Recent admin activity feed:** last 5 `audit_log` rows (actor, action, relative time, before→after diff), with "View audit log →" link to P1-07.

**Sidebar nav (persists across all P1 pages):** Dashboard · Admin Users & Roles (P1-05) · Verification Queue (P1-06) · Audit Log (P1-07) · Trash / Soft Delete (P1-08) · Backups (P1-09) · CMS & Legal Pages (P1-10). Footer: account switcher + logout.

---

## P1-05 — Admin Users & Roles

**Route:** `/admin/users` · **Access:** `super_admin` (write), others (read) · **Src:** FR-A1

**Table columns:** Avatar+Name · Role (badge) · Phone (masked) · 2FA status (On/Off badge) · Account status (Active/Suspended/Pending-2FA) · Last login (relative) · Row action: `Edit`.

**Toolbar:** Search by name/phone · Filter by role (multiselect: Super Admin, Moderator, Field Agent, Support, Finance) · Filter by status · `+ Invite admin` button.

**P1-05a — Invite Admin (modal/drawer):**
| Field | Type | Req |
|---|---|---|
| Full name | Text | Y |
| Phone number | Text | Y |
| Email (optional) | Text | N |
| Role | Select (single) | Y |
| Scope (for Field Agent/Moderator) | Multiselect: areas/cities | N — populated from Phase 2+ |

**P1-05b — Edit Admin User (drawer):** all invite fields (editable) + `Suspend account` / `Reactivate` toggle + `Force 2FA re-enrollment` action + `Reset password` (N/A — OTP-only, so this becomes `Revoke active sessions`) + read-only "Member since" + "Audit history for this user" link (filters P1-07).

---

## P1-06 — Verification Queue

**Route:** `/admin/verification` · **Src:** FR-T1, FR-T2, FR-T8, FR-A3, FR-A5

**Table columns:** Applicant name · Type (Owner-authority-doc / Tenant-NID / Tenant-passport) · Document thumbnail(s) · Submitted (timestamp) · Status (Pending/In review/Approved/Rejected) · Row actions: `Approve` / `Reject` / `View`.

**Filter/toolbar:** Status tabs (All / Pending / In review / Approved / Rejected) · Type filter · Search by name or phone.

**P1-06a — Verification Detail (drawer/modal), fields shown:**
| Field | Source | Notes |
|---|---|---|
| Applicant name, phone (masked), registered since | `users` | |
| Document type | NID / Passport / Trade licence / Utility bill / Deed copy / Manager authorization | per FR-T1/T2 |
| Document image(s) | zoomable viewer, front+back for NID | encrypted at rest (NFR-3) |
| NID/passport number (OCR-extracted, editable) | text field | admin can correct OCR errors |
| Proof-of-authority type (owners only) | select | Holding number / Utility bill / Deed copy / Manager authorization letter |
| Field-agent visit requested? | checkbox + "Assign agent" select | FR-A5 |
| Internal note (admin-only) | textarea | not visible to applicant |
| Decision | radio: Approve / Reject | Reject requires a reason (select + free text) |
| Rejection reason options | select | "Blurry document", "Mismatched name", "Expired ID", "Suspected fraud", "Other" |

**On Approve:** sets `verification_status='approved'`, timestamps `verified_at`, writes an `audit_log` row, triggers a notification (stubbed in Phase 1, wired in Phase 3).
**On Reject:** status → `rejected`, applicant can resubmit; reason stored and shown to the applicant.

---

## P1-07 — Audit Log

**Route:** `/admin/audit-log` · **Src:** FR-A2

**Table/feed columns:** Actor (name + role) · Action icon + description · Entity type/ID (clickable to jump to that record) · Timestamp (absolute, hover for relative) · Before/after diff (expandable, monospace key:value).

**Filters:** Date range picker · Actor (select, searchable) · Action type (multiselect: login, approve-verification, reject-verification, soft-delete, restore, role-change, backup-run, restore-test, cms-edit, etc.) · Entity type filter.

**Toolbar:** `Export CSV` (admin + finance roles only, per FR-A3/reporting exports) · "Showing N of M events" pagination.

**Non-negotiable property:** no UI control anywhere on this page edits or deletes a log row — append-only, enforced server-side.

---

## P1-08 — Trash / Soft Delete

**Route:** `/admin/trash` · **Src:** FR-H9, FR-A4

**Table columns:** Item name/title · Entity type (Listing / Admin account / Mess seat / CMS page / Review — expands as later phases add entity types) · Deleted by (name + role) · Deleted on (timestamp) · Auto-purge date (deleted_on + 30 days) · Row action: `Restore`.

**Toolbar:** Entity-type filter · Search · Bulk-select checkboxes + `Restore selected` (FR-A4: bulk actions are soft-delete/restore only, with a confirmation step — "Restore 4 items?" dialog before committing).

**Empty state:** "Nothing in trash" illustration + one line explaining soft delete.

**Explicitly absent:** no `Delete permanently` button anywhere in this UI, by design (FR-H9).

---

## P1-09 — Backups & Restore

**Route:** `/admin/backups` · **Access:** `super_admin`, `finance` · **Src:** FR-A6, NFR-2

**Schedule panel (read-only + 2 action buttons):**
| Row | Fields shown |
|---|---|
| Database backup | frequency (daily 02:00 BST), status badge (Active) |
| File storage backup | frequency (daily 02:20 BST), status badge |
| Off-server replication | target region, status badge |
| Monthly restore test | next scheduled date, status badge |

**Buttons:** `Run backup now` · `Run restore test` (opens confirmation modal: *"This restores the latest backup into an isolated staging copy... ~12 minutes"* → `Start restore test` / `Cancel`).

**Targets panel:** 3 progress bars against NFR-2 — RPO ≤24h, RTO ≤4h, Uptime ≥99.5% — each showing current measured value vs. target.

**Backup history table:** Date/time · Type (Database/File storage) · Size · Duration · Status (OK/Slow/Failed badge). Sortable, paginated.

**Failure alert banner** (conditional, only renders if the latest run failed): red banner with "Backup failed at 02:00 — retry now" action.

---

## P1-10 — CMS & Legal Pages

**Route:** `/admin/cms` · **Src:** FR-A7, FR-A3

**List view columns:** Page title · Slug/URL · Locale (বাং/EN — each language is a separate row/version) · Status (Published/Draft) · Last updated · Row action: `Edit`.

**Seed pages required at launch (FR-A7 — "no placeholder pages"):** Terms of Service, Privacy Policy, Refund & Cancellation Policy, Contact Us, About CBS Stays — each in both বাং and EN.

**P1-10a — CMS Page Editor:**
| Field | Type | Notes |
|---|---|---|
| Title | Text | Y |
| Slug | Text (auto-generated from title, editable) | Y, must be unique per locale |
| Locale | Select বাং/EN | Y |
| Body | Rich text editor (headings, lists, links, bold/italic) | Y — link-checker runs on save, blocks publish if a broken internal link is found |
| SEO meta description | Text, 160 char counter | N |
| Status | Draft / Published toggle | |

**Buttons:** `Save draft` · `Publish` · `Preview` (opens the rendered page in a new context) · `View revision history` (lists prior versions with diff, restore-to-version action).

---

## Cross-cutting elements present on every Phase 1 admin page

- **Topbar:** page title + breadcrumb, `Phase 1` badge, `Staging`/`Production` environment pill, language toggle (বাং/EN), hamburger menu on mobile (<620px).
- **Sidebar footer:** logged-in admin's avatar, name, role, `Log out` icon button.
- **Toast notifications:** bottom-right, auto-dismiss 2.8s, used for every successful mutation (approve, restore, backup run, etc.).
- **Empty states:** every table/list has a designed empty state (icon + one sentence), never a blank white area.
- **Responsive rule:** sidebar collapses to an off-canvas drawer below 620px width; all tables scroll horizontally inside their own container rather than the page.
