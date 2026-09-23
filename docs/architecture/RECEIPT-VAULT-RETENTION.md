# Private receipt vault — retention policy

Phase 8D. Covers `SellerFinancialEvidence` only: the receipts and invoices a
seller attaches to their own `SellerExpense` rows. It says nothing about order
data, payouts or invoices HomeCheff itself issues, which have their own basis.

## What Dutch law actually requires, and of whom

The Belastingdienst's `bewaarplicht` is an obligation on **the entrepreneur**,
not on every party that happens to hold a copy of a document.

| Data | Period | Source |
|---|---|---|
| Basisgegevens (debtors/creditors, purchase/sales ledger, general ledger, cash receipts) | 7 years | [Belastingdienst — administratie opzetten](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemen/administratie/een_administratie_opzetten) |
| Gegevens over onroerende zaken | 10 years | [Belastingdienst — administratie bewaren](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/administratie_bewaren/administratie_bewaren) |
| Supplies under the One Stop Shop scheme | 10 years | same |
| Other data | 7 years, or shorter by written agreement with the Belastingdienst | same |

The clock starts when a record loses its `actualiteitswaarde`, not on the
document date.

Two things follow that decide this policy:

1. **The obligation is the seller's.** A HomeCheff seller must keep their own
   administration for 7 years. HomeCheff is not that administration, and holding
   a copy neither discharges the seller's duty nor creates one for HomeCheff.
2. **HomeCheff has no retention basis of its own over a purchase receipt.** A
   receipt for ingredients the seller bought is not part of HomeCheff's own
   administration. HomeCheff's ledger records what HomeCheff paid the seller,
   which is derived from orders, not from the seller's supplier receipts. Under
   the AVG, personal data may not be kept longer than necessary, and
   Ondernemersplein states this plainly for administrations: once data is no
   longer necessary it must be deleted or anonymised.

So the vault keeps a receipt **as long as the seller keeps it, and no longer**.

## Implemented policy

| Trigger | Effect |
|---|---|
| Seller deletes an evidence item | `PENDING_PURGE` immediately (unreadable through every route), object removed, row `PURGED` |
| Seller deletes the expense | Every attached item enters the same lifecycle |
| Account deletion (`performUserAccountDeletion`) | All of that owner's evidence marked and purged; objects removed outside the transaction |
| Admin hard delete | Object keys captured before the transaction, objects removed after it commits — the rows cascade away, so the keys have to be read first or they are lost |
| Nothing happens at all | No expiry. The seller's copy stays until the seller removes it or leaves |

`RECEIPT_VAULT_PURGE_GRACE_HOURS` (default `0`) sets the delay between marking and
object removal. It exists so a recovery window can be introduced without a code
change. It does not delay unreadability: a marked row is already unreachable.

There is deliberately **no** automatic 7-year expiry. Implementing one would
mean HomeCheff asserting a retention claim it does not have, and would also be
the wrong number: the period runs from loss of `actualiteitswaarde`, which
HomeCheff cannot observe.

## The scanning caveat — this one matters

The Belastingdienst allows a scan to replace a paper original **only if** the
scan is a "juiste en volledige weergave van het origineel" and the
`echtheidskenmerken` are preserved
([source](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/uw_facturen_bewaren)).

Phase 8D strips EXIF, XMP and comment metadata from JPEG, PNG and WebP uploads,
because receipts photographed with a phone otherwise carry the seller's home
coordinates and device identifiers into storage. That is the right trade for a
convenience copy, but it means:

**A raster image in this vault is not guaranteed to qualify as a substitute for
the original under the fiscale bewaarplicht.**

PDFs are stored byte-for-byte, so a digitally received invoice is preserved
exactly as it arrived and does not have this problem.

The seller is told this in the expense UI rather than only here
(`sellerExpenses.evidenceStripped`), and no HomeCheff copy claims to be an
official scan.

## Open question

`NEEDS_LEGAL_REVIEW` — whether HomeCheff should offer an explicit
"fiscale archiefmodus" that stores raster uploads verbatim, retains them for a
seller-controlled period, and is presented as bewaarplicht-grade. That is a
product and legal decision, not an engineering one. It would require accepting
EXIF retention, a lawful basis for retaining data past account deletion, and
copy that does not overpromise. Until that decision exists, the conservative
behaviour above is the implemented one.

Nothing in Phase 8D blocks it: `storeNamespace` and the status lifecycle already
allow a second class of object to coexist.
