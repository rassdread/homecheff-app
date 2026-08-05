# Mobile web regression

**Status:** PARTIAL / INFRA ONLY

Desktop/mobile-user-agent distinction not fully exercised on a physical Android Chrome session this freeze.

Code path: Capgo native flow is gated on Capacitor native platform; mobile Chrome should use NextAuth browser OAuth.

Operator should confirm on Android Chrome: Google login uses browser OAuth (not Capgo), returns to apex, preserves route, logout works.
