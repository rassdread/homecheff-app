/**
 * One-off: make public/homecheff-globeman.png truly transparent PNG.
 * Run: node scripts/remove-globeman-bg.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public/homecheff-globeman.png');

const buf = readFileSync(target);
const png = PNG.sync.read(buf);

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (png.width * y + x) << 2;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    // Remove near-white background; keep mascot + soft shadow
    if (r > 232 && g > 232 && b > 232) {
      png.data[i + 3] = 0;
    } else if (r > 210 && g > 210 && b > 210 && png.data[i + 3] > 0) {
      const avg = (r + g + b) / 3;
      png.data[i + 3] = Math.max(0, Math.min(255, Math.round((255 - avg) * 4)));
    }
  }
}

writeFileSync(target, PNG.sync.write(png));
console.log('homecheff-globeman.png: white background removed, PNG alpha applied');
