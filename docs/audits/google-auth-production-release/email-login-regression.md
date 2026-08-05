# Email login regression

**Status:** INFRA ONLY

- Credentials provider still registered in `/api/auth/providers`.
- Login/register routes return 200 on Production.
- Interactive email/username/forgot-password/Create-return journeys not executed with live credentials this session.

No code path in the auth merge removes credentials authentication.
