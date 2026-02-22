/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GraphQL HTTP endpoint (e.g. https://api.example.com/graphql) */
  readonly VITE_GRAPHQL_HTTP_URL: string;
  /** GraphQL WebSocket endpoint (e.g. wss://api.example.com/graphql) */
  readonly VITE_GRAPHQL_WS_URL: string;
  /** Deployment domain (e.g. https://username.github.io/web-booking-e1) */
  readonly VITE_APP_DOMAIN: string;
  /** Base path for deployment (e.g. /web-booking-e1/ for GitHub Pages, / otherwise) */
  readonly VITE_BASE_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
