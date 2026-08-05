import { AI_TXT } from '@/lib/seo/ai-machine-briefs';

export const dynamic = 'force-static';

/**
 * Compact YAML-ish agent brief — distinct from human-oriented /llms.txt.
 */
export function GET() {
  return new Response(AI_TXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
