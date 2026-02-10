-- Veilige migratie: Maak reservationId optional in Transaction tabel
-- BEHOUDT ALLE BESTAANDE DATA
-- Voer dit handmatig uit als de migratie nog niet is uitgevoerd

-- Check huidige status
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Transaction' 
  AND column_name = 'reservationId';

-- Stap 1: Drop foreign key constraint (tijdelijk)
ALTER TABLE "public"."Transaction" 
DROP CONSTRAINT IF EXISTS "Transaction_reservationId_fkey";

-- Stap 2: Drop unique constraint (tijdelijk)
ALTER TABLE "public"."Transaction" 
DROP CONSTRAINT IF EXISTS "Transaction_reservationId_key";

-- Stap 3: Maak kolom nullable (BEHOUDT ALLE DATA)
-- Bestaande reservationId waarden blijven behouden
ALTER TABLE "public"."Transaction" 
ALTER COLUMN "reservationId" DROP NOT NULL;

-- Stap 4: Herstel unique constraint (staat NULL waarden toe)
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "Transaction_reservationId_key" UNIQUE ("reservationId");

-- Stap 5: Herstel foreign key constraint (nu optional)
ALTER TABLE "public"."Transaction" 
ADD CONSTRAINT "Transaction_reservationId_fkey" 
FOREIGN KEY ("reservationId") 
REFERENCES "public"."Reservation"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verificatie: Check of migratie succesvol was
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Transaction' 
  AND column_name = 'reservationId';
-- is_nullable moet nu 'YES' zijn


































