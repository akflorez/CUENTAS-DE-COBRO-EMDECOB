# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    openssl

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy_db" npx prisma generate
RUN npm run build

# Stage 3: Production server
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies for native modules
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libfontconfig1 \
    fonts-dejavu-core \
    openssl \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV HOME=/tmp

CMD ["npm", "run", "start"]
