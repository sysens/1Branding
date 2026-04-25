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
- `UPLOAD_PROVIDER=r2`
- `R2_ACCESS_KEY_ID=...`
- `R2_SECRET_ACCESS_KEY=...`
- `R2_BUCKET=...`
- `R2_ACCOUNT_ID=...`
- `R2_PUBLIC_URL=https://media.example.com`

## Cloudflare R2

Bu loyiha media fayllarni Cloudflare R2 ga yuborish uchun tayyorlangan.

1. Cloudflare R2 ichida bucket yarating.
2. Bucket uchun `Object Read & Write` ruxsatli S3 API token yarating.
3. Bucket ga production uchun custom domain ulang. `r2.dev` faqat development uchun qulay.
4. `R2_PUBLIC_URL` sifatida shu custom domain ni bering.
5. Railway yoki server env larida `UPLOAD_PROVIDER=r2` ni yoqing.

Qo'shimcha env lar:

- `R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
- `R2_REGION=auto`
- `R2_ROOT_PATH=uploads`
- `R2_CACHE_CONTROL=public, max-age=31536000, immutable`
- `R2_SIGNED_URL_EXPIRES=900`

Eslatma:

- R2 S3-compatible, lekin ACL ga tayanmaydi. Public access bucket custom domain yoki `r2.dev` orqali boshqariladi.
- Media URL lar Telegram integratsiyasiga ham ketadi, shuning uchun `PUBLIC_BASE_URL` va `R2_PUBLIC_URL` to'g'ri bo'lishi shart.

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
UPLOAD_PROVIDER=r2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ACCOUNT_ID=...
R2_PUBLIC_URL=https://media.example.com
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
