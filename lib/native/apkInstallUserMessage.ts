import type { ApkInstallFailureKind } from '@/lib/native/androidApkUpdateInstall';

type TFn = (key: string) => string;

/** User-facing install error (no tokens / paths). */
export function apkInstallUserMessage(
  kind: ApkInstallFailureKind,
  t: TFn,
  rawMessage?: string,
): string {
  switch (kind) {
    case 'package_mismatch':
      return t('appUpdateGate.errorPackageMismatch');
    case 'signature_mismatch':
      return t('appUpdateGate.errorSignatureMismatch');
    case 'unknown_sources':
      return t('appUpdateGate.unknownSourcesBody');
    case 'download_timeout':
      return t('appUpdateGate.downloadStalled');
    case 'network':
      return t('appUpdateGate.downloadStalled');
    case 'no_handler':
      return t('appUpdateGate.errorBodyNoCache');
    default:
      return rawMessage?.trim() || t('appUpdateGate.errorBodyNoCache');
  }
}
