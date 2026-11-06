# =============================================================================
# QuantBot Pro - Production Dockerfile
# Multi-stage lightweight Node.js container
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies required for build)
RUN npm ci

# Copy all source code
COPY . .

# Build Vite frontend assets into /app/dist
RUN npm run build

# Prune devDependencies to keep image lean (or keep tsx for running server.ts)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install tsx globally or copy dependencies
COPY package*.json tsconfig.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built distribution assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["tsx", "server.ts"]
