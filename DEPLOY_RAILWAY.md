# Railway deploy guide

## Arxitektura

Bu repo isolated monorepo:

- `/backend` - Strapi 5 backend
- `/frontend` - Nuxt 4 frontend

Railway ichida bitta project ichida 3 ta service kerak:

1. `frontend`
2. `backend`
3. `Postgres`

Media fayllar uchun alohida Railway volume kerak emas, chunki backend Cloudflare R2 bilan ishlaydi.

## Railway ichida qaysi variantni tanlash kerak

Yangi project yaratishda eng to'g'ri boshlanish:

1. `GitHub Repository` ni tanlang
2. reponi ulang
3. avval birinchi service yaratilgach, keyin loyiha ichida yana `+ Create` orqali:
   - ikkinchi GitHub service
   - `Database -> PostgreSQL`

Muqobil yo'l:

1. `Empty Project` ni tanlang
2. keyin `+ Create -> GitHub Repo` orqali `frontend`
3. yana `+ Create -> GitHub Repo` orqali `backend`
4. yana `+ Create -> Database -> PostgreSQL`

Amalda ikkalasi ham ishlaydi. Bu repo uchun `Empty Project` bilan boshlash boshqarish jihatidan qulayroq.

## Root directory

Service sozlamalarida root directory larni alohida qo'ying:

- `frontend` service: `/frontend`
- `backend` service: `/backend`

Har ikkala papkada ham `Dockerfile` bor, Railway shu Dockerfile lardan foydalanadi.

## Backend env

Namuna: [`backend/.env.railway.example`](./backend/.env.railway.example)

Majburiy minimum:

```env
HOST=0.0.0.0
PORT=1337
IS_PROXIED=true
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
PUBLIC_BASE_URL=https://api.example.com
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_POOL_MIN=0
UPLOAD_PROVIDER=r2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ACCOUNT_ID=...
R2_PUBLIC_URL=https://media.example.com
```

## Frontend env

Namuna: [`frontend/.env.railway.example`](./frontend/.env.railway.example)

```env
NUXT_PUBLIC_GRAPHQL_URL=https://api.example.com/graphql
```

## Tavsiya etilgan domainlar

- `frontend`: `onebranding.uz`
- `backend`: `api.onebranding.uz`
- `media`: `media.onebranding.uz`

## Deploy tartibi

1. `Postgres` service yarating.
2. `backend` service yarating va `/backend` root directory qo'ying.
3. `backend` env larni kiriting.
4. `backend` uchun Railway domain generatsiya qiling.
5. Strapi adminga kirib birinchi admin user yarating.
6. Cloudflare R2 bucket va token yarating.
7. `backend` ga R2 env larni kiriting va redeploy qiling.
8. `frontend` service yarating va `/frontend` root directory qo'ying.
9. `frontend` ga `NUXT_PUBLIC_GRAPHQL_URL` kiriting.
10. `frontend` uchun domain generatsiya qiling.
11. Railway custom domain larini Cloudflare DNS ga ulang.

## Cloudflare R2

1. Cloudflare dashboard -> R2 -> bucket yarating.
2. `Object Read & Write` token yarating.
3. Bucket Settings -> Custom Domains -> `media.example.com` ulang.
4. `R2_PUBLIC_URL=https://media.example.com` qiling.

## Muhim izohlar

- Postgres uchun `pg` package kerak, package.json ga qo'shildi.
- Strapi Docker ichida ishlagani uchun `DATABASE_POOL_MIN=0` tavsiya etiladi.
- Frontend browserdan backendga ulanadi, shuning uchun `NUXT_PUBLIC_GRAPHQL_URL` public backend domain bo'lishi kerak.
- Telegramga yuboriladigan media linklar `PUBLIC_BASE_URL` va R2 public URL to'g'ri bo'lishiga bog'liq.
