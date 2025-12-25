// ID Generation Utility
// Generates unique IDs for various entities

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}${randomStr}`;
}

export function generateEmailId(): string {
  return generateId('eml');
}

export function generateThreadId(): string {
  return generateId('thr');
}

export function generateAttachmentId(): string {
  return generateId('att');
}

export function generateLabelId(): string {
  return generateId('lbl');
}

export function generateDraftId(): string {
  return generateId('drf');
}
