# Entity audit

Source: `lib/seo/entity-graph.ts`

## One identity

| Node | Role |
|------|------|
| HomeCheff | Platform brand Organization `#organization` |
| homecheff.eu | WebSite `#website` |
| Arrias Beheer B.V. | Legal operator parent `#legal-operator` (KvK + VAT) |
| Sergio Arrias | Founder (name + role only) |

## Relationships

- brand → operator (`parentOrganization`)  
- website → brand (`publisher`)  
- brand → founder  
- brand → knowledge surfaces (manifest, constitution, trust, FAQ, docs…)  

## Rule

Never invent foundingDate, streetAddress, social URLs or impact metrics.
