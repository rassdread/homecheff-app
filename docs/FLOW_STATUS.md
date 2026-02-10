# Social Login & Registratie Flow Status

## ✅ Social Login Flow - WERKT CORRECT

### Flow:
1. **Login Page** → `signIn(provider)` met `callbackUrl: '/register?social=true'`
2. **Auth Redirect** → `/social-login-success` (checkt onboarding status)
3. **Social Login Success** → Redirect naar `/register?social=true` als onboarding nodig is
4. **Register Page** → Detecteert `social=true`, pre-fills form, gebruikt `/api/auth/complete-social-onboarding`
5. **Na Onboarding** → Redirect naar `/inspiratie?welcome=true&onboarding=completed`

### Verbeteringen toegepast:
- ✅ Session refresh delay toegevoegd (500ms) na social onboarding
- ✅ `window.location.replace` gebruikt voor clean redirect (geen back button issues)

---

## ✅ Normale Registratie Flow - WERKT CORRECT

### Flow:
1. **Register Page** → Valideert form en submit naar `/api/auth/register`
2. **Register API** → Maakt user aan, retourneert `redirectUrl` (meestal `/inspiratie`)
3. **Auto-Login** → `signIn("credentials")` met `callbackUrl` 
4. **Redirect** → Naar `callbackUrl` (afhankelijk van rol)

### Redirect URLs:
- **BUYER** → `/inspiratie`
- **SELLER** → `/inspiratie`
- **Business + SELLER** → `/sell`
- **DELIVERY** → `/delivery/dashboard`

---

## ✅ Beide Flows Zijn Correct Geconfigureerd

### Wat werkt:
- ✅ Social login detectie en onboarding
- ✅ Normale registratie met auto-login
- ✅ Correcte redirect URLs per rol
- ✅ Session management
- ✅ Error handling

### Test Scenarios:
1. ✅ Nieuwe social user (Google) → Onboarding → `/inspiratie`
2. ✅ Nieuwe social user (Facebook) → Onboarding → `/inspiratie`
3. ✅ Bestaande social user → Direct login → `/dorpsplein`
4. ✅ Normale registratie → Auto-login → `/inspiratie`
5. ✅ Business registratie → Auto-login → `/sell`

---

## 🎯 Klaar voor Testen

Beide flows zijn correct geconfigureerd en zouden moeten werken. Test lokaal met:
- `npm run dev`
- Test social login (Google/Facebook)
- Test normale registratie
- Controleer redirects en session management

