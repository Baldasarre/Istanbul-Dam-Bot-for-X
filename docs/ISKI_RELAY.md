# Cloudflare Relay (Oracle icin)

Oracle VM'den `iski.istanbul` timeout alirsan bu relay ile devam et.

## 1) Worker olustur
Yerelde:
```bash
npm create cloudflare@latest iski-relay
cd iski-relay
```

`src/index.js` icine su dosyayi kopyala:
- `/scripts/cloudflare/iski-relay-worker.mjs`

## 2) Secret'lari Worker'a ekle
```bash
npx wrangler secret put ISKI_API_TOKEN
npx wrangler secret put RELAY_KEY
```

Opsiyonel:
```bash
npx wrangler secret put ISKI_API_BASE_URL
```

`ISKI_API_BASE_URL` verilmezse varsayilan:
`https://iskiapi.iski.istanbul/api/iski/baraj`

## 3) Deploy
```bash
npx wrangler deploy
```

Deploy sonunda bir URL alacaksin:
`https://<worker-name>.<subdomain>.workers.dev`

## 4) Oracle/.env ayari
Oracle sunucudaki `.env`:
```env
ISKI_API_BASE_URL=https://<worker-name>.<subdomain>.workers.dev
ISKI_RELAY_KEY=<RELAY_KEY>

# Relay kullaniyorsan sunucuda ISKI_API_TOKEN zorunlu degil
ISKI_API_TOKEN=
```

## 5) Test
Oracle'da:
```bash
cd /home/opc/istanbul-baraj-bot
npm run dry-run
```

Gecerliyse cron ayni sekilde calismaya devam eder.
