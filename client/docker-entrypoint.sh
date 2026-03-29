#!/bin/sh
set -e
# Runtime Vite config: container env overrides image defaults (from build ARGs).
export VITE_GRAPHQL_HTTP_URL="${VITE_GRAPHQL_HTTP_URL:-$DEFAULT_VITE_GRAPHQL_HTTP_URL}"
export VITE_GRAPHQL_WS_URL="${VITE_GRAPHQL_WS_URL:-$DEFAULT_VITE_GRAPHQL_WS_URL}"
export VITE_APP_DOMAIN="${VITE_APP_DOMAIN:-$DEFAULT_VITE_APP_DOMAIN}"
export VITE_BASE_PATH="${VITE_BASE_PATH:-$DEFAULT_VITE_BASE_PATH}"

export NODE_ENV=production

cd /app
echo "Vite build: VITE_GRAPHQL_HTTP_URL=${VITE_GRAPHQL_HTTP_URL}"
npm run build

rm -rf /usr/share/nginx/html/*
cp -a dist/. /usr/share/nginx/html/
chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx 2>/dev/null || true

exec nginx -g 'daemon off;'
