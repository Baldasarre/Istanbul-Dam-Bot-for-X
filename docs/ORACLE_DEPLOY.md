# Oracle Always Free Kurulum (Gunde 2 Otomatik Paylasim)

Bu rehber Ubuntu tabanli Oracle Always Free VM icindir.

## 1) Oracle VM olustur
- Oracle Cloud -> Compute -> Instances -> Create Instance
- Image: Ubuntu (LTS)
- Shape: Always Free uygun bir shape sec
- SSH key ile erisim ac

## 2) Sunucuya baglan
```bash
ssh -i /path/to/private_key ubuntu@SUNUCU_IP
```

## 3) Gerekli paketleri kur
```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 4) Projeyi cek ve kur
```bash
cd /home/ubuntu
git clone https://github.com/Baldasarre/Istanbul-Dam-Bot-for-X.git istanbul-baraj-bot
cd istanbul-baraj-bot
npm ci
```

## 5) Ortam degiskenlerini gir
```bash
cat > .env <<'EOF'
ISKI_API_TOKEN=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_BEARER_TOKEN=
POST_ENABLED=false
TZ=Europe/Istanbul
EOF
```

## 6) Dry-run test et
```bash
npm run dry-run
```

## 7) Cron scriptini hazirla
```bash
chmod +x scripts/post-cron.sh
```

## 8) Cron ekle (gunde 2 kez)
UTC tabanli saatler:
- 06:00 UTC (Istanbul 09:00)
- 15:00 UTC (Istanbul 18:00)

```bash
crontab -e
```

Su satiri ekle:
```cron
0 6,15 * * * /home/ubuntu/istanbul-baraj-bot/scripts/post-cron.sh
```

## 9) Cron dogrula
```bash
crontab -l
tail -f /home/ubuntu/istanbul-baraj-bot/.data/cron.log
```

## 10) Elle bir kez gercek post dene
```bash
POST_ENABLED=true npm run post
```

## Notlar
- Duplicate kontrolu `.data/state.json` ile devam eder.
- Ayni anda birden fazla calisma `flock` ile engellenir.
- Secret'lari repoya asla commitleme.
- Oracle'dan `iski.istanbul` timeout olursa relay kullan:
  [ISKI_RELAY.md](/Users/deniz/Desktop/istanbul-baraj-bot/docs/ISKI_RELAY.md)
