FROM oven/bun:1-alpine AS builder

RUN apk add --no-cache build-base python3 vips-dev
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN bun run build


FROM node:20-alpine3.21 AS runner

ENV NODE_ENV=production
RUN apk add --no-cache vips

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/favicon.png ./favicon.png
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/dist ./dist

# Custom Pluginlar uchun yoqib qo'yiladi 
COPY --from=builder /app/src ./src

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
