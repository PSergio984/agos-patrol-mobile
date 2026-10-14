/**
 * Single import surface for the shared contexts so feature components
 * keep PWA-style hook imports without repeating deep relative paths.
 */
export { useWaterLevel } from "../../context/WaterLevelContext";
export { useWaterwayContext } from "../../context/BlockageContext";
export { useFusionAnalysis } from "../../context/FusionAnalysisContext";
export { useWeather } from "../../context/WeatherContext";
export {
  useWebSocket,
  useWebSocketMessage,
} from "../../context/WebsocketContext";
export { useCoreHook } from "../../context/CoreContext";
export { useI18n } from "../../context/I18nContext";
