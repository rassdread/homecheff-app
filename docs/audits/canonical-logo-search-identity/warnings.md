# Warnings

## W1 — White suit on white backgrounds

Approved mascot uses white suit on transparent/white canvas. Navy outlines provide edge definition. Monitor Organization logo preview in Google Search Console; if contrast flagged, consider a subtle `#f8fafc` logo canvas variant (not implemented — operator decision).

## W2 — Google refresh latency

Favicon beside search results and Knowledge Panel logo update independently and may lag deployment by days or weeks.

## W3 — Android store rebuild required

Native launcher icons changed. Play Store listing still shows old icon until new AAB published.

## W4 — Orphan legacy file remains

`public/Tag 1976_Masscott_L05a-R04b kopie.png` still publicly reachable if URL guessed. Schedule deletion after confirming no external links.

## W5 — llms.txt / ai.txt absent

No machine-readable AI brief files exist. Entity facts live in JSON-LD only. Consider adding text briefs in a future phase (out of scope here).

## W6 — Splash screen portrait art unchanged

`homecheff-native-splash.png` was not replaced — only launcher + A12 icon. Full splash rebrand may be desired separately.

## W7 — Live HTTP 200 not verified

This task did not deploy. Production curl checks pending operator deploy.

## W8 — OG brand card uses composed layout

`og-brand.png` adds emerald background + "HomeCheff" text under mascot — not raw logo file alone. Appropriate for social previews per mission Part 6.
