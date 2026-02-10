HomeCheff – Patch: align messages route with Next 15 async params

Waarom deze patch
-----------------
Next 15 genereert in `.next/types/...` een `RouteContext` waarbij **`params` een Promise is**:
  type RouteContext = { params: Promise<SegmentParams> }

Jouw bestand `app/api/messages/[conversationId]/route.ts` gebruikte nog `{ params: { ... } }` (niet‑Promise).
Dat veroorzaakt de TS-fout:
  Type '{ conversationId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, ...

Wat deze patch doet
-------------------
• Past alleen de signature aan zodat `params` als **Promise** wordt getypt en **await** wordt.
• Logica blijft verder identiek.

Bestanden in dit pakket
-----------------------
1. `app/api/messages/[conversationId]/route.ts`  → vervang hiermee jouw huidige bestand
2. `apply.ps1` (Windows)                          → kopieert bestand en wist `.next/`
3. `apply.sh` (macOS/Linux)                       → idem
4. `README.txt`                                   → deze uitleg

Snelle installatie (Windows)
---------------------------
1) Pak de zip uit in je projectroot (waar de map `app` staat).
2) Run:
   powershell -ExecutionPolicy Bypass -File .\apply.ps1
3) Start opnieuw:
   npm run dev

Snelle installatie (macOS/Linux)
--------------------------------
1) Pak de zip uit in je projectroot.
2) Run:
   chmod +x ./apply.sh
   ./apply.sh
3) Start opnieuw:
   npm run dev

Handmatig (zonder scripts)
--------------------------
• Vervang de inhoud van `app/api/messages/[conversationId]/route.ts` met de meegeleverde versie.
• Verwijder de cachemap `.next/`.
• Start opnieuw.

Welke bestanden verwijderen?
----------------------------
• **Alleen** `.next/` (build cache). Niets anders hoeft weg.

Tip
---
Check of je nog andere dynamische routes hebt met `{ params: { ... } }` in de tweede parameter.
In Next 15 moeten die `{ params: Promise<{ ... }> }` zijn en met `await` uitgepakt worden.
