# Website Logo Validation

| Surface | Component | Asset | Proportions | Alt text | Notes |
|---------|-----------|-------|-------------|----------|-------|
| Desktop nav (xl+) | `NavBar` → `Logo` | `/icon-192.png` | Square container, `object-contain` | "HomeCheff Logo" | Text + icon |
| Desktop nav (<xl) | `NavBar` → `Logo showText=false` | same | 40–48px square | same | Icon only |
| Mobile bottom nav | inherits top chrome | same | responsive w/h classes | same | No stretch |
| Footer | `Footer` → `Logo sm` | same | 36–40px | same | Hidden on `/` |
| Homepage hero | `HomeHeroVisualCluster` | `/homecheff-globeman.png` | contained in orbit | i18n hero alt | Approved art |
| Login / Register | NavBar only | via NavBar | — | — | No separate logo block |
| About `/over-ons` | page header `Logo md` | SSOT square | contained | yes | PASS |
| Contact | `Logo md` | SSOT | contained | yes | PASS |
| Pitch | `Logo md` | SSOT | contained | yes | PASS |
| Trust / Manifest / docs | NavBar + authority pages | SSOT + OG brand card | — | — | PASS |
| Print inspiratie | `InspiratiePrintView` | SSOT square 32px | contained | "HomeCheff" | PASS |
| Dark mode nav/footer | `Logo` | SSOT | navy outlines visible | yes | PASS |
| Emerald CTA contexts | `Logo` text uses primary/emerald tokens | — | — | — | PASS |

## Layout shift

`Logo.tsx` uses fixed responsive width/height containers with `fill` + `object-contain` and `priority` preload — no CLS expected from logo swap.

## Viewports checked (code review)

- Phone portrait: `w-10 h-10` icon container
- Phone landscape: same + NavBar responsive breakpoints
- Tablet: `sm:w-12 sm:h-12`
- Desktop xl+: full wordmark + subtitle
