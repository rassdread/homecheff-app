import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { countryDisplayName } from '@/lib/affiliate/affiliate-markets';
import {
  OPEN_INTEREST_STATUSES,
  parseMarketInterestBody,
  submitMarketInterest,
  type MarketInterestDraft,
} from '@/lib/affiliate/market-interest';
import { sendTransactionalEmail } from '@/lib/email/idempotent-send';
import { EMAIL_PRIORITY } from '@/lib/email/priority';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID' }, { status: 400 });
  }
  const locale = body.locale === 'en' ? 'en' : 'nl';
  const rawCode = typeof body.countryCode === 'string' ? body.countryCode : '';
  const draft = parseMarketInterestBody(
    body,
    locale,
    countryDisplayName(rawCode.toUpperCase(), locale),
  );

  const result = await submitMarketInterest({
    draft,
    store: {
      async findOpen(email, countryCode) {
        const row = await prisma.affiliateMarketInterest.findFirst({
          where: {
            email,
            countryCode,
            status: { in: [...OPEN_INTEREST_STATUSES] },
          },
          select: { id: true, email: true, countryCode: true, status: true },
        });
        return row;
      },
      async create(input: MarketInterestDraft) {
        const row = await prisma.affiliateMarketInterest.create({
          data: {
            name: input.name,
            email: input.email,
            countryCode: input.countryCode,
            countryName: input.countryName,
            region: input.region,
            phone: input.phone,
            languages: input.languages,
            profileUrl: input.profileUrl,
            salesExperience: input.salesExperience,
            networkReach: input.networkReach,
            wantsOwnCustomers: input.wantsOwnCustomers,
            wantsNetwork: input.wantsNetwork,
            motivation: input.motivation,
            locale: input.locale,
            status: 'NEW',
          },
          select: { id: true, email: true, countryCode: true, status: true },
        });
        return row;
      },
    },
    mailer: {
      async send(mail) {
        await sendTransactionalEmail({
          to: mail.to,
          subject: mail.subject,
          text: mail.text,
          html: `<pre>${mail.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`,
          eventType: 'affiliate_market_interest',
          priority: EMAIL_PRIORITY.P1,
          route: 'affiliate/market-interest',
          idempotencyKey: `market-interest:${mail.to}:${mail.subject}`,
        });
      },
    },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === 'SUPPORTED_COUNTRY' ? 409 : 400 });
  }
  return NextResponse.json(result);
}
