import { prisma } from '@/lib/prisma';
import { durationCopy, effectiveSubLimitLabel } from '@/lib/affiliate/program-control';
import { resolveStoredAffiliateCapabilities } from '@/lib/affiliate/program-store';

export default async function MyAffiliateProgram({ affiliateId }: { affiliateId: string }) {
  const [resolved, enrollment, portfolio] = await Promise.all([
    resolveStoredAffiliateCapabilities(affiliateId),
    prisma.affiliateProgramEnrollment.findUnique({ where: { affiliateId } }),
    prisma.attribution.count({ where: { affiliateId } }),
  ]);
  const name = resolved.programName || 'Vroege instap';
  return (
    <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-slate-800">
      <h2 className="text-base font-semibold text-slate-900">Jouw affiliateprogramma</h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Programma</dt>
          <dd className="font-medium">{name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Ingestapt</dt>
          <dd className="font-medium">
            {enrollment?.enrolledAt
              ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(enrollment.enrolledAt)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Klantenportefeuille</dt>
          <dd className="font-medium">{portfolio} toeschrijvingen</dd>
        </div>
        <div>
          <dt className="text-slate-500">Promotools</dt>
          <dd className="font-medium">{resolved.capabilities.CAN_CREATE_PROMO_CODES.value ? 'Aan' : 'Uit'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Netwerk</dt>
          <dd className="font-medium">
            {resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value
              ? `Aan · limiet ${effectiveSubLimitLabel(resolved.subAffiliateLimit.value)}`
              : 'Uit'}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-slate-600">{durationCopy(name)}</p>
    </section>
  );
}
