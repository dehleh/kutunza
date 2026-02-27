# Kutunza Backend — Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Non-root user
RUN addgroup -g 1001 -S kutunza && \
    adduser -S kutunza -u 1001
USER kutunza

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "--unhandled-rejections=throw", "server.js"]
