import { LLMS_TXT } from '@/lib/seo/ai-machine-briefs';
import { businessPlanMachineBrief } from '@/lib/business/plan-presentation';

export const dynamic = 'force-static';

export function GET() {
  return new Response(`${LLMS_TXT}\n\n${businessPlanMachineBrief()}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
