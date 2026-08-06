# Deployment

| Field | Value |
|---|---|
| Project | `sergio-s-projects-f7b64ee1/homecheff-app` |
| Deployment ID | `dpl_BN6yZexSBECt1EJGnP5YZupBYYLz` |
| URL | https://homecheff-nmyxozdtk-sergio-s-projects-f7b64ee1.vercel.app |
| Target | Production |
| Status | **Ready** |
| Alias | https://homecheff.eu (also .nl / www) |
| Runtime marker | Homepage scripts include `?dpl=dpl_BN6yZexSBECt1EJGnP5YZupBYYLz` |
| Bundle proof | Production `common-*.js` contains `feed-mobile-place-input` and `hc:focus-place-input` |
| Git merge on main | `ae8cbb04` |
| Prior production (rollback deploy) | `dpl_8hJpXL2yH1885VvDcZrKmAHr8BMs` @ auth freeze era |
| Preview confusion | None — production alias points at new Ready deployment |

CLI: `npx vercel --prod --yes` from merge tree linked to `homecheff-app`.
