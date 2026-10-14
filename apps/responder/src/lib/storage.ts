import * as SecureStore from "expo-secure-store";
import { setCachedToken } from "./api/client";

// SecureStore keys are limited to [A-Za-z0-9._-] — same names as the PWA's
// localStorage keys where possible.
const RESPONDER_TOKEN_KEY = "responderToken";
const RESPONDER_ID_KEY = "responderId";

// ── Generic SecureStore helpers (theme, locale, queues, etc.) ────────────────

export async function getStoredValue(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setStoredValue(
  key: string,
  value: string
): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeStoredValue(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

// ── Responder session ────────────────────────────────────────────────────────

export async function getResponderToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(RESPONDER_TOKEN_KEY);
  // Keep the sync cache used by the axios interceptor warm on read.
  setCachedToken(token);
  return token;
}

export async function setResponderToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(RESPONDER_TOKEN_KEY, token);
  setCachedToken(token);
}

export async function getResponderId(): Promise<string | null> {
  return SecureStore.getItemAsync(RESPONDER_ID_KEY);
}

export async function setResponderId(id: string): Promise<void> {
  await SecureStore.setItemAsync(RESPONDER_ID_KEY, id);
}

export async function clearResponderSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(RESPONDER_ID_KEY),
    SecureStore.deleteItemAsync(RESPONDER_TOKEN_KEY),
  ]);
  setCachedToken(null);
}
