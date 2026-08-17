import {
  isTrustedStudioHandoffAction,
  studioItemHandoffAction,
} from '@/lib/studio/px4a-item-handoff';

export async function startHomeCheffPhotoVideoCreator(photoUrls: string[]): Promise<void> {
  const res = await fetch('/api/studio/px4a-item-handoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrls }),
  });
  if (!res.ok) {
    throw new Error('handoff');
  }
  const data = (await res.json()) as { action?: string; token?: string };
  const action = String(data.action ?? '');
  const token = String(data.token ?? '');
  if (!token || !isTrustedStudioHandoffAction(action)) {
    throw new Error('handoff');
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.acceptCharset = 'UTF-8';
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token';
  input.value = token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export { studioItemHandoffAction };
