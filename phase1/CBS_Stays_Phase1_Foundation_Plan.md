# CBS Stays Bangladesh — Phase 1: Foundation — Implementation Plan

Source: CBS_Stays_Bangladesh_BRD.pdf, Section 12 (Release plan, Phase 1)
Timing: Weeks 1–6
Covers requirements: FR-A1–FR-A7, FR-H9, FR-T7, FR-T8
Exit criteria (from BRD): restore test passed; no placeholder pages

## 1. Objective

Stand up the shared platform foundation that the stays marketplace will run on,
before any listing or booking feature is built. Nothing in Phase 2 can start safely
until this phase's exit criteria are met.

## 2. Scope (in this phase)

| Requirement | Description |
|---|---|
| FR-A1 | Role-based admin console (super admin, moderator, field agent, support, finance) with mandatory 2FA |
| FR-A2 | Audit log of every admin action (who, what, when, before/after) |
| FR-A6 | Automated daily database and file backups to off-server storage, monthly restore test, failure alerts |
| FR-A7 | Real content, branding, legal pages (terms, privacy, refund policy), contact page; no placeholder or broken links |
| FR-H9 | Soft delete with trash and restore for owners and admins; no hard delete in the UI |
| FR-T7 | Anti-fraud base: rate limiting, OTP and bot protection, duplicate detection hooks, blacklist capability |
| FR-T8 | Phone and email verified flags can be set only after real OTP or link confirmation |
| — | Auth with OTP (mentioned in release plan scope line, underpins FR-T8) |
| — | CMS for legal/content pages (underpins FR-A7) |
| — | Bangla/English i18n scaffolding (underpins NFR-7, used by every later phase) |

Out of scope for Phase 1 (deferred to Phase 2+): listings, search, booking, payments,
reviews, loyalty, notifications content (the notification *pipe* may be stubbed, but
no booking triggers exist yet).

## 3. Weekly Breakdown

### Week 1 — Environment and Identity
- Repo, CI/CD pipeline, staging + production environments, secrets management (NFR-3, NFR-9)
- Hosting decision confirmed against OQ-6 (data localization) before provisioning
- User/account data model: single identity shared across all roles (owner, tenant/guest, admin, and later transport operator)
- Auth: mobile OTP sign-up/login, session management, password-less by default

### Week 2 — Verification Primitives (FR-T8, feeds FR-T7)
- OTP delivery via SMS gateway (BTRC-compliant sender ID/masking)
- Email verification link flow
- `phone_verified` / `email_verified` flags — settable *only* by the OTP/link confirmation service, never by direct admin edit or self-report
- Rate limiting and basic bot protection (captcha or equivalent) on OTP requests and login

### Week 3 — Admin Console Core (FR-A1)
- Role-based access control: super admin, moderator, field agent, support, finance
- Mandatory 2FA for all admin roles
- Admin user management screens (create/suspend/role-assign)

### Week 4 — Audit Log and Soft Delete (FR-A2, FR-H9)
- Audit log service: every admin action records who / what / when / before-after diff
- Soft-delete framework applied platform-wide (not listing-specific yet, but the mechanism): trash state, restore action, no hard-delete path exposed in any UI
- Anti-fraud scaffolding (FR-T7): duplicate-account detection by phone/device fingerprint, blacklist table and enforcement hook (rules will be populated once listings/bookings exist in Phase 2)

### Week 5 — Backups and Resilience (FR-A6)
- Automated daily database + file backups to off-server storage
- Backup failure alerting (paged to on-call/admin)
- First scheduled restore-test run against a staging copy
- RPO 24h / RTO 4h targets (NFR-2) validated against the restore procedure

### Week 6 — Content, CMS, and Exit Validation (FR-A7)
- CMS for legal/static pages: Terms, Privacy Policy, Refund Policy, Contact page
- Real branding and copy in Bangla and English — no Lorem Ipsum, no placeholder links, no "coming soon" dead pages
- Link-check and placeholder sweep across the whole shell (nav, footer, auth screens, admin console)
- Second restore-test run (to satisfy "monthly restore test" as a repeatable, not one-off, process)
- Phase 1 sign-off against exit criteria

## 4. Acceptance / Exit Criteria

Phase 1 is done only when all of the following hold:

1. A simulated full data-loss is recovered from backup within RTO (4h), with no data older than RPO (24h) lost — restore test passed and documented.
2. Every page reachable from the shell (nav, footer, auth, admin, legal) renders real content; zero placeholder text or broken links.
3. Admin login requires 2FA for every role; an audit log entry exists for a test admin action showing who/what/when/before-after.
4. A test record can be soft-deleted and restored by both an owner-level and admin-level account; no UI path performs a hard delete.
5. `phone_verified`/`email_verified` cannot be set true except through a real OTP/link confirmation — verified by attempting to set it directly and having it rejected.
6. OTP requests are rate-limited and blocked after a defined threshold (manual abuse test).

## 5. Dependencies and Risks Carried From BRD

- **R-9 (Data loss/breach)** — directly mitigated by this phase's backup, 2FA, audit log work; do not relax these to hit the 6-week timeline.
- **R-6 (Regulatory uncertainty)** — OQ-6 (data localization/hosting) should be resolved *before* Week 1 provisioning, or hosting may need to move later at cost.
- **OQ-2** (reuse of existing CBS auth/admin/audit-log modules) should be answered before Week 1; it changes whether Weeks 1–4 are new builds or integration work.

## 6. What Explicitly Does Not Start Yet

No listing, search, booking, payment, review, or loyalty work begins in this phase.
Phase 2 (Core Listing MVP) depends on this phase's auth, admin, audit-log,
soft-delete, and CMS foundation being signed off first.
