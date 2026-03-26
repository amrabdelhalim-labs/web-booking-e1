FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
# Keep build deterministic and avoid optional heavy binary downloads.
RUN CYPRESS_INSTALL_BINARY=0 npm ci

COPY . .

ARG VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
ARG VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
ARG VITE_APP_DOMAIN=http://localhost:8080
ARG VITE_BASE_PATH=/

ENV VITE_GRAPHQL_HTTP_URL=$VITE_GRAPHQL_HTTP_URL
ENV VITE_GRAPHQL_WS_URL=$VITE_GRAPHQL_WS_URL
ENV VITE_APP_DOMAIN=$VITE_APP_DOMAIN
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
