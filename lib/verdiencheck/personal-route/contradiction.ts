import type { PersonalRouteContradiction, PersonalVerdienRoute } from './types';

const REGISTER_NOW = /registreer je nu|moet je.{0,40}registreren|registratie is nodig/i;
const NOT_REGISTER = /hoeft je niet.{0,40}registr|niet bij de nvwa te registreren|registratie is bij een eenmalige/i;
const CAN_START = /je kunt beginnen\.?/i;
const WAIT_PERMISSION = /wacht.{0,40}toestemming|wacht met bedrijfsactiviteiten/i;

export function findPersonalRouteContradictions(
  route: Pick<
    PersonalVerdienRoute,
    'headline' | 'canStartMessage' | 'proceedSemantics' | 'now' | 'soon'
  >,
): PersonalRouteContradiction[] {
  const out: PersonalRouteContradiction[] = [];
  const nowText = route.now.map((c) => `${c.title} ${c.body}`).join('\n');
  const soonText = route.soon.map((c) => `${c.title} ${c.body}`).join('\n');
  const blob = `${route.headline}\n${route.canStartMessage}\n${nowText}\n${soonText}`;

  if (NOT_REGISTER.test(nowText) && REGISTER_NOW.test(nowText)) {
    out.push({
      code: 'REGISTER_AND_NOT_REGISTER',
      message: 'NOW shows both register-now and no-registration-needed',
    });
  }

  if (
    route.proceedSemantics === 'READY_TO_PROCEED' &&
    WAIT_PERMISSION.test(blob)
  ) {
    out.push({
      code: 'START_AND_WAIT',
      message: 'READY_TO_PROCEED together with wait-for-permission',
    });
  }

  if (CAN_START.test(route.headline) && WAIT_PERMISSION.test(nowText)) {
    out.push({
      code: 'HEADLINE_START_AND_WAIT',
      message: 'Headline says start while NOW asks to wait for permission',
    });
  }

  if (
    route.proceedSemantics === 'READY_TO_PROCEED' &&
    route.now.some((c) => c.severity === 'ACTION' && c.family === 'benefit_prestart')
  ) {
    out.push({
      code: 'READY_WITH_PRESTART_ACTION',
      message: 'READY_TO_PROCEED with a benefit pre-start ACTION',
    });
  }

  if (
    route.proceedSemantics === 'READY_TO_PROCEED' &&
    route.now.some((c) => c.family === 'business_registration')
  ) {
    out.push({
      code: 'READY_WITH_KVK_NOW',
      message: 'READY_TO_PROCEED must not show KVK/business registration as a NOW prerequisite',
    });
  }

  return out;
}

export function assertNoPersonalRouteContradictions(
  route: Parameters<typeof findPersonalRouteContradictions>[0],
): void {
  const found = findPersonalRouteContradictions(route);
  if (found.length > 0) {
    throw new Error(found.map((c) => c.code).join(', '));
  }
}
