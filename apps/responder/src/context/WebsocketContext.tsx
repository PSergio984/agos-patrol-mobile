import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { useCoreHook } from "./CoreContext";

const websocketUrl = process.env.EXPO_PUBLIC_WS_URL;

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

type WebSocketMessage = { type: string; data: any };
type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface WSContextValue {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastMessageAt: Date | null;
  reconnect: () => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

const WSContext = createContext<WSContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const { responder } = useCoreHook();
  // Only the location id feeds the socket URL — depending on it (instead of
  // the whole responder object) keeps a profile save from tearing down the
  // connection.
  const locationId = responder?.locationId;

  // Track whether the component is mounted to prevent reconnect after unmount
  const mountedRef = useRef(true);
  // Track intentional close to prevent reconnect on unmount
  const intentionalCloseRef = useRef(false);
  // Backoff state for reconnect attempts
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => {});

  // Storage box that keeps track of event listeners for different message types
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = useCallback(() => {
    if (!locationId || !mountedRef.current) return;

    // Clean up existing connection — close silently without triggering reconnect
    if (socketRef.current) {
      const oldSocket = socketRef.current;
      socketRef.current = null;
      oldSocket.onclose = null;
      oldSocket.onerror = null;
      oldSocket.onmessage = null;
      oldSocket.close();
    }

    setConnectionStatus("connecting");

    const ws = new WebSocket(`${websocketUrl}/ws?location_id=${locationId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (__DEV__) console.log("WebSocket connected");
      setConnectionStatus("connected");
      retryCountRef.current = 0; // Reset backoff on successful connect
    };

    ws.onmessage = (e) => {
      try {
        const message: WebSocketMessage = JSON.parse(e.data);
        if (__DEV__) {
          // Camera frames carry ~800KB of base64 — never log payloads raw.
          const printable =
            typeof message.data === "object" &&
            message.data !== null &&
            "image" in message.data
              ? { ...message.data, image: "<frame omitted>" }
              : message.data;
          console.log("Message received: ", { ...message, data: printable });
        }
        setLastMessageAt(new Date());

        const callbacks = listenersRef.current.get(message.type);
        if (callbacks) {
          callbacks.forEach((callback) => callback(message.data));
        }
      } catch (error) {
        if (__DEV__) console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      if (__DEV__) console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");

      // Auto-reconnect with exponential backoff unless intentionally closed
      if (!intentionalCloseRef.current && mountedRef.current) {
        const delay = Math.min(
          BASE_BACKOFF_MS * 2 ** retryCountRef.current,
          MAX_BACKOFF_MS
        );
        if (__DEV__) console.log(`Reconnecting in ${delay}ms...`);
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          connectRef.current();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      if (__DEV__) console.error("WebSocket error:", error);
    };
  }, [locationId]);

  // Connect when responder is available
  useEffect(() => {
    mountedRef.current = true;
    // Clear the flag the cleanup of a previous effect run set — otherwise the
    // first onclose after any reconnect skips the backoff retry entirely.
    intentionalCloseRef.current = false;
    connectRef.current = connect;
    connect();

    return () => {
      mountedRef.current = false;
      intentionalCloseRef.current = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [connect]);

  // Reconnect when app returns to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" &&
        connectionStatus === "disconnected" &&
        mountedRef.current
      ) {
        intentionalCloseRef.current = false;
        retryCountRef.current = 0;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        connect();
      }
    });

    return () => subscription.remove();
  }, [connectionStatus, connect]);

  // Manual reconnect: reset backoff and connect immediately
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    connect();
  }, [connect]);

  const subscribe = useCallback(
    (type: string, callback: (data: any) => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }

      listenersRef.current.get(type)!.add(callback);

      return () => {
        const callbacks = listenersRef.current.get(type);
        if (callbacks) {
          callbacks.delete(callback);

          if (callbacks.size === 0) {
            listenersRef.current.delete(type);
          }
        }
      };
    },
    []
  );

  const isConnected = connectionStatus === "connected";

  const contextValue = useMemo(
    () => ({
      isConnected,
      connectionStatus,
      lastMessageAt,
      reconnect,
      subscribe,
    }),
    [isConnected, connectionStatus, lastMessageAt, reconnect, subscribe]
  );

  return (
    <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>
  );
}

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WSContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

// ===========================================
// Custom hook to listen for specific messages
// ===========================================
export function useWebSocketMessage<T = any>(
  messageType: string,
  onMessage: (data: T) => void
) {
  // Get subscribe function from context
  const { subscribe } = useWebSocket();

  // Wrap onMessage in a ref so it doesn't trigger re-subscription
  const callbackRef = useRef(onMessage);

  // Keeps the ref updated
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const unsubscribe = subscribe(messageType, (data) => {
      callbackRef.current(data); // Call the latest onMessage
    });

    return unsubscribe; // Cleanup function on unmount
  }, [messageType, subscribe]);
}
