# =============================================================================
# Nexus Video Call Microservice - Multi-stage Dockerfile
# =============================================================================
# This Dockerfile builds the video call microservice with WebSocket support
# Uses multi-stage builds for optimal image size
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# -----------------------------------------------------------------------------
FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy all app package.json files (required for workspace resolution)
COPY apps/tickets-ms/package.json ./apps/tickets-ms/
COPY apps/video-call-ms/package.json ./apps/video-call-ms/

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Build
# -----------------------------------------------------------------------------
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/video-call-ms/node_modules ./apps/video-call-ms/node_modules

# Copy configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/video-call-ms ./apps/video-call-ms

WORKDIR /app/apps/video-call-ms

# Build the video call microservice
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 4: Production dependencies
# -----------------------------------------------------------------------------
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/tickets-ms/package.json ./apps/tickets-ms/
COPY apps/video-call-ms/package.json ./apps/video-call-ms/

# Install production dependencies, ignoring scripts to avoid husky errors
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# -----------------------------------------------------------------------------
# Stage 5: Production runtime
# -----------------------------------------------------------------------------
FROM node:22-slim AS production

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs

WORKDIR /app

# Copy the entire node_modules structure (preserving workspace symlinks)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/video-call-ms/node_modules ./apps/video-call-ms/node_modules

# Copy built application to the same workspace structure
COPY --from=build --chown=nestjs:nodejs /app/apps/video-call-ms/dist ./apps/video-call-ms/dist
COPY --from=build --chown=nestjs:nodejs /app/apps/video-call-ms/package.json ./apps/video-call-ms/package.json

# Copy static files if needed
COPY --from=build --chown=nestjs:nodejs /app/apps/video-call-ms/static ./apps/video-call-ms/static

# Set working directory to the app
WORKDIR /app/apps/video-call-ms

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/src/main.js"]
