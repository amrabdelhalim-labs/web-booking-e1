/**
 * Application Configuration & Constants
 * 
 * Central location for app-wide configuration values,
 * including API URLs, domain info, and other constants.
 */

/**
 * Base domain for the application
 * Used for deployment configuration and metadata
 * 
 * DEFAULT: GitHub Pages repo URL
 * Set via VITE_APP_DOMAIN environment variable
 */
export const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 
  "https://amrabdelhalim-labs.github.io/web-booking-e1";

/**
 * Base path for GitHub Pages deployment
 * Must match repository name
 */
export const APP_BASE_PATH = "/web-booking-e1";

/**
 * Application name
 */
export const APP_NAME = "Event Booking";

/**
 * GraphQL URLs
 */
export const GRAPHQL_HTTP_URL =
  import.meta.env.VITE_GRAPHQL_HTTP_URL || "http://localhost:4000/graphql";

const deriveWsUrl = (httpUrl: string): string =>
  httpUrl.replace(/^https?:\/\//, (match) =>
    match === "https://" ? "wss://" : "ws://"
  );

const normalizeWsUrl = (wsUrl: string): string => {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return wsUrl.replace(/^ws:\/\//, "wss://");
  }
  return wsUrl;
};

const rawWsUrl =
  import.meta.env.VITE_GRAPHQL_WS_URL || deriveWsUrl(GRAPHQL_HTTP_URL);

export const GRAPHQL_WS_URL = normalizeWsUrl(rawWsUrl);
