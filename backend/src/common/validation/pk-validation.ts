export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_UPLOAD_MIME_TYPES = ['image/png', 'image/jpeg'];

export const EMAIL_MESSAGE = 'Email must be a valid email address.';
export const PHONE_MESSAGE =
  'Phone must be a valid Pakistan number, e.g. 0300-1234567 or 091-5619915.';
export const CNIC_MESSAGE = 'CNIC must be 13 digits, e.g. 12345-1234567-1.';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
export const PK_PHONE_REGEX =
  /^(?:(?:\+92|0092|92|0)?3\d{9}|(?:\+92|0092|92|0)?[1-9]\d{7,10})$/;
export const PK_CNIC_REGEX = /^(?:\d{13}|\d{5}-\d{7}-\d{1})$/;

export function normalizePhoneForValidation(value?: string) {
  const normalized = String(value || '').replace(/[\s()-]/g, '');
  return normalized || undefined;
}

export function emptyToUndefined(value: unknown) {
  return value === '' || value === null ? undefined : value;
}
