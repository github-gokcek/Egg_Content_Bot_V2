# Egg Content Bot V2

TypeScript tabanlı modern Discord botu - LoL & TFT maç yönetimi

## Özellikler

- ✅ TypeScript ile tip güvenliği
- ✅ Modüler yapı (Firebase & Dashboard için hazır)
- ✅ Modern Slash Commands
- ✅ Event-driven architecture
- 🔜 Firebase entegrasyonu
- 🔜 React Dashboard

## Kurulum

1. Bağımlılıkları yükle:
```bash
npm install
```

2. `.env` dosyasını oluştur:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=1461056941567770684
```

3. Komutları deploy et:
```bash
npm run deploy
```

4. Botu başlat:
```bash
npm run dev
```

## Proje Yapısı

```
src/
├── commands/       # Slash commands
├── events/         # Discord event handlers
├── services/       # İş mantığı (Firebase için hazır)
├── models/         # Veri modelleri
├── types/          # TypeScript tipleri
└── utils/          # Yardımcı fonksiyonlar
```

## Komutlar

- `/ping` - Bot latency'sini gösterir

## Geliştirme

```bash
npm run dev      # Development mode (hot reload)
npm run build    # Production build
npm run start    # Production start
```
