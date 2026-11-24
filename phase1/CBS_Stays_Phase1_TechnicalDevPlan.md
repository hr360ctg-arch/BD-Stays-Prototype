# CBS Stays Bangladesh — Phase 1: Foundation — Technical Development Plan

Companion to `CBS_Stays_Phase1_Foundation_Plan.md` (product/scope plan). This document
covers the engineering side: stack, data model, API surface, and sprint-level build
tasks. Read the product plan first for *why*; this is *how*.

## 1. Stack Decision (applies to all four phases)

OQ-2 in the BRD (reuse existing CBS modules vs. build new) is still open. This plan
assumes a **new build** on the team's chosen stack — swap the OQ-2 assumption out
once it's answered, but the architecture below stands regardless.

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + TypeScript, Express, **modular architecture** (one folder per domain module — `auth`, `admin`, `listings`, `bookings`, and later `ticketing` in Phase 5 — each with its own `routes/controller/service/repository`) | Keeps each vertical genuinely separable without a heavier framework than the project needs |
| ORM | **Prisma** | Type-safe queries end-to-end with TypeScript, migrations as code, `prisma.$transaction` for the booking exclusion logic, soft-delete enforced via Prisma middleware (`$use`) rather than per-query discipline |
| Database | PostgreSQL 15+ | Relational integrity needed for inventory-dependency logic (FR-H3), financial ledgers, audit log |
| API style | REST + JSON, OpenAPI-documented | Matches NFR-9 (documented APIs) |
| Cache / sessions / queues | Redis (sessions, rate limiting) + BullMQ (background jobs: SMS, backups, payout batches) | |
| Object storage | S3-compatible bucket (photos, ID documents, signed agreements), region per OQ-6 | Encrypted at rest for ID docs (NFR-3) |
| Frontend | **Next.js (App Router) + shadcn/ui**, installable PWA | Mobile-first, lazy-loaded images, Bangla/English i18n via next-intl |
| Frontend state/data | **Redux Toolkit + RTK Query** | RTK Query owns all server-state (listings, bookings, admin data) with cache tags for invalidation (e.g. booking a unit invalidates that property's unit-table query); plain Redux slices only for client-only UI state (wizard step, filters, modal open/close) |
| Frontend structure | **Atomic design** — `components/atoms` (shadcn primitives: Button, Input, Badge), `molecules` (FormField, StatCard, UnitRow), `organisms` (UnitSelectionTable, BookingSummaryCard, AdminSidebar), `templates` (DashboardLayout, AuthLayout), and route-level `app/` pages that compose templates + organisms | Keeps the component tree aligned with how the Phase 1–4 prototypes are already organized (shell → sections → cards/tables), and makes shadcn's unstyled primitives the actual atoms instead of ad-hoc one-off components |
| Realtime | Socket.io (admin live updates, seat-hold/booking updates in Phase 5 ticketing) | |
| Hosting | Containerized (Docker), deployed to a Bangladesh-or-nearby region (NFR-5) behind a CDN | Pending OQ-6 confirmation |
| CI/CD | GitHub Actions → staging → production, with the staging environment required by NFR-9 | |

**Backend module shape** (repeated per domain, e.g. `src/modules/listings/`):
```
listings/
  listings.routes.ts       -- Express router, thin — validates input, calls controller
  listings.controller.ts   -- request/response shaping only
  listings.service.ts      -- business logic (e.g. the FR-H3 dependency check)
  listings.repository.ts   -- Prisma calls live here, nowhere else
  listings.schema.ts       -- zod/class-validator input schemas
  listings.test.ts
```
No route handler calls `prisma` directly — every DB access goes through that
module's repository, so the soft-delete middleware and query patterns stay
centralized and auditable.

**Frontend feature shape** (mirrors the backend modules):
```
src/
  components/{atoms,molecules,organisms,templates}/
  features/{auth,admin,listings,bookings}/
    <feature>Api.ts        -- RTK Query endpoints (injected into one root apiSlice)
    <feature>Slice.ts       -- client-only UI state for that feature, if any
  app/                      -- Next.js App Router pages, composed from the above
```

## 2. Phase 1 Scope (from the product plan)

FR-A1–A7, FR-H9, FR-T7, FR-T8, plus auth/CMS/i18n scaffolding. Nothing listing- or
booking-related is built yet.

## 3. Data Model (Phase 1 tables)

```
users
  id, phone (unique), phone_verified_at, email, email_verified_at,
  password_hash (nullable — OTP-first), locale ('bn'|'en'), created_at,
  deleted_at (soft delete)

admin_roles
  id, name ('super_admin'|'moderator'|'field_agent'|'support'|'finance')

admin_user_roles
  user_id, role_id

two_factor_credentials
  user_id, secret_encrypted, enabled_at

otp_requests
  id, phone, code_hash, purpose ('login'|'verify'), expires_at,
  attempt_count, created_at         -- rate-limit source for FR-T7

audit_log
  id, actor_user_id, action, entity_type, entity_id,
  before_json, after_json, ip, created_at         -- append-only, no update/delete

soft_deletable_mixin (applied to every future table)
  deleted_at, deleted_by_user_id

backup_runs
  id, type ('db'|'files'), started_at, completed_at, size_bytes,
  status ('ok'|'failed'), storage_url

restore_tests
  id, backup_run_id, started_at, completed_at, status, rto_seconds, notes

cms_pages
  id, slug, locale, title, body_html, status ('draft'|'published'), updated_at

device_fingerprints / blacklist_entries
  -- scaffolding for FR-T7 anti-fraud; populated meaningfully from Phase 2 onward
```

`soft_deletable_mixin` is the pattern every later table follows (FR-H9): no table in
the schema ever gets a hard `DELETE`, enforced in a single **Prisma client
extension / `$use` middleware** that rewrites every `delete`/`deleteMany` call
into an `update` setting `deleted_at`, and every `findMany`/`findUnique` to
exclude soft-deleted rows by default — not by convention, and not something each
repository has to remember to do.

## 4. API Surface (Phase 1)

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /auth/otp/request` | public, rate-limited | FR-T8 — send OTP, enforces FR-T7 rate limiting |
| `POST /auth/otp/verify` | public | sets `phone_verified_at`, issues session |
| `POST /auth/2fa/verify` | session (admin roles only) | FR-A1 — mandatory second factor |
| `GET /admin/users` / `POST /admin/users` / `PATCH /admin/users/:id/role` | admin: super_admin | role management |
| `GET /admin/audit-log` | admin: any role (read), filtered by permission | FR-A2 |
| `POST /admin/trash/:entity/:id/restore` | admin or owning user | FR-H9 |
| `GET /admin/backups`, `POST /admin/backups/run`, `POST /admin/backups/:id/restore-test` | admin: super_admin, finance | FR-A6 |
| `GET /cms/:slug` | public | serves legal/content pages |
| `PUT /admin/cms/:slug` | admin: moderator+ | FR-A7 |

All admin-prefixed routes require a valid session **and** a completed 2FA challenge
in that session — enforce this as a single Express middleware mounted on the
`/admin` router prefix (`app.use('/admin', requireSession, require2fa, adminRouter)`),
not re-checked per-route, so no new admin route can accidentally ship without it.

## 5. Sprint-Level Engineering Tasks (maps to the 6-week product plan)

**Week 1** — repo scaffolding (Express + TS backend in the module shape above,
Next.js + shadcn + RTK Query frontend with the atomic folder structure in place
from day one so Phase 1's prototype screens map cleanly onto real `organisms`),
Docker Compose (Postgres+Redis), Prisma schema + first migration, CI pipeline,
staging environment, secrets manager wiring, `users` + `otp_requests` tables,
OTP send/verify endpoints with an SMS gateway stub (swap for the real
BTRC-compliant gateway before Phase 2 launch).

**Week 2** — rate limiter (Redis token bucket) in front of `/auth/otp/request`,
`phone_verified_at`/`email_verified_at` write-path locked to the OTP/email-link
confirmation service only (reject any other write path in the repository layer,
not just the controller — this is the exact bug class the Phase 1 prototype's
`setLang()` bug rhymed with: never let a second code path silently clobber a
value the first path is supposed to own).

**Week 3** — `admin_roles` / `admin_user_roles`, 2FA enrollment + verification
(TOTP, `otplib`), admin user management endpoints; on the frontend, promote the
Phase 1 prototype's login/dashboard/users screens from static mock data to real
RTK Query hooks (`useGetAdminUsersQuery`, etc.) against these endpoints — the
prototype's HTML/CSS becomes the spec for the shadcn-based `organisms`.

**Week 4** — `audit_log` table and a single Express middleware (mounted on the
`/admin` router, after the route handler via `res.on('finish', ...)` or an
explicit `logAdminAction()` call at the end of each mutating service method)
that writes an entry for every mutating admin request automatically (don't rely
on each handler to remember — one enforced choke point guarantees FR-A2
coverage); `/trash` and `/restore` endpoints built on the Prisma soft-delete
middleware from Week 1; device-fingerprint and blacklist table scaffolding for
FR-T7 (rules populated in Phase 2).

**Week 5** — backup job (BullMQ cron): nightly `pg_dump` + file-storage sync to
off-server storage; failure alerting (page on-call via the notification channel
chosen in Phase 3's matrix, or email in the interim); first scripted restore-test
run against an isolated staging DB, capturing `rto_seconds`.

**Week 6** — `cms_pages` table + endpoints, seed real Terms/Privacy/Refund/Contact
content in Bangla and English, link-check script run in CI (fails the build on any
broken internal link or lorem-ipsum marker), second restore-test run, Phase 1
exit-criteria checklist signed off against the product plan's acceptance list.

## 6. Non-Functional Build Tasks

- OWASP Top 10 baseline: helmet headers, input validation (zod schemas per
  module, as in the `listings.schema.ts` pattern above), parameterized queries
  only (Prisma's query builder — `$queryRaw` banned by lint rule except where
  explicitly reviewed), dependency audit in CI.
- Secrets: never in repo or `.env` committed; use the platform's secret manager.
- `NFR-2` (RPO 24h / RTO 4h): the Week 5 backup job and restore test are the
  literal implementation of this NFR — don't treat it as a later hardening pass.
- Staging environment (NFR-9) is stood up Week 1, not bolted on later — every
  subsequent phase's QA depends on it existing from day one.

## 7. Exit Gate Into Phase 2

Phase 2 development should not start against `main` until: OTP+2FA login works
end-to-end, the audit-log middleware is proven (a test mutation produces a
log row), a restore test has completed successfully at least twice, and CI is
green with the link-checker passing. This mirrors the product plan's exit
criteria — the technical gate is what makes that checklist true in code, not
just in a status report.
