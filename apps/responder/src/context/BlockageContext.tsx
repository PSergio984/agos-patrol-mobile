import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  BlockageSummaryResponse,
  ObstructionConfidence,
  Status,
} from "../types/blockage";
import { capitalizeFirstLetter } from "../lib/utils/formatter";

import { useWebSocketMessage } from "./WebsocketContext";
import { useResetOnSiteChange } from "../hooks/useResetOnSiteChange";

interface WaterwayContextProps {
  status: Status | null;
  confidence: ObstructionConfidence | null;
  isFetching: boolean;
  warning: string | null;
  error: string | null;
}

const WaterwayContext = createContext<WaterwayContextProps | undefined>(
  undefined
);

export function BlockageProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [confidence, setConfidence] = useState<ObstructionConfidence | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Blockage status is site-scoped — clear it on a site switch so the old
  // site's state can't show under the new one while the channel re-resolves.
  useResetOnSiteChange(() => {
    setStatus(null);
    setConfidence(null);
    setWarning(null);
    setError(null);
    setIsFetching(true);
  });

  useWebSocketMessage(
    "blockage_detection_update",
    (data: BlockageSummaryResponse) => {
      setIsFetching(false);

      if (data.status === "error") {
        setError(data.message);
        setWarning(null);
        setStatus(null);
        setConfidence(null);
        return;
      }

      if (data.status === "warning") {
        setWarning(data.message);
        setError(null);
        setStatus(capitalizeFirstLetter(data.blockage_status) as Status);
        setConfidence(data.confidence ?? null);
        return;
      }

      setError(null);
      setWarning(null);
      setStatus(capitalizeFirstLetter(data.blockage_status) as Status);
      setConfidence(data.confidence ?? null);
    }
  );

  const contextValue = useMemo(
    () => ({
      status,
      confidence,
      isFetching,
      warning,
      error,
    }),
    [status, confidence, isFetching, warning, error]
  );

  return (
    <WaterwayContext.Provider value={contextValue}>
      {children}
    </WaterwayContext.Provider>
  );
}

export const useWaterwayContext = () => {
  const context = useContext(WaterwayContext);
  if (context === undefined) {
    throw new Error(
      "useWaterwayContext must be used within a BlockageProvider"
    );
  }
  return context;
};
