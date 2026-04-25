# OneBranding Frontend

## Local ishga tushirish

`.env` fayli tayyor va default holatda lokal backendga ulanadi:

```env
NUXT_PUBLIC_GRAPHQL_URL=http://127.0.0.1:1337/graphql
```

Frontendni ishga tushirish:

```bash
bun install
bun run dev
```

## Production build

```bash
bun run build
bun run start
```

## Portlar

- Frontend dev/start: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:1337`

## Eslatma

- Frontend `bun run dev`, `bun run build` va `bun run start` buyruqlari `.env` ni avtomatik o'qiydi.
- Agar backend Railway yoki boshqa domen ustida ishlasa, `NUXT_PUBLIC_GRAPHQL_URL` ni shu GraphQL endpointga almashtirasiz.
