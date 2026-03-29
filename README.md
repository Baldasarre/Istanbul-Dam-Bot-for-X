# Istanbul Baraj Botu

Bu proje, İSKİ'nin baraj doluluk verisini çekip günde 2 kez X'te paylaşmak için hazırlanmış basit bir Node.js + TypeScript başlangıç projesidir.

## Ne yapar?
- İSKİ sayfasından güncel doluluk oranını çeker
- Veriyi normalize eder
- Türkçe bir paylaşım metni üretir
- Dry-run modunda terminale basar
- Gerçek modda X API ile paylaşır
- Son başarılı snapshot'ı saklayıp aynı veriyi tekrar paylaşmamaya çalışır

## Kurulum
```bash
npm install
```

## Geliştirme
```bash
npm run dev
```

## Dry run
Gerçek paylaşım yapmadan veriyi ve üretilecek metni görmek için:
```bash
npm run dry-run
```

## Tek seferlik paylaşım
```bash
npm run post
```

## Önemli not
Bot İSKİ API'sini kullanır. API token geçersiz/eksik olursa paylaşım yapılmaz.

## Önerilen deployment
- GitHub Actions cron
- Render Cron Job
- Railway
- Kendi VPS'in
- Oracle Always Free VM + cron (rehber: [ORACLE_DEPLOY.md](/Users/deniz/Desktop/istanbul-baraj-bot/docs/ORACLE_DEPLOY.md))

## Günde 2 kez önerilen saatler
- 09:00 Europe/Istanbul
- 18:00 Europe/Istanbul

## Ortam değişkenleri
Aşağıdaki anahtarları `.env` içine gir:
- `ISKI_API_TOKEN`
- `ISKI_API_BASE_URL` (opsiyonel, varsayılan: resmi İSKİ API)
- `ISKI_RELAY_KEY` (opsiyonel, relay kullanıyorsan)
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `X_BEARER_TOKEN` (opsiyonel)
- `POST_ENABLED` (`true` veya `false`)

Örnek `.env`:
```env
ISKI_API_TOKEN=
ISKI_API_BASE_URL=
ISKI_RELAY_KEY=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_BEARER_TOKEN=
POST_ENABLED=false
TZ=Europe/Istanbul
```

## Oracle icin Relay (opsiyonel)
Oracle'dan İSKİ'ye timeout alırsan Cloudflare Worker relay kullan:
- Rehber: [ISKI_RELAY.md](/Users/deniz/Desktop/istanbul-baraj-bot/docs/ISKI_RELAY.md)

## GitHub Actions ile otomatik paylaşım
Repo içinde hazır cron workflow'u vardır: [post.yml](/Users/deniz/Desktop/istanbul-baraj-bot/.github/workflows/post.yml)

1. GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions` altında şu secret'ları ekle:
   - `ISKI_API_TOKEN`
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`
2. `Actions` sekmesinden workflow'u bir kez manuel çalıştır (`Run workflow`).
3. Otomatik cron saatleri UTC olarak tanımlı:
   - `06:00 UTC` (Istanbul `09:00`)
   - `15:00 UTC` (Istanbul `18:00`)

## Geliştirme sırası
1. Dry-run çalışsın
2. Parser doğrulansın
3. Tweet metni otursun
4. X paylaşımı aç
5. Cron ile deploy et
