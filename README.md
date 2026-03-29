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
cp .env.example .env
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
Bu repo başlangıç seviyesinde iskelet sunar. İSKİ sayfasının HTML yapısı değişirse `src/lib/iski.ts` içindeki parser güncellenmelidir.

## Önerilen deployment
- GitHub Actions cron
- Render Cron Job
- Railway
- Kendi VPS'in

## Günde 2 kez önerilen saatler
- 09:00 Europe/Istanbul
- 18:00 Europe/Istanbul

## Ortam değişkenleri
Aşağıdaki anahtarları `.env` içine gir:
- `ISKI_API_TOKEN`
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `X_BEARER_TOKEN` (opsiyonel)
- `POST_ENABLED` (`true` veya `false`)

## Geliştirme sırası
1. Dry-run çalışsın
2. Parser doğrulansın
3. Tweet metni otursun
4. X paylaşımı aç
5. Cron ile deploy et
