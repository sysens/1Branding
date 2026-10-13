# Build on the same Node as the runtime. Without a node binary, bun 1.4+ runs
# install scripts as "Node 26", so better-sqlite3 was compiled against Node 26
# headers and failed. With node on PATH, bun runs them with the real Node 24
# and native modules match the runner's ABI.
FROM node:24-alpine AS builder

# Pinned: a floating bun tag changed the build under us before.
COPY --from=oven/bun:1.4.3-alpine /usr/local/bin/bun /usr/local/bin/bun
RUN apk add --no-cache build-base python3 vips-dev
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build


# Node 20 reached end-of-life in April 2026; Strapi 5.52 supports Node 20-26.
FROM node:24-alpine AS runner

ENV NODE_ENV=production
RUN apk add --no-cache vips

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/favicon.png ./favicon.png
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/database/migrations ./database/migrations
COPY --from=builder /app/dist ./dist

# Runs as the unprivileged "node" user; only the folders Strapi may write to
# (local uploads when R2 is off, .tmp) belong to it.
RUN mkdir -p /app/public/uploads /app/.tmp && chown -R node:node /app/public /app/.tmp

# Custom Pluginlar uchun yoqib qo'yiladi 
COPY --from=builder /app/src ./src

USER node

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
