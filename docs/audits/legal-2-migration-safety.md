# LEGAL-2 — Migration safety

**Migration:** `20260814140000_legal2_product_food_allergens`  
**Type:** additive (`ADD COLUMN IF NOT EXISTS`)  
**Backfill:** NONE — `allergensConfirmedAt` stays null → UNKNOWN  
**Rollback:** drop `allergens` / `allergensConfirmedAt` columns after code rollback  

Deploy order: migrate → production deploy.
