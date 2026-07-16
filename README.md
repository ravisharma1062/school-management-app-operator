# School Management — Operator Console

Internal, high-privilege React app for the platform team (MT-3 of the multi-tenant SaaS plan). Separate from the
school-facing app (`school-management-app-ui`) by design — this is the surface that can touch every tenant, so it's
deployed and secured independently.

## What it does

- Review and approve/reject inbound school signup requests, provisioning a school + subscription + entitlements + a
  single-use admin invite link in one action. (Self-service trial signups from the marketing site skip this queue
  entirely and provision immediately — they show up already-active in the Schools list, with a
  `TRIAL_SELF_PROVISIONED` audit entry.)
- View every school, change its lifecycle status (suspend/reactivate/cancel), and change its plan (recomputes
  entitlements). School detail also shows a **Usage** card (active students vs. plan limit, emails/SMS sent this
  calendar month).
- Verify or reject manually-reported payments (Demand Draft / Cheque / NEFT) in a **Payments** queue — verifying
  extends the school's subscription period and reactivates it if suspended.
- Edit global platform **Settings**: the `autoApproveSignups` toggle (skips the review queue for all new signups
  when on) and the payment-instructions text shown to every school's Billing page.
- View the audit log of every platform action (including a `"System (self-service)"` entry for actions with no
  human operator, e.g. self-service trial provisioning).
- View platform analytics: tenant counts by status/plan, plus aggregate totals (active students, emails/SMS sent
  this month across all schools).

Authenticates against the backend's separate `/api/v1/platform/**` surface — platform JWTs are not interchangeable
with school-facing tokens (see `common/security/JwtAuthFilter` in the backend).

## Local development

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev             # http://localhost:5174
```

## Known gaps

- English only — this is an internal tool, not currently i18n'd like the school-facing apps.
- No UI yet for inviting additional platform admins (only the one Flyway-seeded dev account exists).
- No MFA enrollment nudge/reminder UI — an admin has to know to visit the (not-yet-linked) enroll flow themselves.
