# 🔐 Social Login Setup Guide - Google & Facebook

## ✅ Wat is geïmplementeerd:

**1. Enhanced Social Login** ✅
- Google en Facebook providers geconfigureerd
- Volledige profielinformatie ophalen (naam, email, foto)
- Unieke username generatie
- Automatische profiel update bij bestaande gebruikers

**2. HomeCheff Styling** ✅
- Mooie social login buttons in jouw stijl
- Hover effecten en animaties
- Consistent met je design system

**3. Success Page** ✅
- Mooie welkomspagina na social login
- Profiel preview met foto en informatie
- Directe links naar profiel en homepage

---

## 🔑 Environment Variables Setup:

### **In je `.env.local` bestand:**

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key
```

### **In Vercel (Production):**

Ga naar: **Vercel Dashboard** → **homecheff-app** → **Settings** → **Environment Variables**

Voeg deze toe (alle 3 environments: Production, Preview, Development):

```bash
GOOGLE_CLIENT_ID = je-google-client-id
GOOGLE_CLIENT_SECRET = je-google-client-secret
FACEBOOK_CLIENT_ID = je-facebook-app-id
FACEBOOK_CLIENT_SECRET = je-facebook-app-secret
NEXTAUTH_URL = https://homecheff-app.vercel.app
NEXTAUTH_SECRET = je-secret-key
```

---

## 🧪 **Test Social Login:**

**Development Server:** `http://localhost:3002`

**Test stappen:**

1. **Ga naar login pagina:** `http://localhost:3002/login`
2. **Klik op "Inloggen met Google"** of **"Inloggen met Facebook"**
3. **Voltooi de OAuth flow**
4. **Je wordt doorgestuurd naar:** `/social-login-success`
5. **Check je profiel:** `/profile`

---

## 📋 **Wat er wordt opgehaald:**

### **Google Login:**
- ✅ **Naam** (volledige naam)
- ✅ **Email** (Gmail adres)
- ✅ **Profielfoto** (Google profielfoto)
- ✅ **Locale** (land/regio informatie)
- ✅ **Unieke username** (gegenereerd)

### **Facebook Login:**
- ✅ **Naam** (volledige naam)
- ✅ **Email** (Facebook email)
- ✅ **Profielfoto** (Facebook profielfoto)
- ✅ **Locatie** (indien beschikbaar)
- ✅ **Unieke username** (gegenereerd)

---

## 🔍 **Debug Logs:**

In de console zie je:

```javascript
🔍 Social login data: {
  provider: "google",
  userEmail: "user@gmail.com",
  userName: "John Doe",
  userImage: "https://lh3.googleusercontent.com/...",
  profile: { ... }
}

✅ New social user created: {
  id: "user_123",
  email: "user@gmail.com", 
  username: "user123",
  provider: "google"
}
```

---

## 🚀 **Features:**

**Voor nieuwe gebruikers:**
- Automatisch account aanmaken
- Profielfoto importeren
- Standaard interesses instellen
- Welkomstbericht

**Voor bestaande gebruikers:**
- Profielfoto updaten
- Naam updaten
- Bestaande data behouden

**Username generatie:**
- Unieke usernames (email prefix + nummer indien nodig)
- Geen conflicten met bestaande gebruikers

---

## 🎨 **Styling Features:**

- **Hover effecten** op social login buttons
- **Icon animaties** (scale on hover)
- **Kleur thema's** (Google = emerald, Facebook = blue)
- **Rounded corners** (rounded-2xl)
- **Smooth transitions** (duration-200)
- **Focus states** voor accessibility

---

**Test nu je social login en laat me weten hoe het werkt!** 🎉✨
