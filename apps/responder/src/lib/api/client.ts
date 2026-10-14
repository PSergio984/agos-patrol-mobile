import axios, { type InternalAxiosRequestConfig } from "axios";
import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";

let isRedirecting = false;

// SecureStore is async, but axios interceptors are sync — so the responder
// token is mirrored in this module-level cache. src/lib/storage.ts keeps it
// in sync on every setResponderToken()/clearResponderSession(), and the root
// layout hydrates it at startup via getResponderToken().
let cachedToken: string | null = null;

export function setCachedToken(token: string | null) {
  cachedToken = token;
}

// Called once on a 401 while authenticated. The root layout registers a
// handler that clears the responder session and routes to /verify — kept as
// a callback so this module stays free of expo-router/storage imports.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type ConfigWithSkip = InternalAxiosRequestConfig & {
  skipKeyConversion?: boolean;
  skipResponseKeyConversion?: boolean;
};

const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to convert camelCase to snake_case and inject auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject responder auth token
    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }

    const skipConversion = (config as ConfigWithSkip).skipKeyConversion;
    if (skipConversion) return config;

    // 🔁 Convert camelCase → snake_case (request body)
    if (config.data && typeof config.data === "object") {
      config.data = snakecaseKeys(config.data, { deep: true });
    }

    // 🔁 Convert camelCase → snake_case (query params)
    if (config.params && typeof config.params === "object") {
      config.params = snakecaseKeys(config.params, { deep: true });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to convert snake_case to camelCase and handle 401
apiClient.interceptors.response.use(
  (response) => {
    const skipConversion = (response.config as ConfigWithSkip)
      .skipResponseKeyConversion;
    if (skipConversion) {
      return response;
    }

    if (response.data && typeof response.data === "object") {
      response.data = camelcaseKeys(response.data, { deep: true });
    }

    return response;
  },
  (error) => {
    // Handle 401 — token expired or invalid, force re-verification
    if (error?.response?.status === 401) {
      // Only redirect if we had a token (avoid redirect loops on pre-auth endpoints)
      if (cachedToken) {
        if (isRedirecting) return Promise.reject(error);
        isRedirecting = true;
        onUnauthorized?.();
        return Promise.reject(error);
      }
    }

    const skipConversion = (error?.config as ConfigWithSkip | undefined)
      ?.skipResponseKeyConversion;

    if (
      !skipConversion &&
      error?.response?.data &&
      typeof error.response.data === "object"
    ) {
      error.response.data = camelcaseKeys(error.response.data, {
        deep: true,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
