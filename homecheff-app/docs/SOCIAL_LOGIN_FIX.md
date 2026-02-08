# Social Login Fix - Redirect naar Login Probleem

## Probleem
Na social login werd de gebruiker wel ingelogd, maar de pagina sprong terug naar de inlogpagina met email.

## Oorzaak
De session was nog niet volledig geladen wanneer de `social-login-success` pagina laadde. De checks voor `status === 'unauthenticated'` of `!session?.user?.email` werden te vroeg uitgevoerd, waardoor er een redirect naar login plaatsvond.

## Oplossing
Verbeteringen in `app/social-login-success/page.tsx`:

1. **Session Update EERST**: De session wordt nu EERST geüpdatet voordat we checks doen
2. **Langere Wachtijd**: Verhoogd van 500ms naar 1000ms voor social login (heeft meer tijd nodig)
3. **Retry Mechanisme**: Als de session na update nog niet beschikbaar is, wachten we nog 1000ms en proberen opnieuw
4. **Consistente Session Gebruik**: Gebruik `finalSession` door de hele functie heen

## Wijzigingen

### Voor:
- Checks werden direct uitgevoerd bij page load
- Session update gebeurde NA de checks
- Geen retry mechanisme

### Na:
- Session update gebeurt EERST
- Wachten tot session beschikbaar is (met retry)
- Alleen redirect naar login als session echt niet beschikbaar is na retry

## Test
Test nu social login:
1. Ga naar `/login`
2. Klik op "Inloggen met Google" of "Inloggen met Facebook"
3. Voltooi OAuth flow
4. Je zou nu moeten worden doorgestuurd naar `/register?social=true` (nieuwe user) of `/` (bestaande user)

## Status
✅ Fix geïmplementeerd
✅ Build succesvol
✅ Klaar voor testen

