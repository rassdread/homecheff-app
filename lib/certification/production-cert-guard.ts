/**
 * Certification scripts that write users must be started on purpose.
 * Preview and non-production Vercel builds cannot satisfy this guard.
 * A hostname is not enough.
 */
export function assertProductionCertMutationAllowed(): void {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== 'production') {
    throw new Error(`cert_mutation_blocked:VERCEL_ENV=${vercelEnv}`);
  }
  if (process.env.HOMECHEFF_CERT_INTENT !== 'production') {
    throw new Error('cert_mutation_blocked:HOMECHEFF_CERT_INTENT');
  }
}
