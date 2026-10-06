/**
 * Contact privacy, WhatsApp normalization, inspiration labels.
 * Run: npx tsx scripts/test-consolidation-contact.ts
 */
import assert from 'node:assert/strict';
import {
  presentContactChannelsForViewer,
  whatsappInternationalDigits,
  whatsappWaMeUrl,
} from '../lib/profile/maker-contact-preferences';
import { resolveInspirationPresentation } from '../lib/inspiratie/presentation';

assert.equal(whatsappInternationalDigits('06 12 34 56 78'), '31612345678');
assert.equal(whatsappInternationalDigits('+31 6 12345678'), '31612345678');
assert.equal(whatsappInternationalDigits('0031-6-12345678'), '31612345678');
assert.equal(whatsappWaMeUrl('0612345678'), 'https://wa.me/31612345678');
assert.equal(whatsappWaMeUrl(''), '');
assert.equal(whatsappInternationalDigits('123'), '');

const channels = presentContactChannelsForViewer(
  [
    { id: 'chat', href: '' },
    { id: 'phone', href: 'tel:+31612345678', display: '+31612345678' },
    { id: 'whatsapp', href: 'https://wa.me/31612345678' },
    { id: 'instagram', href: 'https://instagram.com/example' },
  ],
  { authenticated: false, isOwner: false },
);
assert.equal(channels.find((c) => c.id === 'phone')?.href, '');
assert.equal(channels.find((c) => c.id === 'phone')?.display, undefined);
assert.equal(channels.find((c) => c.id === 'whatsapp')?.href, '');
assert.equal(channels.find((c) => c.id === 'instagram')?.href, 'https://instagram.com/example');
assert.equal(JSON.stringify(channels).includes('31612345678'), false);

const owner = presentContactChannelsForViewer(channels, {
  authenticated: true,
  isOwner: true,
});
assert.equal(owner.some((c) => c.id === 'phone' || c.id === 'whatsapp'), false);

const signedIn = presentContactChannelsForViewer(
  [{ id: 'whatsapp', href: 'https://wa.me/31612345678' }],
  { authenticated: true, isOwner: false },
);
assert.equal(signedIn[0]?.href, 'https://wa.me/31612345678');

assert.equal(resolveInspirationPresentation('DESIGNER').semanticType, 'design');
assert.equal(resolveInspirationPresentation('DESIGNER').badgeKey, 'inspiratie.presentation.design.badge');
assert.equal(resolveInspirationPresentation('CHEFF').ctaKey, 'inspiratie.presentation.recipe.cta');
assert.equal(resolveInspirationPresentation('GROWN').badgeKey, 'inspiratie.presentation.garden.badge');
assert.equal(resolveInspirationPresentation(null).semanticType, null);
assert.notEqual(resolveInspirationPresentation('DESIGNER').badgeKey, resolveInspirationPresentation('CHEFF').badgeKey);

console.log('consolidation contact checks passed');
