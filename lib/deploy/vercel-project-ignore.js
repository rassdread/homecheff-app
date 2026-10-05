/**
 * Decides whether Vercel's Ignored Build Step should skip a project.
 * Exit convention stays in vercel-ignore-build.js:
 *   skip → exit 0, build → exit 1.
 *
 * homecheff-app always builds, except an explicit [SKIP_DEPLOY] commit.
 * homecheff-app1 is a duplicate of the same repo and always skips.
 *
 * hc-verdiencheck-money, hc-vc-holiday-pay, and hc-verdiencheck-ux are
 * extra Git connections on this same repository root. They are not
 * separate apps. They build the whole HomeCheff app and have no
 * production domain. A HomeCheff-only commit must not build them.
 * A change in that project's Verdiencheck area, or in a shared build
 * input, still builds so a real failure stays visible.
 */

const SATELLITE_PROJECTS = [
  'hc-verdiencheck-money',
  'hc-vc-holiday-pay',
  'hc-verdiencheck-ux',
];

const SHARED_BUILD_PREFIXES = [
  'prisma/',
];

const SHARED_BUILD_FILES = new Set([
  'package.json',
  'package-lock.json',
  'next.config.mjs',
  'next.config.js',
  'next.config.ts',
  'tsconfig.json',
  'vercel.json',
  'scripts/vercel-build.js',
  'middleware.ts',
  'app/layout.tsx',
]);

const PROJECT_PREFIXES = {
  'hc-verdiencheck-money': [
    'lib/verdiencheck/calculator/',
    'lib/verdiencheck/nl2026/',
    'lib/verdiencheck/domain/money',
    'lib/verdiencheck/domain/costs',
    'lib/verdiencheck/domain/revenue-cost',
    'lib/verdiencheck/rulesets/',
  ],
  'hc-vc-holiday-pay': [
    'lib/verdiencheck/wizard/holiday-pay',
    'components/verdiencheck/VerdienCheckHolidayPayFields',
  ],
  'hc-verdiencheck-ux': [
    'app/verdiencheck/',
    'components/verdiencheck/',
    'lib/verdiencheck/i18n/',
    'lib/verdiencheck/wizard/',
    'lib/verdiencheck/presentation/',
    'lib/verdiencheck/public-',
    'lib/verdiencheck/flags',
  ],
};

const PROJECT_EXCLUDES = {
  'hc-verdiencheck-ux': [
    'lib/verdiencheck/wizard/holiday-pay',
    'components/verdiencheck/VerdienCheckHolidayPayFields',
  ],
};

function normalizeProjectName(projectName) {
  return String(projectName || '').trim().toLowerCase();
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function matchesPrefix(filePath, prefix) {
  const path = normalizePath(filePath);
  return path === prefix || path.startsWith(prefix);
}

function isSharedBuildPath(filePath) {
  const path = normalizePath(filePath);
  if (SHARED_BUILD_FILES.has(path)) return true;
  return SHARED_BUILD_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

function isProjectPath(projectName, filePath) {
  const prefixes = PROJECT_PREFIXES[projectName] || [];
  const excludes = PROJECT_EXCLUDES[projectName] || [];
  const path = normalizePath(filePath);
  if (excludes.some((prefix) => matchesPrefix(path, prefix))) return false;
  return prefixes.some((prefix) => matchesPrefix(path, prefix));
}

function isHolidayPayScript(filePath) {
  return /holiday-pay/i.test(normalizePath(filePath));
}

function isMoneyScript(filePath) {
  const path = normalizePath(filePath);
  return path.startsWith('scripts/test-verdiencheck-') && !isHolidayPayScript(path);
}

/**
 * @param {{
 *   projectName?: string,
 *   commitMessage?: string,
 *   changedPaths?: string[] | null,
 * }} input
 * changedPaths null means the diff could not be read. Satellites then build
 * so a real failure is not hidden.
 */
function decideVercelProjectIgnore(input) {
  const projectName = normalizeProjectName(input.projectName);
  const commitMessage = input.commitMessage || '';
  const changedPaths = input.changedPaths;

  if (/\[SKIP_DEPLOY\]/i.test(commitMessage)) {
    return { action: 'skip', reason: 'commit message contains [SKIP_DEPLOY]' };
  }

  if (projectName === 'homecheff-app1') {
    return {
      action: 'skip',
      reason: 'duplicate project homecheff-app1; homecheff-app is the production app',
    };
  }

  if (!SATELLITE_PROJECTS.includes(projectName)) {
    return { action: 'build', reason: 'production app or unrecognized project' };
  }

  if (changedPaths == null) {
    return {
      action: 'build',
      reason: 'changed files could not be determined; build so a real failure stays visible',
    };
  }

  const relevant = changedPaths.filter((filePath) => {
    if (isSharedBuildPath(filePath)) return true;
    if (projectName === 'hc-vc-holiday-pay' && isHolidayPayScript(filePath)) return true;
    if (projectName === 'hc-verdiencheck-money' && isMoneyScript(filePath)) return true;
    if (projectName === 'hc-verdiencheck-ux' && isHolidayPayScript(filePath)) return false;
    return isProjectPath(projectName, filePath);
  });

  if (relevant.length > 0) {
    return {
      action: 'build',
      reason: `relevant paths: ${relevant.join(', ')}`,
    };
  }

  return {
    action: 'skip',
    reason: 'commit does not change this project or a shared build dependency',
  };
}

module.exports = {
  SATELLITE_PROJECTS,
  decideVercelProjectIgnore,
  isSharedBuildPath,
  isProjectPath,
};
