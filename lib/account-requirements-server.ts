import { NextResponse } from 'next/server';
import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';
import { evaluateProfileRequirements } from '@/lib/account/evaluate-profile-requirements';
import { serializeRequirementNotice } from '@/lib/account/profile-requirement-notice';

export function accountRequirementsMissingResponse(
  user: AccountRequirementsUserInput | null | undefined,
  action: AccountRequirementsAction
): NextResponse {
  const snap = getAccountRequirements(user ?? null);
  const missing = missingRequirementsForAction(action, snap.missing);
  const evaluated = evaluateProfileRequirements({ user: user ?? null, action });
  const notice = serializeRequirementNotice(evaluated.notice);
  const needsEmail = missing.some((m) => m.key === 'emailVerified');
  const hintKey = (() => {
    if (action === 'sendMessage') {
      return needsEmail ? 'sendMessage_email' : 'sendMessage_profile';
    }
    if (action === 'postItem') {
      return needsEmail ? 'postItem_email' : 'postItem_profile';
    }
    if (action === 'sell') {
      return needsEmail ? 'sell_email' : 'sell_profile';
    }
    return undefined;
  })();
  return NextResponse.json(
    {
      error: 'ACCOUNT_REQUIREMENTS_MISSING',
      action,
      missing,
      hintKey,
      isComplete: false,
      blockingRequirements: evaluated.blockingRequirements,
      recommendedRequirements: [],
      notice,
      targetRoute: evaluated.targetRoute,
    },
    { status: 403 }
  );
}

export function assertAccountRequirementsOr403(
  user: AccountRequirementsUserInput | null | undefined,
  action: AccountRequirementsAction
): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const snap = getAccountRequirements(user);
  const ok =
    action === 'sendMessage'
      ? snap.canSendMessage
      : action === 'postItem'
        ? snap.canPostItem
        : snap.canSell;
  if (ok) return null;
  return accountRequirementsMissingResponse(user, action);
}
