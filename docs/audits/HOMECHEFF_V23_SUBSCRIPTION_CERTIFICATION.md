# V23 subscription certification

Status: NOT_VERIFIED as a checkout flow.

The sell page source still contains "Heb je een promocode?". The local browser could not render `/sell` or `/register` because of the webpack client error recorded in the browser report. No subscription was created. No promotion was redeemed. Prices and benefits were not changed.

The promotion limit unit tests passed, including unlimited to finite, finite up and down, finite back to unlimited, and refusal below existing uses. That is UNIT_TESTED. It is not a Stripe subscription activation and not a 100 percent, 12 month redemption.

Zero-cost activation, duplicate subscription webhooks, and a concurrent last slot were not executed.
