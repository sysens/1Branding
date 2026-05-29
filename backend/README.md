# OneBranding Backend

## Local ishga tushirish

```bash
bun install
bun run dev
```

Production build:

```bash
bun run build
bun run start
```

## Muhit o'zgaruvchilari

Namuna konfiguratsiya [`.env.example`](./.env.example) ichida bor.

Asosiy production env lar:

- `HOST=0.0.0.0`
- `PORT=1337`
- `PUBLIC_BASE_URL=https://api.example.com`
- `DATABASE_CLIENT=postgres`
- `DATABASE_URL=postgresql://...`
- `UPLOAD_PROVIDER=local`
- `UPLOAD_MAX_FILE_SIZE_MB=128`

## Server Uploads

Media fayllar Strapi serverining o'zidan `/uploads` orqali beriladi. Productionda media fayllar yo'qolmasligi uchun serverda doimiy disk yoki Railway volume ulang.

Eslatma:

- Media URL lar Telegram integratsiyasiga ham ketadi, shuning uchun `PUBLIC_BASE_URL` to'g'ri bo'lishi shart.

## Railway

Tavsiya etilgan production konfiguratsiya:

1. `backend` service
2. `frontend` service
3. `PostgreSQL` service

Backend uchun minimal env:

```env
HOST=0.0.0.0
PORT=1337
IS_PROXIED=true
PUBLIC_BASE_URL=https://<backend-domain>
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
UPLOAD_PROVIDER=local
UPLOAD_MAX_FILE_SIZE_MB=128
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
