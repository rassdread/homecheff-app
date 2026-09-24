#!/usr/bin/env node
/**
 * Fail when a component calls a React/Next hook that is not imported.
 * This is the class of bug that crashed /profile (useUserBootstrap)
 * and /reservations (useState) while `next build` still exited 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HOOKS = [
  'useState',
  'useEffect',
  'useRef',
  'useMemo',
  'useCallback',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useId',
  'useUserBootstrap',
  'useSession',
  'useRouter',
  'useSearchParams',
  'usePathname',
  'useTranslation',
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'backup-extracted',
  'docs',
  '.git',
  'coverage',
]);

export function findUnboundHooks(root) {
  const hits = [];
  const files = [];
  walk(root, files);
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const imported = new Set();
    for (const match of src.matchAll(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]/g)) {
      for (const name of match[0].matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)) {
        imported.add(name[1]);
      }
    }
    for (const hook of HOOKS) {
      const call = new RegExp(`(?<![.\\w])${hook}\\s*(?:<[^\\n(>]*>)?\\s*\\(`);
      if (!call.test(src)) continue;
      const declared = new RegExp(`\\b(?:function|const|let|var|class)\\s+${hook}\\b`).test(src);
      if (!imported.has(hook) && !declared) {
        hits.push(`${path.relative(root, file)} :: ${hook}`);
      }
    }
  }
  return hits.sort();
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(entry.name)) out.push(full);
  }
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const hits = findUnboundHooks(root);
  if (hits.length) {
    console.error('Unbound hook calls (missing import). These crash at runtime and are ignored by next build:\n');
    for (const hit of hits) console.error(`  ${hit}`);
    process.exit(1);
  }
  console.log('Unbound-hook check passed.');
}
