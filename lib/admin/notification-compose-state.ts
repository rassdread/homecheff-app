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
}): ChosenRecipient[] {
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
      name: person?.name || 'Onbekende ontvanger',
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
      action: 'Vul een bericht in. Het veld Bericht is nog leeg.',
    };
  }
  if (!input.sendNotification && !input.sendEmail) {
    return {
      field: 'channel',
      refreshPreview: false,
      action: 'Kies in-appmelding en push, of e-mail. Zonder kanaal kan er niets worden verstuurd.',
    };
  }
  if (input.sendEmail && !input.subject.trim()) {
    return {
      field: 'subject',
      refreshPreview: false,
      action: 'Vul een onderwerp in. Het veld Onderwerp is verplicht voor e-mail.',
    };
  }
  if (input.recipientCount === 0) {
    return {
      field: 'recipients',
      refreshPreview: false,
      action: input.listable
        ? 'Vink iemand aan of voeg een beheerder toe. Filterresultaten gaan niet automatisch mee.'
        : 'Kies een filter of voeg een beheerder toe. Alle toepasselijke rollen zonder filter selecteert niemand.',
    };
  }
  if (!input.hasPreview || input.previewTotal === 0) {
    return {
      field: 'preview',
      refreshPreview: input.previewStale || input.previewTotal === 0,
      action: input.previewStale
        ? 'Het voorbeeld is verouderd. Klik op Voorbeeld vernieuwen. Tekst en ontvangers blijven staan.'
        : input.previewTotal === 0 && input.hasPreview
          ? 'Het voorbeeld bevat geen ontvangers. Pas de selectie aan en klik op Voorbeeld vernieuwen.'
          : 'Bekijk het voorbeeld. Verzenden blijft dicht tot het voorbeeld klopt met deze selectie.',
    };
  }
  if (input.emailConfirmRequired && !input.emailConfirmed) {
    return {
      field: 'email-confirm',
      refreshPreview: false,
      action: 'Vink de bevestiging voor e-mail aan. Daarna kun je dit voorbeeld verzenden.',
    };
  }
  return null;
}
