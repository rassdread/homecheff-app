import Link from 'next/link';
import { cookies } from 'next/headers';

/**
 * Crawlable homepage links. The client Footer is not server-rendered, so these
 * stay in the initial HTML without bringing the work cockpit back under the feed.
 */
export default async function HomePublicFooter() {
  const cookieStore = await cookies();
  const lang =
    cookieStore.get('hc_locale')?.value ||
    cookieStore.get('homecheff-language')?.value;
  const en = lang === 'en';

  const links: Array<[string, string]> = [
    ['/inspiratie', en ? 'Inspiration' : 'Inspiratie'],
    ['/hoe-homecheff-werkt', en ? 'How it works' : 'Hoe het werkt'],
    ['/studio', 'Studio'],
    ['/growth', 'Growth'],
    ['/privacy', en ? 'Privacy' : 'Privacy'],
    ['/terms', en ? 'Terms' : 'Voorwaarden'],
    ['/contact', 'Contact'],
  ];

  return (
    <footer
      data-homecheff-site-footer="server"
      className="mt-2 border-t border-[var(--hc-border-quiet)] bg-[var(--hc-surface-page)]"
    >
      <nav
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-3 text-[11px] text-[var(--hc-text-secondary)]"
        aria-label={en ? 'Footer' : 'Footer navigatie'}
      >
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:underline">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
