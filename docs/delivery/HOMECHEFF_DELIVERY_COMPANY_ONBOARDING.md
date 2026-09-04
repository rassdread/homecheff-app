# Company delivery onboarding

Entry: `/delivery/start` → **Ik heb een bezorgbedrijf** → `/delivery/company/signup`

Creates:

1. `DeliveryProfile` (`providerType=DELIVERY_BUSINESS`, company display fields)
2. `DeliveryCompanyMember` role `OWNER` for the creating user

Then:

- `/delivery/company/dashboard` — jobs, invite drivers, assign
- `/delivery/settings` — company price & area (company-owned)
- Invite: POST `/api/delivery/company/drivers` → accept `/delivery/invite/[token]`

Driver join: **invite-only** (no open self-join without token).

Status for company profile: start `isActive=false` until configured; activate when ready.
