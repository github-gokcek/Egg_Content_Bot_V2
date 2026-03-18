# Görev Sistemi v2.0

## Genel Bakış

Görev sistemi kategorilere ayrıldı ve özel görev sistemi eklendi.

## Kategoriler

### 📨 Mesaj/Etkileşim (2 görev/gün)
- Mesaj gönderme
- Farklı kanallara mesaj
- Yanıt verme
- Emoji kullanımı
- Sabah/Akşam mesajları

### 🎭 Sosyal (2 görev/gün)
- Farklı kişilerle etkileşim
- Reaction verme
- Mention kullanımı
- Popüler mesaj alma

### 🎰 Casino (2 görev/gün)
- /günlük komutu
- Slot, Blackjack, Coinflip, Crash, Mines
- Casino harcamaları
- Büyük kazançlar

### 🔊 Ses (2 görev/gün)
- Sesli kanalda kalma süreleri
- 5dk, 15dk, 30dk, 1 saat

### 📊 Bonus (1 görev/gün)
- Mesaj bombardımanı
- Ses + mesaj kombinasyonu
- Gün boyu aktif olma

### 🏆 Özel Görev (1 görev/gün)
- Tüm günlük görevler tamamlandıktan sonra açılır
- Daha zor görevler
- Daha yüksek ödüller

## Yeni Komutlar

### /günlük
Günlük 100 coin ödülü topla

### /quest
Günlük görevlerini görüntüle (kategorilere göre gruplandırılmış)

## Quest Tracking Fonksiyonları

### Mesaj Tracking
- `trackMessage(userId, message)` - Otomatik (messageCreate event'inde)

### Ses Tracking
- `trackVoice(userId, minutes)` - Otomatik (voiceActivityService'de)

### Reaction Tracking
- `trackReactionGiven(userId, messageId, authorId)` - Otomatik (messageReactionAdd event'inde)
- `trackReactionReceived(userId, messageId)` - Otomatik (messageReactionAdd event'inde)

### Casino Tracking
- `trackDailyCommand(userId)` - /günlük komutunda
- `trackSlotPlay(userId)` - Slot oyununda
- `trackBlackjackPlay(userId)` - Blackjack oyununda
- `trackCoinflipPlay(userId)` - Coinflip oyununda
- `trackCrashPlay(userId)` - Crash oyununda
- `trackMinesTiles(userId, tiles)` - Mines oyununda
- `trackCasinoSpent(userId, amount)` - Tüm casino oyunlarında
- `trackCasinoWin(userId, amount)` - Kazanç olduğunda
- `trackDuelloWin(userId)` - Duello kazanıldığında

## Eklenmesi Gerekenler

### Casino Handler'larda Quest Tracking
Aşağıdaki dosyalarda button handler'lara quest tracking eklenmeli:

1. **casinoHandlers.ts - handleBlackjackButtons**
   - Hit/Stand/Double sonrası kazanç olduğunda `trackCasinoWin()`
   
2. **casinoHandlers.ts - handleCrashCashout**
   - Cashout yapıldığında `trackCrashPlay()` ve `trackCasinoWin()`
   
3. **casinoHandlers.ts - handleMinesButtons**
   - Kare açıldığında `trackMinesTiles(userId, 1)`
   - Cashout yapıldığında `trackCasinoWin()`

4. **duello.ts - handleDuelloButton**
   - Kazanan belirlendikten sonra `trackDuelloWin(winnerId)`

## Örnek Kullanım

```typescript
// Slot oyununda
await questService.trackSlotPlay(interaction.user.id);
await questService.trackCasinoSpent(interaction.user.id, amount);

// Kazanç olduğunda
const netWin = winAmount - amount;
if (netWin > 0) {
  await questService.trackCasinoWin(interaction.user.id, netWin);
}
```

## Görev Sıfırlama

Görevler her gün otomatik olarak sıfırlanır ve yeni görevler atanır.
- Her kategoriden rastgele görevler seçilir
- Özel görev de rastgele seçilir
- Tüm progress sıfırlanır
