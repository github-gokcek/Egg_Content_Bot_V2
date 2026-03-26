# 🎮 Egg Content Bot V2

Discord botu - Casino, Görev Sistemi, LoL/TFT Entegrasyonu ve daha fazlası!

## ✨ Özellikler

### 🎰 Casino Sistemi
- **Slot Machine** - Klasik slot oyunu
- **Blackjack** - 21 oyunu (Hit, Stand, Double)
- **Coinflip** - Yazı tura (Solo & PvP)
- **Crash** - Multiplier oyunu
- **Mines** - Mayın tarlası

### 📋 Görev Sistemi
- **43 Farklı Görev** - 6 kategori (Mesaj, Sosyal, Casino, Ses, Bonus, Özel)
- **Günlük Sıfırlama** - Her gece 00:00 İstanbul saati
- **Otomatik Tracking** - Tüm aktiviteler otomatik takip edilir
- **Ödül Sistemi** - Görev tamamlayınca coin kazanın

### 🎤 Ses Tracking
- **Otomatik Takip** - Ses kanalında geçirilen süre
- **Coin Kazanma** - Her 5 dakika için coin
- **İstatistikler** - Günlük ve toplam ses süreleri

### 💬 Sosyal Tracking
- Mesaj sayısı
- Reaction verme/alma
- Mention ve Reply tracking
- Emoji kullanım istatistikleri
- Kanal çeşitliliği

### 🎮 LoL/TFT Entegrasyonu
- `/lol profil` - Oyuncu profili görüntüleme
- Riot API entegrasyonu
- Ranked bilgileri
- Champion mastery

### 👤 Kullanıcı Profili
- `/kullanıcı profil` - Detaylı profil bilgileri
- `/kullanıcı resim` - 4K profil resmi
- Tüm istatistikler tek yerde

## 🚀 Kurulum

Detaylı kurulum için [SETUP.md](SETUP.md) dosyasına bakın.

### Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env

# Komutları deploy et
npm run deploy

# Botu başlat
npm run dev
```

## 📦 Gereksinimler

- Node.js v18+
- Firebase Firestore
- Discord Bot Token

## 🛠️ Teknolojiler

- **TypeScript** - Type-safe kod
- **Discord.js v14** - Discord API
- **Firebase Firestore** - Veritabanı
- **Axios** - HTTP istekleri
- **Puppeteer** - Web scraping (opsiyonel)

## 📁 Proje Yapısı

```
src/
├── commands/       # Slash komutları
├── events/         # Discord event handlers
├── services/       # İş mantığı
├── types/          # TypeScript types
├── utils/          # Yardımcı fonksiyonlar
└── index.ts        # Ana dosya
```

## 🎯 Komutlar

### Casino
- `/slot [miktar]` - Slot machine
- `/blackjack [miktar]` - Blackjack
- `/coinflip [miktar]` - Yazı tura
- `/crash [miktar]` - Crash oyunu
- `/mines [miktar]` - Mines oyunu

### Kullanıcı
- `/kayit` - Sisteme kayıt ol
- `/bakiye` - Bakiyeni gör
- `/günlük` - Günlük ödül topla
- `/kullanıcı profil` - Profil görüntüle
- `/kullanıcı resim` - Profil resmi

### Görevler
- `/quest` - Görevlerini gör
- `/liderlik` - Liderboard

### LoL
- `/lol profil [oyuncu]` - LoL profili

### Admin
- `/set` - Bot ayarları
- `/bakiye_yonet` - Bakiye yönetimi

## 🔧 Yapılandırma

### .env Dosyası
```env
DISCORD_TOKEN=your_token_here
RIOT_API_KEY=your_riot_key_here
```

### Firebase Config
`src/services/firebase.ts` dosyasını düzenleyin.

## 📊 Firebase Collections

- `players` - Kullanıcı verileri
- `userQuests` - Görev verileri
- `voiceSessions` - Ses oturumları
- `crashGames` - Aktif crash oyunları
- `blackjackGames` - Aktif blackjack oyunları
- `minesGames` - Aktif mines oyunları
- `guild_configs` - Sunucu ayarları

## 🐛 Bilinen Sorunlar

Tüm bilinen sorunlar çözüldü! ✅

## 📝 Changelog

### v2.0.0
- ✅ Günlük istatistik sistemi
- ✅ İstanbul saati ile otomatik sıfırlama
- ✅ Memory cache ile Firebase optimizasyonu
- ✅ Non-blocking quest tracking
- ✅ `/kullanıcı` komutu eklendi
- ✅ `/lol profil` aktif edildi
- ✅ Casino timeout sorunları çözüldü

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel kullanım içindir.

## 🙏 Teşekkürler

- Discord.js ekibine
- Firebase ekibine
- Riot Games API'sine

## 📞 İletişim

Sorularınız için issue açın veya pull request gönderin.

---

**Not**: Bu bot sürekli geliştirilmektedir. Yeni özellikler için takipte kalın!
