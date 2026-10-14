import type { Dispatch, SetStateAction } from "react";

// Vendored verbatim from PWA src/lib/utils/phone.ts — the shared foundation's
// src/lib/utils/ does not include phone helpers, so the verify feature keeps
// its own copy. Pure string functions, no DOM/browser dependencies.

export const removeNonDigits = (input: string): string => {
  return input.replace(/\D/g, "");
};

export const determinePhoneMaxLength = (digitsOnly: string): number => {
  let maxLength;
  if (digitsOnly.startsWith("63")) {
    maxLength = 12; // 639XXXXXXXXX (12 digits)
  } else if (digitsOnly.startsWith("0")) {
    maxLength = 11; // 09XXXXXXXXX (11 digits)
  } else if (digitsOnly.startsWith("9")) {
    maxLength = 10; // 9XXXXXXXXX (10 digits)
  } else {
    maxLength = 10; // Default to longest possible
  }
  return maxLength;
};

export const normalizePhoneNumber = (input: string): string => {
  const digitsOnly = removeNonDigits(input);

  if (!digitsOnly) {
    return "";
  }

  if (digitsOnly.startsWith("63")) {
    return `+${digitsOnly.slice(0, 12)}`;
  }

  if (digitsOnly.startsWith("0")) {
    return `+63${digitsOnly.slice(1, 11)}`;
  }

  return `+63${digitsOnly.slice(0, 10)}`;
};

export const normalizeNumberInput = (
  input: string,
  setPhoneNumber: Dispatch<SetStateAction<string>>,
  setNormalizedPhoneNumber: Dispatch<SetStateAction<string>>
) => {
  // Remove all non-digits
  const digitsOnly = removeNonDigits(input);

  // Determine max length based on what user is typing
  const maxLength = determinePhoneMaxLength(digitsOnly);

  // Only update if within limit
  if (digitsOnly.length <= maxLength) {
    setPhoneNumber(digitsOnly);
    setNormalizedPhoneNumber(normalizePhoneNumber(digitsOnly));
  }
};

/** Formats the local part (after +63) for input display: "912 345 6789" */
export const formatPhoneInputDisplay = (digitsOnly: string): string => {
  const local = digitsOnly.startsWith("63")
    ? digitsOnly.slice(2, 12)
    : digitsOnly.startsWith("0")
      ? digitsOnly.slice(1, 11)
      : digitsOnly.slice(0, 10);
  const first = local.slice(0, 3);
  const second = local.slice(3, 6);
  const third = local.slice(6, 10);
  return [first, second, third].filter(Boolean).join(" ");
};

// NOTE: unlike lib/utils/formatter's formatPHNumber (strict regex re-spacing of
// an already-normalized "+63XXXXXXXXXX"), this strips non-digits first and
// renders partial input — used live while typing and on normalized numbers.
export const formatPHNumber = (input: string): string => {
  const digitsOnly = removeNonDigits(input);

  if (!digitsOnly.startsWith("63")) {
    return input;
  }

  const local = digitsOnly.slice(2);
  const first = local.slice(0, 3);
  const second = local.slice(3, 6);
  const third = local.slice(6, 10);
  const grouped = [first, second, third].filter(Boolean).join(" ");

  if (!grouped) {
    return "+63";
  }

  return `+63 ${grouped}`;
};
