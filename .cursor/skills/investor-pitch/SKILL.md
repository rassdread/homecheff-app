---
name: investor-pitch
description: Maintains the HomeCheff investor pitch page and pitch deck. Use when editing the investor overview page, updating the pitch PDF, changing pitch route or styling, or when the user mentions investor_pitch, /pitch, or pitch deck.
---

# Investor Pitch (HomeCheff)

## Scope

- **Route:** `/pitch` (page at `app/pitch/page.tsx`)
- **PDF:** `public/HomeCheff_Investor_PitchDeck_website.pdf` — replace this file to update the deck; keep the filename or update `PITCH_PDF_PATH` in the page.
- **Metadata:** `title: Investor overview – HomeCheff`; `robots: noindex, nofollow`.

## Styling (HomeCheff)

Keep the pitch page consistent with the rest of the site:

- **Background:** `min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50`
- **Container:** `container mx-auto px-4 py-8 max-w-5xl`
- **Back link:** `text-emerald-600 hover:text-emerald-700` with `ArrowLeft`, label "Terug naar home"
- **Logo:** `<Logo size="md" />` from `@/components/Logo`
- **Heading:** "Investor overview – HomeCheff" — `text-2xl sm:text-3xl font-bold text-gray-900`
- **Primary button (Download PDF):** `bg-emerald-600 hover:bg-emerald-700` with focus ring `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
- **PDF card:** `bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden`
- **Main wrapper:** `<main className="min-h-screen bg-gradient-to-br ...">`

## When Editing

1. **Change PDF:** Replace `public/HomeCheff_Investor_PitchDeck_website.pdf`. No code change unless the filename changes.
2. **Change route:** Move or add route under `app/pitch/`; update any internal links.
3. **Change copy:** Adjust title, button text, or helper text in `app/pitch/page.tsx`; keep tone professional and Dutch where appropriate.
4. **Change layout:** Preserve the same gradient, logo, back link, and PDF iframe so the page stays on-brand.

## Quick reference

| Item        | Value |
|------------|--------|
| Page file  | `app/pitch/page.tsx` |
| PDF path   | `/HomeCheff_Investor_PitchDeck_website.pdf` (public) |
| Public URL | `homecheff.eu/pitch` |
