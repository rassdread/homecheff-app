# First real provider runbook

**Do not create fake public providers to certify this.**

## Individual

1. Signup via `/delivery/start` → Ik bezorg zelf  
2. Complete area + pricing in settings  
3. Activate via dashboard / `POST /api/delivery/activate`  
4. Complete Stripe Connect in Verdiensten when prompted  
5. Place a real Marketplace order selecting this provider  
6. Accept → pickup → deliver  
7. Reconcile: customer price, 12% fee, 88% payout ledger, affiliate on fee only  

## Company

1. `/delivery/start` → Ik heb een bezorgbedrijf  
2. Set company pricing + area; invite ≥1 driver  
3. Driver accepts invite → `/delivery/driver`  
4. Activate company  
5. Buyer selects **company** (not employee)  
6. Dispatcher assigns driver (reassign optional; price unchanged)  
7. Driver completes; settlement to company owner only  
8. Affiliate: single fee event; no driver+company double count  

Until a legitimate provider completes this live:

`FIRST_REAL_*_E2E_CERTIFIED = NO`
