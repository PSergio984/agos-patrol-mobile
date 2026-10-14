import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { ResponderVerifyRequest } from "../../../types/verify";

/**
 * Port of PWA src/pages/Verify/context/VerifyPageContext.tsx.
 *
 * The PWA mounts <VerifyPageProvider> above the /verify routes in the router.
 * Here app/(auth)/_layout.tsx is owned by the shared foundation and mounts a
 * bare <Stack>, and verify.tsx / otp.tsx are sibling routes — no file inside
 * this feature can host a real context provider above both screens.
 *
 * So the state lives in a module-level store and `useVerify` subscribes to
 * it via useSyncExternalStore. Same API surface as the PWA:
 * { responderDetails, setResponderDetails }.
 */
let responderDetails: ResponderVerifyRequest | null = null;
const listeners = new Set<() => void>();

const setResponderDetails = (details: ResponderVerifyRequest | null) => {
  responderDetails = details;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useVerify = () => {
  const details = useSyncExternalStore(subscribe, () => responderDetails);
  return { responderDetails: details, setResponderDetails };
};

/**
 * Kept for drop-in parity with the PWA module surface. With the module store
 * it is a passthrough — state is shared whether or not a provider is mounted.
 */
export function VerifyPageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
