# Egg Content Bot V2 - Kurulum Rehberi

## 📋 Gereksinimler

- **Node.js**: v18 veya üzeri
- **npm** veya **yarn**
- **Firebase Projesi**: Firestore Database aktif
- **Discord Bot Token**: Discord Developer Portal'dan alınmış

## 🚀 Kurulum Adımları

### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd Egg_Content_Bot_V2
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun (root dizinde):
```env
DISCORD_TOKEN=your_discord_bot_token_here
RIOT_API_KEY=your_riot_api_key_here (opsiyonel)
```

### 4. Firebase Yapılandırması

`src/services/firebase.ts` dosyasındaki Firebase config'i kendi projenizle değiştirin:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 5. Gerekli Klasörleri Oluşturun

Bot otomatik olarak şu klasörleri oluşturur:
- `temp/` - Geçici dosyalar için (avatar indirme vb.)
- `dist/` - TypeScript build çıktısı

**Not**: Bu klasörler `.gitignore`'da olduğu için repository'de bulunmaz.

### 6. Asset Klasörünü Oluşturun (Opsiyonel)

Eğer reklam sistemi kullanacaksanız:
```bash
mkdir assetler
```

`assetler/Ninja.png` dosyasını ekleyin (reklam görseli için).

### 7. Komutları Deploy Edin
```bash
npm run deploy
```

### 8. Botu Başlatın

**Development (hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📁 Proje Yapısı

```
Egg_Content_Bot_V2/
├── src/
│   ├── commands/          # Slash komutları
│   ├── events/            # Discord event handlers
│   ├── services/          # İş mantığı servisleri
│   ├── types/             # TypeScript type tanımları
│   ├── utils/             # Yardımcı fonksiyonlar
│   └── index.ts           # Ana giriş noktası
├── assetler/              # Görseller (manuel oluşturulmalı)
├── temp/                  # Geçici dosyalar (otomatik oluşturulur)
├── dist/                  # Build çıktısı (otomatik oluşturulur)
├── .env                   # Ortam değişkenleri (manuel oluşturulmalı)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Platform Uyumluluğu

Bot **Windows**, **macOS** ve **Linux** üzerinde çalışacak şekilde tasarlanmıştır:

- ✅ Path işlemleri `path.join()` ile platform-agnostic
- ✅ Temp klasörü otomatik oluşturulur
- ✅ `process.cwd()` kullanımı tüm platformlarda çalışır
- ✅ TypeScript build sistemi cross-platform

## 🗂️ Firebase Collections

Bot şu Firestore collection'larını kullanır:

- `players` - Kullanıcı verileri (bakiye, stats, dailyStats, totalStats)
- `userQuests` - Günlük görev verileri
- `voiceSessions` - Aktif ses oturumları
- `crashGames` - Aktif crash oyunları
- `blackjackGames` - Aktif blackjack oyunları
- `minesGames` - Aktif mines oyunları
- `guild_configs` - Sunucu ayarları
- `dailyRewards` - Günlük ödül takibi
- `lol_matches` - LoL maç verileri
- `tft_matches` - TFT maç verileri

## 🎮 Özellikler

### Casino Sistemi
- Slot Machine
- Blackjack
- Coinflip (Solo & PvP)
- Crash
- Mines

### Görev Sistemi
- Günlük görevler (9 kategori, 43 görev tipi)
- Özel görevler
- Otomatik sıfırlama (00:00 İstanbul saati)

### Ses Tracking
- Otomatik ses süresi takibi
- Coin kazanma sistemi
- Günlük ve toplam istatistikler

### Sosyal Özellikler
- Mesaj tracking
- Reaction tracking
- Mention/Reply tracking
- Emoji kullanım istatistikleri

### LoL Entegrasyonu
- `/lol profil` - Oyuncu profili görüntüleme
- Riot API entegrasyonu

## 🐛 Sorun Giderme

### "Uygulama yanıt vermedi" Hatası
- Tüm casino komutları `deferReply()` kullanır
- Quest tracking non-blocking yapıldı
- 3 saniye timeout sorunu çözüldü

### Firebase Quota Aşımı
- Voice tracking memory cache kullanır
- Daily stats direkt yazılır (read yok)
- Optimize edilmiş Firebase kullanımı

### Temp Klasörü Hatası
- Bot otomatik olarak `temp/` klasörünü oluşturur
- Manuel oluşturmanıza gerek yok

### Asset Bulunamadı Hatası
- `assetler/Ninja.png` dosyasını ekleyin
- Veya reklam sistemini devre dışı bırakın

## 📝 Notlar

- **İstanbul Saati**: Tüm günlük sıfırlamalar UTC+3 ile çalışır
- **Quest Tracking**: Async ve non-blocking
- **Memory Cache**: Voice tracking Firebase okuma yapmaz
- **Auto Cleanup**: Geçici dosyalar 5 saniye sonra silinir

## 🔐 Güvenlik

- `.env` dosyasını **asla** commit etmeyin
- Firebase credentials'ları güvende tutun
- Discord token'ı paylaşmayın
- `.gitignore` dosyasını kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin (`console` çıktısı)
2. Firebase bağlantısını test edin
3. Discord bot permissions'ları kontrol edin
4. Node.js versiyonunu kontrol edin (v18+)

## 🎉 Başarılı Kurulum!

Bot başarıyla çalışıyorsa:
- Discord sunucunuzda `/ping` komutunu deneyin
- `/yardim` ile tüm komutları görün
- `/kayit` ile sisteme kayıt olun
