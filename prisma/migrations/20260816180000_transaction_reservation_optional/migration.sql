-- P0: marketplace checkout Transactions have no Reservation.
-- Make Transaction.reservationId nullable (additive / safe).
ALTER TABLE "Transaction" ALTER COLUMN "reservationId" DROP NOT NULL;
