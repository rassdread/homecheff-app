import { uiCopy, type UiLanguage } from '@/lib/admin/notification-copy';

export type ChosenRecipient = {
  id: string;
  name: string;
  email: string | null;
  fromAudience: boolean;
  manual: boolean;
};

export type SendBlockField = 'message' | 'channel' | 'subject' | 'recipients' | 'preview' | 'email-confirm';

export type SendBlock = {
  field: SendBlockField;
  action: string;
  refreshPreview: boolean;
};

type DirectoryPerson = { id: string; name: string; email: string | null };
type ManualPerson = { id: string; name: string; email: string | null };

/** One row per person. A checked filter result and a manually added admin stay one person. */
export function chosenRecipients(input: {
  selectedIds: readonly string[];
  directory: readonly DirectoryPerson[];
  manual: readonly ManualPerson[];
}, lang: UiLanguage = 'nl'): ChosenRecipient[] {
  const directoryById = new Map(input.directory.map((person) => [person.id, person]));
  const manualById = new Map(input.manual.map((person) => [person.id, person]));
  const order = [...input.selectedIds, ...input.manual.map((person) => person.id)];
  const seen = new Set<string>();
  const rows: ChosenRecipient[] = [];
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const fromDirectory = directoryById.get(id);
    const manual = manualById.get(id);
    if (!fromDirectory && !manual && !input.selectedIds.includes(id)) continue;
    const person = fromDirectory || manual;
    rows.push({
      id,
      name: person?.name || uiCopy(lang, 'admin.notificationCenter.ui.unknownRecipient'),
      email: person?.email ?? null,
      fromAudience: input.selectedIds.includes(id) && Boolean(fromDirectory),
      manual: Boolean(manual),
    });
  }
  return rows;
}

export function sendBlockReason(input: {
  message: string;
  sendNotification: boolean;
  sendEmail: boolean;
  subject: string;
  recipientCount: number;
  listable: boolean;
  hasPreview: boolean;
  previewTotal: number;
  previewStale: boolean;
  emailConfirmRequired: boolean;
  emailConfirmed: boolean;
}): SendBlock | null {
  if (!input.message.trim()) {
    return {
      field: 'message',
      refreshPreview: false,
      action: 'admin.notificationCenter.ui.blockEmptyMessage',
    };
  }
  if (!input.sendNotification && !input.sendEmail) {
    return {
      field: 'channel',
      refreshPreview: false,
      action: 'admin.notificationCenter.ui.blockChannel',
    };
  }
  if (input.sendEmail && !input.subject.trim()) {
    return {
      field: 'subject',
      refreshPreview: false,
      action: 'admin.notificationCenter.ui.blockSubject',
    };
  }
  if (input.recipientCount === 0) {
    return {
      field: 'recipients',
      refreshPreview: false,
      action: input.listable
        ? 'admin.notificationCenter.ui.blockRecipientsList'
        : 'admin.notificationCenter.ui.blockRecipientsFilter',
    };
  }
  if (!input.hasPreview || input.previewTotal === 0) {
    return {
      field: 'preview',
      refreshPreview: input.previewStale || input.previewTotal === 0,
      action: input.previewStale
        ? 'admin.notificationCenter.ui.blockStale'
        : input.previewTotal === 0 && input.hasPreview
          ? 'admin.notificationCenter.ui.blockEmptyPreview'
          : 'admin.notificationCenter.ui.blockNeedPreview',
    };
  }
  if (input.emailConfirmRequired && !input.emailConfirmed) {
    return {
      field: 'email-confirm',
      refreshPreview: false,
      action: 'admin.notificationCenter.ui.blockEmailConfirm',
    };
  }
  return null;
}
