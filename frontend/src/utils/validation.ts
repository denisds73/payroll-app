/**
 * Shared validation constants and helpers used across all forms.
 * These mirror the backend DTO constraints so both layers enforce the same rules.
 */

export const VALIDATION = {
  name: {
    maxLength: 100,
    message: 'Name must be at most 100 characters',
  },
  phone: {
    pattern: /^\d{10}$/,
    message: 'Phone number must be exactly 10 digits',
  },
  wage: {
    min: 1,
    max: 100_000,
    messageMin: 'Daily wage must be at least ₹1',
    messageMax: 'Daily wage must be at most ₹1,00,000',
  },
  otRate: {
    min: 0,
    max: 100_000,
    messageMin: 'OT rate cannot be negative',
    messageMax: 'OT rate must be at most ₹1,00,000',
  },
  amount: {
    min: 1,
    max: 10_000_000,
    messageMin: 'Amount must be greater than 0',
    messageMax: 'Amount must be at most ₹1,00,00,000',
  },
  textField: {
    maxLength: 500,
    message: (field: string) => `${field} must be at most 500 characters`,
  },
} as const;

/**
 * Strip non-digit characters from a phone number string.
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Validate a phone number (must be exactly 10 digits after stripping non-digits).
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return null; // phone is optional
  const digits = sanitizePhone(phone);
  if (!VALIDATION.phone.pattern.test(digits)) {
    return VALIDATION.phone.message;
  }
  return null;
}

/**
 * Validate a numeric value against min/max bounds.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  minMessage: string,
  maxMessage: string,
): string | null {
  if (Number.isNaN(value)) return minMessage;
  if (value < min) return minMessage;
  if (value > max) return maxMessage;
  return null;
}
