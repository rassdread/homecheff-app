const assert = require('node:assert/strict');
const test = require('node:test');
const { decideVercelProjectIgnore } = require('./vercel-project-ignore');

const HOMECHEFF_ONLY = [
  'app/api/auth/complete-social-onboarding/route.ts',
  'lib/seller/seller-role-consistency.ts',
];

function decision(projectName, changedPaths, commitMessage = '') {
  return decideVercelProjectIgnore({ projectName, changedPaths, commitMessage });
}

test('HomeCheff production app builds a HomeCheff-only commit', () => {
  assert.equal(decision('homecheff-app', HOMECHEFF_ONLY).action, 'build');
});

test('duplicate homecheff-app1 always skips', () => {
  assert.equal(decision('homecheff-app1', HOMECHEFF_ONLY).action, 'skip');
  assert.equal(decision('homecheff-app1', ['package.json']).action, 'skip');
});

test('explicit SKIP_DEPLOY skips the production app', () => {
  assert.equal(
    decision('homecheff-app', HOMECHEFF_ONLY, 'chore [SKIP_DEPLOY]').action,
    'skip',
  );
});

test('HomeCheff-only commit skips all three satellite projects', () => {
  for (const project of ['hc-verdiencheck-money', 'hc-vc-holiday-pay', 'hc-verdiencheck-ux']) {
    assert.equal(decision(project, HOMECHEFF_ONLY).action, 'skip', project);
  }
});

test('money calculator builds only the money project', () => {
  const paths = ['lib/verdiencheck/calculator/engine.ts'];
  assert.equal(decision('hc-verdiencheck-money', paths).action, 'build');
  assert.equal(decision('hc-vc-holiday-pay', paths).action, 'skip');
  assert.equal(decision('hc-verdiencheck-ux', paths).action, 'skip');
  assert.equal(decision('homecheff-app', paths).action, 'build');
});

test('holiday pay builds only the holiday-pay project', () => {
  const paths = [
    'lib/verdiencheck/wizard/holiday-pay.ts',
    'components/verdiencheck/VerdienCheckHolidayPayFields.tsx',
  ];
  assert.equal(decision('hc-vc-holiday-pay', paths).action, 'build');
  assert.equal(decision('hc-verdiencheck-money', paths).action, 'skip');
  assert.equal(decision('hc-verdiencheck-ux', paths).action, 'skip');
});

test('Verdiencheck screen change builds only the ux project', () => {
  const paths = ['components/verdiencheck/VerdienCheckWizard.tsx', 'app/verdiencheck/page.tsx'];
  assert.equal(decision('hc-verdiencheck-ux', paths).action, 'build');
  assert.equal(decision('hc-verdiencheck-money', paths).action, 'skip');
  assert.equal(decision('hc-vc-holiday-pay', paths).action, 'skip');
});

test('shared package and Prisma inputs build every satellite', () => {
  for (const path of ['package.json', 'package-lock.json', 'prisma/schema.prisma', 'scripts/vercel-build.js']) {
    for (const project of ['hc-verdiencheck-money', 'hc-vc-holiday-pay', 'hc-verdiencheck-ux']) {
      assert.equal(decision(project, [path]).action, 'build', `${project} ${path}`);
    }
  }
});

test('unknown diff builds satellites instead of hiding a failure', () => {
  assert.equal(decision('hc-verdiencheck-money', null).action, 'build');
  assert.equal(decision('hc-vc-holiday-pay', null).action, 'build');
  assert.equal(decision('hc-verdiencheck-ux', null).action, 'build');
});

test('ignore-script-only change does not force satellite builds', () => {
  const paths = [
    'vercel-ignore-build.js',
    'lib/deploy/vercel-project-ignore.js',
    'lib/deploy/vercel-project-ignore.test.js',
  ];
  for (const project of ['hc-verdiencheck-money', 'hc-vc-holiday-pay', 'hc-verdiencheck-ux']) {
    assert.equal(decision(project, paths).action, 'skip', project);
  }
  assert.equal(decision('homecheff-app', paths).action, 'build');
});
