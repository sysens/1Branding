# OneBranding — loyiha saytlari (subdomenlar)

Mijoz loyihalari uchun alohida saytlar: `ertex.onebrandingworld.com` va
keyingilari. Bitta Nuxt 4 + Tailwind ilova hammasini xizmat qiladi va saytni
so'rovning **host**i bo'yicha tanlaydi. Asosiy sayt (`../frontend`) va
`/projects` sahifasi bunga aloqador emas.

## Qanday ishlaydi

| Host | `/` | `/<slug>` |
|---|---|---|
| saytning o'z hosti (`ertex.onebrandingworld.com`) | shu sayt | 404 |
| `<slug>.localhost:3001` (dev) | shu sayt | 404 |
| boshqa host (`localhost`, `*.up.railway.app`) | saytlar ro'yxati | sayt preview'i |

- Ro'yxat: [`shared/sites.ts`](shared/sites.ts) — slug, nom, hostlar, indekslash.
- Routing: [`app/router.options.ts`](app/router.options.ts) — sayt hostida
  `app/pages/<slug>/` sahifalari ildizga ko'chadi, boshqa sahifalar yo'q bo'ladi.
- SEO: faqat saytning o'z hostida (va `index: true` bo'lsa) indekslanadi; boshqa
  hostlarda `X-Robots-Tag: noindex` va `robots.txt` da `Disallow: /`
  ([`server/middleware/site.ts`](server/middleware/site.ts)). Canonical va OG
  manzillari doim saytning birinchi hostiga qaraydi.

## Papka tuzilishi (bitta sayt = bitta papka)

```
app/pages/ertex/index.vue        sayt sahifasi (sarlavha, meta, bo'limlar tartibi)
app/sites/ertex/
  components/                    kichik komponentlar, bo'limlar bo'yicha papkalarda
    cover/  idea/  gallery/  social/  crm/  seal/  standards/  rollout/  footer/  ui/
  data/                          matnlar va ma'lumotlar (galereya, CRM demo, ...)
  composables/                   holat mantig'i (useCrm, useModal)
  utils/                         formatlash, clipboard
  assets/                        rasmlar va shrift (Vite orqali, hash bilan)
  media.ts                       media("gallery/01.webp") → rasm URL'i
  tailwind.ts                    saytning ranglari/shriftlari (bg-ertex-navy, font-ertex)
  ertex.css                      @font-face, focus ring, reduced-motion
```

## Yangi loyiha qo'shish

1. `shared/sites.ts` ga yozuv qo'shing:
   ```ts
   { slug: "acme", name: "ACME", hosts: ["acme.onebrandingworld.com"], index: true },
   ```
2. `app/sites/acme/` papkasini yarating (komponentlar, `assets/`, `media.ts`,
   `tailwind.ts`). Ranglarni o'z nomi ostida bering: `colors: { acme: { ... } }`.
3. `tailwind.config.ts` dagi `presets` ga `acme` preset'ini qo'shing.
4. `app/pages/acme/index.vue` yarating; `useMicroSite("acme")` dan canonical/OG
   manzillarini oling.
5. Lokal tekshirish: `bun run dev` → `http://acme.localhost:3001/`
   (yoki `http://localhost:3001/acme`).
6. Domen: Railway'da `microsites` servisiga `acme.onebrandingworld.com` custom
   domenini qo'shing va Cloudflare'da Railway bergan CNAME yozuvini yarating
   (wildcard `*.onebrandingworld.com` ulangan bo'lsa, bu qadam kerak emas).

Statik HTML/CSS loyihani ko'chirishda: rasmlarni `assets/` ga, matn va
ro'yxatlarni `data/` ga, har bir bo'limni alohida komponentga, takrorlanadigan
bo'laklarni (`Eyebrow`, `Disclosure`, `PostCard`, ...) kichik komponentlarga
ajrating. Tailwind'da shrift o'lchamini `text-[14px]` ko'rinishida yozing:
`text-sm` kabi nomli o'lchamlar line-height'ni ham o'zgartiradi.

## Buyruqlar

```bash
bun install
bun run dev         # http://localhost:3001 (ertex.localhost:3001)
bun run lint
bun run typecheck
bun run build && bun run start
```
