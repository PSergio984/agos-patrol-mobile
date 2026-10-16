import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWebSocketMessage } from "./WebsocketContext";
import { useCoreHook } from "./CoreContext";
import { useResetOnSiteChange } from "../hooks/useResetOnSiteChange";
import { sensorAPI } from "../lib/api/sensor";
import type {
  SensorConfig,
  SensorData,
  SensorReadingSummaryResponse,
} from "../types/sensor";

interface WaterLevelContextValue {
  sensorData: SensorData | null;
  sensorConfig: SensorConfig | null;

  isFetching: boolean;
  isFetchingConfig: boolean;

  warning: string | null;
  error: string | null;
}

const WaterLevelContext = createContext<WaterLevelContextValue | undefined>(
  undefined
);

export function WaterLevelProvider({ children }: { children: ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [sensorConfig, setSensorConfig] = useState<SensorConfig | null>(null);

  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isFetchingConfig, setIsFetchingConfig] = useState<boolean>(true);

  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { effectiveLocationId } = useCoreHook();

  // Drop the previous site's reading/config on a site switch — the new site's
  // data arrives via the WS initial payload.
  useResetOnSiteChange(() => {
    setSensorData(null);
    setSensorConfig(null);
    setWarning(null);
    setError(null);
    setIsFetching(true);
  });

  // Fetch config data for the effective site (presence ?? home)
  useEffect(() => {
    if (!effectiveLocationId) {
      queueMicrotask(() => setIsFetchingConfig(false));
      return;
    }

    // Guard against a stale fetch from the previous site overwriting the new
    // site's config after a switch.
    let cancelled = false;
    const fetchSensorConfig = async () => {
      try {
        setIsFetchingConfig(true);
        const config =
          await sensorAPI.getSensorDeviceConfig(effectiveLocationId);
        if (!cancelled) setSensorConfig(config);
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Failed to fetch sensor configuration");
      } finally {
        if (!cancelled) setIsFetchingConfig(false);
      }
    };
    fetchSensorConfig();
    return () => {
      cancelled = true;
    };
  }, [effectiveLocationId]);

  // WebSocket message handler for sensor updates
  useWebSocketMessage("sensor_update", (data: SensorReadingSummaryResponse) => {
    setIsFetching(false);

    if (data.status == "error") {
      setError(data.message);
      setWarning(null);
      setSensorData(null);
      return;
    }

    if (data.status == "warning") {
      setWarning(data.message);
      setError(null);
      setSensorData(data.sensor_reading);
      return;
    }

    setError(null);
    setWarning(null);
    setSensorData(data.sensor_reading);
  });

  const contextValue = useMemo(
    () => ({
      sensorData,
      sensorConfig,
      isFetching,
      isFetchingConfig,
      warning,
      error,
    }),
    [sensorData, sensorConfig, isFetching, isFetchingConfig, warning, error]
  );

  return (
    <WaterLevelContext.Provider value={contextValue}>
      {children}
    </WaterLevelContext.Provider>
  );
}

export const useWaterLevel = () => {
  const context = useContext(WaterLevelContext);
  if (context === undefined) {
    throw new Error("useWaterLevel must be used within a WaterLevelProvider");
  }
  return context;
};
