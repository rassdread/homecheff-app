/**
 * Compare extra-result presets against one frozen baseline.
 * Accuracy over completeness: omit the table when net extra is UNKNOWN.
 */

import { runCalculator } from '../calculator/engine';
import {
  SCENARIO_PRESET_EUROS,
  scenarioPresetToCents,
  type ScenarioPresetEuro,
} from '../domain/money';
import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import { wizardStateToCalculatorInput } from './to-calculator-input';
import type { WizardState } from './schema';

export type ScenarioComparisonRow = {
  euro: ScenarioPresetEuro;
  extraResultCents: number;
  netExtraCents: CentsOrUnknown;
  monthlyApproxCents: CentsOrUnknown;
  comparable: boolean;
};

export function compareScenarioPresets(state: WizardState): ScenarioComparisonRow[] | null {
  const base = wizardStateToCalculatorInput(state);
  if (!base) return null;

  const rows: ScenarioComparisonRow[] = [];
  for (const euro of SCENARIO_PRESET_EUROS) {
    const result = runCalculator({
      ...base,
      scenarioAdditionalResultCents: scenarioPresetToCents(euro),
    });
    const net = result.status === 'READY' ? result.netExtraCents : UNKNOWN;
    const month = result.status === 'READY' ? result.netExtraPerMonthCents : UNKNOWN;
    const comparable =
      result.status === 'READY' &&
      result.netExtraIsDefinitive === true &&
      !isUnknown(net);
    rows.push({
      euro,
      extraResultCents: scenarioPresetToCents(euro),
      netExtraCents: net,
      monthlyApproxCents: month,
      comparable,
    });
  }

  if (rows.filter((row) => row.comparable).length < 2) return null;
  return rows;
}
