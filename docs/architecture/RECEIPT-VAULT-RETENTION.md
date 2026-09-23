# Private receipt vault — retention policy

Phase 8D. Covers `SellerFinancialEvidence` only: the receipts and invoices a
seller attaches to their own `SellerExpense` rows. It says nothing about order
data, payouts or invoices HomeCheff itself issues, which have their own basis.

## What Dutch law actually requires, and of whom

The Belastingdienst's `bewaarplicht` is an obligation on **the entrepreneur**,
not on every party that happens to hold a copy of a document.

The seven years come from [art. 52 lid 4 AWR](https://wetten.overheid.nl/BWBR0002320/2026-01-01/#HoofdstukVIII_Afdeling2_Artikel52):
"administratieplichtigen zijn verplicht de […] gegevensdragers gedurende zeven
jaar te bewaren." Who counts as `administratieplichtig` is an exhaustive list in
lid 2 — legal entities, natural persons running a business or independent
profession, withholding agents, and holders of a `werkzaamheid` under arts.
3.91/3.92 Wet IB 2001. A platform holding a copy of someone else's purchase
receipt is not on that list.

Do not conclude from this that small sellers are exempt. The VAT entrepreneur
test is independent of the income-tax one and much easier to meet, and art.
52(2)(b)'s "een bedrijf uitoefenen" is broader than the IB test. The
Belastingdienst tells non-entrepreneurs they need no administration but still
advises keeping receipts, and warns "als u ondernemer bent voor de
omzetbelasting moet u wel een administratie bijhouden". The UI copy therefore
never tells anyone they have no duty.

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
3. **The seller's duty is not a ground for HomeCheff to refuse deletion.** The
   erasure exception in AVG art. 17(3)(b) covers a legal obligation "die op de
   verwerkingsverantwoordelijke rust" — one resting on the controller itself.
   An obligation resting on the seller does not qualify, so HomeCheff cannot
   invoke the seller's bewaarplicht to keep a receipt the seller asked to
   delete.

So the vault keeps a receipt **as long as the seller keeps it, and no longer**.

### The passage that cuts the other way

Recorded deliberately, because the case above is otherwise one-sided. The
Belastingdienst brochure [Uw geautomatiseerde administratie en de fiscale
bewaarplicht](https://download.belastingdienst.nl/belastingdienst/docs/geautomatiseerde_administratie_en_fiscale_bewaarplicht_al0401z14fd.pdf)
(edition July 2026), §1.1, says that where an entrepreneur has administration
handled by third parties — explicitly naming "de administratie via een
cloudoplossing" — "dan vallen uw gegevens bij die derden ook onder de fiscale
bewaarplicht", and instructs him to agree "beheer, beschikbaarheid,
verantwoordelijkheden en bewaarplicht" with those parties, for example in an SLA.

Read closely it is addressed to the entrepreneur and tells *him* to contract for
it; it does not make the third party `administratieplichtig`. But it means the
live risk is not a fine for deleting — it is characterisation. The more this
feature resembles a bookkeeping service, the more plausibly a seller, their
accountant, or an inspector treats HomeCheff as part of that administration.
Keeping it framed as a personal attachment, and saying so in the UI, is what
keeps it on the right side of that paragraph. That framing is a compliance
control, not decoration, and should not be softened in future copy edits.

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

Conversion to another data carrier is expressly allowed by art. 52 lid 5 AWR,
but only "met juiste en volledige weergave der gegevens" and provided the data
"gedurende de volledige bewaartijd beschikbaar zijn". The Belastingdienst
restates this for receipts and adds that the `echtheidskenmerken` must be stored
too, and that where conversion loses them the entrepreneur must compensate with
technical or organisational measures
([source](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/uw_facturen_bewaren)).

Two of those conditions land badly here, and both point the same way:

Phase 8D strips EXIF, XMP and comment metadata from JPEG, PNG and WebP uploads,
because receipts photographed with a phone otherwise carry the seller's home
coordinates and device identifiers into storage. That is the right trade for a
convenience copy, but it means:

**A raster image in this vault is not guaranteed to qualify as a substitute for
the original under the fiscale bewaarplicht.**

PDFs are stored byte-for-byte, so a digitally received invoice is preserved
exactly as it arrived and does not have this problem.

The second condition is the harder one, and it is not fixable by storing more
bytes. "Beschikbaar gedurende de volledige bewaartijd" is precisely what
HomeCheff cannot promise for a copy the seller may delete, that disappears with
the account, and that lives in a product with no seven-year availability
commitment. A seller who throws away the paper original and relies on this vault
has not satisfied the conversion conditions no matter how faithful the image is.
That, rather than EXIF, is the real reason the UI tells them to keep their own
original.

The seller is told this in the expense UI rather than only here
(`sellerExpenses.evidenceStripped`), and no HomeCheff copy claims to be an
official scan.

## How far deletion actually reaches

The AP is explicit that back-ups fall under the right to erasure: on a deletion
request the data must go "uit al uw systemen en bestanden, inclusief uw
back-ups". What Phase 8D does and does not achieve, stated plainly:

- **The bytes go.** The object is removed from the vault store, and the store
  holds no versions or snapshots of its own. There is no second copy of a
  receipt image anywhere.
- **The metadata row survives in database back-ups** for the provider's
  point-in-time recovery window. That row holds the filename, size, MIME type
  and SHA-256 — not the receipt contents. This is not specific to receipts; it
  is true of every deletion in the product, and closing it is a platform-wide
  back-up policy question rather than an 8D one.

Worth knowing before answering a formal art. 17 request, so the answer describes
what actually happens.

## Open questions

`NEEDS_LEGAL_REVIEW` — **HomeCheff's own bewaarplicht is a separate question.**
HomeCheff is a `lichaam` and therefore `administratieplichtig` for its own
administration. If a seller's receipt were ever used as evidence in HomeCheff's
own books — a commission dispute, a chargeback, a platform-funded reimbursement
— a different retention analysis would apply to *that* copy, and the seller's
deletion could not simply erase it. Phase 8D keeps the two apart architecturally:
`SellerFinancialEvidence` feeds nothing in HomeCheff's accounting and no other
subsystem reads it. **That separation is load-bearing.** Any future feature that
lets a receipt support a HomeCheff-side financial decision needs its own
retention basis and its own deletion path, and must not reuse this one.

`NEEDS_LEGAL_REVIEW` — whether HomeCheff should offer an explicit
"fiscale archiefmodus" that stores raster uploads verbatim, retains them for a
seller-controlled period, and is presented as bewaarplicht-grade. That is a
product and legal decision, not an engineering one. It would require accepting
EXIF retention, a lawful basis for retaining data past account deletion, and
copy that does not overpromise. Until that decision exists, the conservative
behaviour above is the implemented one.

Nothing in Phase 8D blocks it: `storeNamespace` and the status lifecycle already
allow a second class of object to coexist.
