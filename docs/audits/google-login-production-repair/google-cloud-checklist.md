# Google Cloud Configuration Checklist

**Do not store client secrets here.**

| Item | Required value / status |
|------|-------------------------|
| Application type | Web application |
| Client ID | Present (web prefix `6156…` expected) |
| Client secret | Present (Vercel only) |
| Authorised JavaScript origins | `https://homecheff.eu` |
| Authorised redirect URIs | **`https://homecheff.eu/api/auth/callback/google`** (required) |
| www redirect URI | Optional / obsolete after www→apex middleware redirect |
| Preview redirect URIs | Each Preview host needs `https://<preview>.vercel.app/api/auth/callback/google` **or** use a stable Preview auth URL documented in Google Cloud |
| localhost | `http://localhost:3000/api/auth/callback/google` for Development |
| Scopes | `openid email profile` (code) |
| Consent screen | Prefer Production publishing for public pilot |
| Test users | Required if consent screen is Testing |
| Domain verification | Recommended for Production consent |

Derived from implementation: NextAuth Google callback path is always `/api/auth/callback/google`.
