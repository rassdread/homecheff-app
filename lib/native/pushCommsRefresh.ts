import { nativePushDevLog } from '@/lib/native/push';
import { reportAppDiagnostic } from '@/lib/diagnostics/appDiagnostics';

/**
 * Refresh message unread badges after native push receive/tap.
 * CommsUnreadProvider listens to `unreadCountUpdate` without detail → refetch.
 */
export function refreshCommsAfterNativePush(reason: 'received' | 'opened' | 'resume'): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('unreadCountUpdate'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch {
    /* ignore */
  }
  nativePushDevLog('comms unread refresh', reason);
  reportAppDiagnostic(
    reason === 'opened' ? 'push_opened' : 'push_received',
    { reason },
  );
}
