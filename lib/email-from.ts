/** Transactionele afzender voor Resend (na verificatie domein in Resend). */
export function getTransactionalFrom(): string {
  const from = process.env.FROM_EMAIL?.trim();
  if (from) return from;
  return "HomeCheff <noreply@homecheff.eu>";
}
