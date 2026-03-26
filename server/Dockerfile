FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
# Keep image lean and avoid shipping non-runtime binary artifacts.
RUN npm ci --ignore-scripts

FROM node:22-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
