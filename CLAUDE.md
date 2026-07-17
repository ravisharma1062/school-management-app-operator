# CLAUDE.md — operator

Internal, high-privilege React console for the School Management App's **platform team** (not schools) — a separate app from the school-facing `school-management-app-ui`, by design, since this is the surface that can touch every tenant. See `README.md` for local setup/run — this file is about how the code is organized and conventions worth knowing before changing it.

**Sibling repos** (same backend, different clients — not shared code, not in this repo): `school-management-app-backen` (the API), `school-management-app-ui` (tenant-facing web), `school-management-app-android` (tenant-facing mobile), `school-management-app-marketing` (public site). Backend DTOs are hand-mirrored here in `src/types/index.ts` with no shared schema/codegen.

**If you're editing `src/types/index.ts` because a backend DTO changed:** this repo owns most of the platform/subscription/billing DTOs (`SubscriptionDto`, `EntitlementDto`, `SchoolUsageDto`, `PlatformAnalyticsDto`, `AuditLogDto`, `SignupRequestDto`, `PlatformSettingsDto`, `PaymentClaimDto`, `PlatformPaymentDto`), but `web`'s Account page and Android's Account screen also consume the subset they display (subscription/entitlement/billing) — check the backend's `CLAUDE.md` "Cross-repo checklist" for which DTO needs which client.

## What it does

- Review and approve/reject inbound school signup requests, provisioning a school + subscription + entitlements + a single-use admin invite link in one action. (Self-service trial signups from `marketing` skip this queue entirely and provision immediately — they show up already-active in the Schools list, with a `TRIAL_SELF_PROVISIONED` audit entry.)
- View every school, change its lifecycle status (suspend/reactivate/cancel), change its plan (recomputes entitlements); School detail shows a **Usage** card (active students vs. plan limit, emails/SMS this month).
- Verify or reject manually-reported payments (Demand Draft / Cheque / NEFT) in a **Payments** queue — verifying extends the school's subscription period and reactivates it if suspended.
- Edit global platform **Settings**: `autoApproveSignups` toggle (skips the review queue for all new signups when on) and the payment-instructions text shown on every school's Billing page.
- View the audit log of every platform action, including a `"System (self-service)"` entry for actions with no human operator.
- View platform analytics: tenant counts by status/plan, aggregate totals (active students, emails/SMS sent this month across all schools).

Authenticates against the backend's separate `/api/v1/platform/**` surface — platform JWTs are not interchangeable with school-facing tokens (`JwtAuthFilter` rejects cross-surface use).

## Stack

React 18.3 + TypeScript 5.5, Vite 5.3, Tailwind 3.4, TanStack React Query 5.51, React Router DOM 6.24, axios 1.7, Vitest + React Testing Library for tests. **No i18n** (English-only internal tool, deliberately — the UI kit was copied from `web` and stripped of i18next). No Razorpay/Leaflet/osmdroid — irrelevant to an internal ops console.

## Folder structure (`src/`)

- `api/` — `platformAuth.ts`, `signupRequests.ts`, `schools.ts`, `subscriptions.ts`, `auditLogs.ts`, `analytics.ts`, `payments.ts`, `settings.ts`, plus `client.ts`/`tokenStorage.ts`.
- `components/ui/` — copied/trimmed from `web`'s kit: `Button`, `Card`, `Table`, `Badge`, `States`, `PageHeader`, `Pagination`, `Modal`, `Field`, plus `Textarea` (payment-instructions field).
- `components/layout/` — `AppShell`, `RequireAuth`.
- `context/PlatformAuthContext.tsx` — the sole global context (platform-user session, separate token pair from the tenant apps).
- `pages/` — `LoginPage` (+ MFA step), `SignupQueuePage`, `SchoolsPage`/`SchoolDetailPage`, `AuditLogPage`, `AnalyticsPage`, `PaymentsPage`, `SettingsPage`, `NotFoundPage`.
- `types/index.ts` — DTOs mirroring the backend's `platform`/`billing` package contracts.

## Auth flow

Same shape as `web`/Android but against `/platform/auth/*` instead of `/auth/*`: login (+ optional TOTP MFA — enforced only once a platform user has enrolled, so the seeded dev account isn't locked out), single-flight refresh-on-401, force logout. Entirely separate token pair/localStorage keys from any tenant app.

## Notable detail

`AuditLogPage` renders `log.actorEmail` as plain text with no null-handling — this is **correct**, not a gap: the backend's `PlatformAuditLogService` substitutes the literal string `"System (self-service)"` server-side whenever the actor is null, so `actorEmail` is never actually null on the wire. (A review pass once flagged this as a possible frontend bug; checked against the backend source and it was a false alarm — don't re-flag it without checking `PlatformAuditLogService.java` first.)

## Testing

Vitest + React Testing Library + jsdom (`vitest.config.ts`, `src/test/setup.ts`). `npm test` / `npm run test:watch`. 13 files / 82 tests: `api/client.ts` (single-flight refresh against `/platform/auth/*`), `tokenStorage`, `PlatformAuthContext` (incl. the MFA-required branch), `RequireAuth`, and behavior tests for `SignupQueuePage`, `PaymentsPage` (verify/reject), `SettingsPage`, `SchoolDetailPage`, `AuditLogPage`, `AnalyticsPage`, plus `Modal`/`Pagination`. `SchoolsPage`, `AppShell`, and the remaining UI primitives are not yet covered. Mock the relevant `api/*.ts` module with `vi.mock` rather than adding MSW.
