# Social Login & Registratie Flow Analyse

## ✅ Social Login Flow

### Stap 1: Login Page
- **Locatie**: `app/login/page.tsx` regel 112-129
- **Actie**: `signIn(provider, { callbackUrl: '/register?social=true' })`
- **Status**: ✅ Correct

### Stap 2: Auth Redirect Callback
- **Locatie**: `lib/auth.ts` regel 418-437
- **Actie**: Redirect naar `/social-login-success` (niet direct naar `/register?social=true`)
- **Status**: ⚠️ Extra stap, maar werkt wel

### Stap 3: Social Login Success Page
- **Locatie**: `app/social-login-success/page.tsx`
- **Actie**: 
  - Checkt onboarding status via `/api/auth/check-onboarding`
  - Als onboarding niet compleet: redirect naar `/register?social=true`
  - Als onboarding compleet: redirect naar `/`
- **Status**: ✅ Correct

### Stap 4: Register Page (Social Mode)
- **Locatie**: `app/register/page.tsx` regel 265-314
- **Actie**: 
  - Detecteert `social=true` parameter
  - Pre-fills form met social data
  - Gebruikt `/api/auth/complete-social-onboarding` bij submit
- **Status**: ✅ Correct

### Stap 5: Complete Social Onboarding
- **Locatie**: `app/api/auth/complete-social-onboarding/route.ts`
- **Actie**: 
  - Update user met username, role, contact info
  - Zet `socialOnboardingCompleted: true`
- **Status**: ✅ Correct

### Stap 6: Redirect na Onboarding
- **Locatie**: `app/register/page.tsx` regel 1376
- **Actie**: Redirect naar `/inspiratie?welcome=true&onboarding=completed`
- **Status**: ✅ Correct

---

## ✅ Normale Registratie Flow

### Stap 1: Register Page
- **Locatie**: `app/register/page.tsx` regel 1280-1549
- **Actie**: Valideert form en submit naar `/api/auth/register`
- **Status**: ✅ Correct

### Stap 2: Register API
- **Locatie**: `app/api/auth/register/route.ts`
- **Actie**: 
  - Maakt nieuwe user aan
  - Retourneert `redirectUrl` (meestal `/inspiratie`)
- **Status**: ✅ Correct

### Stap 3: Auto-Login
- **Locatie**: `app/register/page.tsx` regel 1519-1524
- **Actie**: 
  - `signIn("credentials", { emailOrUsername, password, callbackUrl })`
  - Redirect naar `callbackUrl`
- **Status**: ✅ Correct

---

## ⚠️ Potentiële Problemen

1. **Social Login Redirect Chain**: 
   - Login page → `/social-login-success` → `/register?social=true`
   - Dit is een extra stap, maar werkt wel
   - De `callbackUrl` in login page wordt genegeerd door auth redirect callback

2. **Session Refresh na Social Onboarding**:
   - Regel 1368-1374: `updateSession({})` wordt aangeroepen
   - Dit zou moeten werken, maar kan race conditions hebben

3. **Password voor Social Users**:
   - Password is optioneel in `complete-social-onboarding`
   - Dit is correct, maar gebruikers kunnen later geen password hebben

---

## 🔧 Aanbevelingen

1. **Vereenvoudig Social Login Redirect**:
   - Auth redirect callback kan direct naar `/register?social=true` gaan
   - Of social-login-success kan sneller redirecten

2. **Verbeter Session Refresh**:
   - Wacht langer na `updateSession` of forceer hard refresh

3. **Test Scenarios**:
   - Nieuwe social user (Google)
   - Nieuwe social user (Facebook)
   - Bestaande social user (opnieuw inloggen)
   - Normale registratie
   - Registratie met bedrijf

