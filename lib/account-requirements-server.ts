import { NextResponse } from 'next/server';
import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';

export function accountRequirementsMissingResponse(
  user: AccountRequirementsUserInput | null | undefined,
  action: AccountRequirementsAction
): NextResponse {
  const snap = getAccountRequirements(user ?? null);
  return NextResponse.json(
    {
      error: 'ACCOUNT_REQUIREMENTS_MISSING',
      missing: missingRequirementsForAction(action, snap.missing),
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
