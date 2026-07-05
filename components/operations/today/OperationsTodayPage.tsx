'use client';

import OperationsShell from '@/components/operations/OperationsShell';
import OperationsTodayContent from '@/components/operations/today/OperationsTodayContent';
import { useTranslation } from '@/hooks/useTranslation';

export default function OperationsTodayPage() {
  const { t } = useTranslation();

  return (
    <OperationsShell
      breadcrumbLabel={t('operations.tabs.today')}
      contentClassName="py-4 sm:py-6"
    >
      <OperationsTodayContent />
    </OperationsShell>
  );
}
