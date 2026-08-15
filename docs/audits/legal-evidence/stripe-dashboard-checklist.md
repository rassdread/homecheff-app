# Stripe Dashboard — Manual Evidence Checklist

**Status:** All items below are `PROVEN_FROM_STRIPE` **pending** until owner completes checklist.  
**Do not paste API keys or bank account numbers into git.**

For each row: open Dashboard → record value in a **private** evidence folder (not git) → attach screenshot/export if marked.

| # | Check | Suggested Dashboard path | Value to record | Why it matters | Screenshot/export? |
|---|---|---|---|---|---|
| 1 | Legal business name | Settings → Business details / Account | Exact legal name | Compare to Arrias Beheer B.V. | YES |
| 2 | Public business name | Business settings / branding | DBA / public name | Buyer perception / MoR optics | YES |
| 3 | Statement descriptor | Settings → Public details / Bank statement | Full descriptor | Card statement identity | YES |
| 4 | Shortened statement descriptor | Same | Short form | Truncated card display | YES |
| 5 | Receipt branding/name | Settings → Customer emails / Branding | Name on receipt | Receipt merchant identity | YES |
| 6 | Customer receipt email identity | Emails / Customer emails | From-name + from-address | Who “speaks” as merchant | YES |
| 7 | Support email | Public details | Address | Dispute/support routing | YES |
| 8 | Support phone | Public details | Number if any | Same | optional |
| 9 | Support website | Public details | URL | Same | optional |
| 10 | Platform account country | Account | Country | Regulatory locus | YES |
| 11 | Business type | Business details | company / individual | Entity match | YES |
| 12 | Connect configuration | Connect → Settings | Express/Custom/Standard defaults | Matches code Express | YES |
| 13 | Connected account agreement | Connect settings | Controllership / service agreement type if shown | Liability allocation optics | YES |
| 14 | Dispute liability | Connect / Radar / disputes settings | Platform vs connected | Chargeback economic risk | YES |
| 15 | Negative balance liability | Connect settings | Who covers | Shortfall after refunds | YES |
| 16 | Platform Controls | Connect → Platform controls | Enabled controls | Operational control facts | YES |
| 17 | Payout configuration | Settings → Payouts | Schedule, currency | Platform cash cycle | YES |
| 18 | Checkout branding | Branding / Checkout | Logo, colors, name | Buyer experience | YES |
| 19 | Tax / invoice settings | Tax / Invoicing | Stripe Tax on/off; invoice features | Invoice evidence gap | YES |

## Controlled payment fixture (if Dashboard alone insufficient)

1. Use **Stripe test mode** or a €0.50–€1 **owned test listing** with Connect test account.  
2. Complete Checkout once.  
3. Export: Checkout Session, PaymentIntent, Charge, Receipt PDF/email, card statement descriptor.  
4. Store privately; record only redacted descriptors in counsel pack.

**Repo alone cannot supply items 1–19.**
