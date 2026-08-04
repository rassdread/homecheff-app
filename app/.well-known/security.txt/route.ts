import { SUPPORT_EMAIL, PRESS_EMAIL } from '@/lib/seo/organization-identity';

export const dynamic = 'force-static';

const BODY = `Contact: mailto:${SUPPORT_EMAIL}
Contact: mailto:${PRESS_EMAIL}
Preferred-Languages: nl, en
Canonical: https://homecheff.eu/.well-known/security.txt
Expires: 2027-08-03T00:00:00.000Z
Policy: https://homecheff.eu/safety
Hiring: https://homecheff.eu/werken-bij
`;

export function GET() {
  return new Response(BODY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
