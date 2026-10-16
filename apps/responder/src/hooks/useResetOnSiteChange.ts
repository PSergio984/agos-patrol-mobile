import { useEffect, useRef } from "react";
import { useCoreHook } from "../context/CoreContext";

// Runs `reset` only when the responder's effective site actually changes —
// not on mount and not on unrelated responder-object refreshes. Site-scoped
// state (sensor snapshots, weather, frames, alert lists) must be dropped on a
// switch so the old site's data can't linger under the new site.
export function useResetOnSiteChange(reset: () => void) {
  const { effectiveLocationId } = useCoreHook();
  const prevSiteRef = useRef(effectiveLocationId);
  const resetRef = useRef(reset);

  useEffect(() => {
    resetRef.current = reset;
  });

  useEffect(() => {
    if (prevSiteRef.current === effectiveLocationId) return;
    prevSiteRef.current = effectiveLocationId;
    resetRef.current();
  }, [effectiveLocationId]);
}
