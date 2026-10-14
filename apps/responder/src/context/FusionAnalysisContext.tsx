import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  FusionAnalysisData,
  FusionAnalysisSummaryResponse,
} from "../types/fusionAnalysis";

import { useWebSocketMessage } from "./WebsocketContext";

interface FusionAnalysisContextValue {
  fusionAnalysis: FusionAnalysisData | null;
  isFetching: boolean;
  warning: string | null;
  error: string | null;
}

const FusionAnalysisContext = createContext<
  FusionAnalysisContextValue | undefined
>(undefined);

export function FusionAnalysisProvider({ children }: { children: ReactNode }) {
  const [fusionAnalysis, setFusionAnalysis] =
    useState<FusionAnalysisData | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useWebSocketMessage(
    "fusion_analysis_update",
    (data: FusionAnalysisSummaryResponse) => {
      setIsFetching(false);

      if (data.status == "error") {
        setError(data.message);
        return;
      }

      if (data.status == "warning") {
        setWarning(data.message);
        setError(null);
        setFusionAnalysis(data.fusion_analysis);
        return;
      }

      setError(null);
      setWarning(null);
      setFusionAnalysis(data.fusion_analysis);
    }
  );

  const contextValue = useMemo(
    () => ({ fusionAnalysis, isFetching, warning, error }),
    [fusionAnalysis, isFetching, warning, error]
  );

  return (
    <FusionAnalysisContext.Provider value={contextValue}>
      {children}
    </FusionAnalysisContext.Provider>
  );
}

export const useFusionAnalysis = () => {
  const context = useContext(FusionAnalysisContext);
  if (context === undefined) {
    throw new Error(
      "useFusionAnalysis must be used within a FusionAnalysisProvider"
    );
  }
  return context;
};
