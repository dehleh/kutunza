# ── Stage 1: Build ──
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Vite bakes VITE_* env vars at build time, so we pass them as build args
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

COPY . .
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
