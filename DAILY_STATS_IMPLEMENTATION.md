# Günlük İstatistik Tracking Sistemi - İmplementasyon Özeti

## Yapılan Değişiklikler

### 1. Yeni Tipler (types/index.ts)
- **DailyStats**: Günlük sıfırlanan istatistikler
  - Casino oyun sayıları (slot, coinflip, crash, blackjack, mines)
  - Voice dakikaları
  - Mesaj sayısı, reaction, mention, reply, emoji kullanımı
  - Kanal ve saat dilimi tracking
  - Her gün 00:00 İstanbul saati ile sıfırlanır

- **TotalStats**: Hiç sıfırlanmayan toplam istatistikler
  - voiceMinutesTotal: Toplam ses dakikası
  - casinoWinsTotal: Toplam casino kazançları

- **Player**: dailyStats ve totalStats alanları eklendi

### 2. DailyStatsService (services/dailyStatsService.ts)
**Amaç**: Günlük istatistikleri Firebase'de saklamak ve yönetmek

**Özellikler**:
- İstanbul saati (UTC+3) ile çalışır
- Set'leri array'e çevirip Firebase'e kaydeder
- Her tracking fonksiyonu Firebase'e direkt yazar

**Fonksiyonlar**:
- `getDailyStats(userId)`: Günlük stats'i getirir, tarih uyuşmazsa yeni oluşturur
- `updateDailyStats(userId, updates)`: Stats'i günceller
- `incrementCasinoPlay(userId, gameType)`: Casino oyun sayısını artırır
- `incrementCasinoWin(userId)`: Casino kazanç sayısını artırır
- `incrementCasinoSpent(userId, amount)`: Harcanan coin miktarını artırır
- `incrementVoiceMinutes(userId, minutes)`: Ses dakikasını artırır (total'ı da günceller)
- `incrementMessage(userId, channelId)`: Mesaj sayısını ve kanal tracking'i yapar
- `addMention(userId, mentionedUserId)`: Mention tracking
- `addReply(userId, repliedUserId)`: Reply tracking
- `addEmoji(userId, emojiName)`: Emoji tracking
- `incrementReactionGiven(userId)`: Verilen reaction sayısı
- `incrementReactionReceived(userId)`: Alınan reaction sayısı
- `getTotalStats(userId)`: Total stats'i getirir
- `incrementTotalVoiceMinutes(userId, minutes)`: Total voice'ı artırır
- `incrementTotalCasinoWins(userId)`: Total casino wins'i artırır
- `resetDailyStats(userId)`: Günlük stats'i sıfırlar

### 3. DailyResetService (services/dailyResetService.ts)
**Amaç**: Her gün 00:00 İstanbul saati ile tüm kullanıcıların günlük stats'lerini sıfırlamak

**Özellikler**:
- İstanbul saati (UTC+3) hesaplaması
- Bir sonraki gece yarısını otomatik hesaplar
- Tüm players collection'ını tarar ve sıfırlar
- Recursive scheduling (her gün kendini yeniden schedule eder)

**Fonksiyonlar**:
- `start()`: Scheduler'ı başlatır
- `scheduleMidnightReset()`: Bir sonraki gece yarısını hesaplar ve timeout ayarlar
- `performDailyReset()`: Tüm kullanıcıları sıfırlar
- `stop()`: Scheduler'ı durdurur

### 4. QuestService Refactoring (services/questService.ts)
**Değişiklikler**:
- Tüm tracking fonksiyonları artık `dailyStatsService`'i kullanıyor
- `updateQuestProgress` → `updateQuestProgressFromDailyStats` oldu
- Quest progress hesaplamaları `dailyStats`'ten okunuyor
- UserQuests hala unique tracking için kullanılıyor (reactionGivenToMessages, reactionGivenToUsers, etc.)

**Tracking Akışı**:
1. Event gelir (mesaj, voice, casino, reaction)
2. `dailyStatsService` Firebase'e yazar
3. `questService` günlük stats'ten okuyup quest progress'i günceller
4. Quest tamamlanırsa ödül verilir

### 5. Index.ts Güncellemesi
- `dailyResetService.start()` eklendi
- Eski manual reset scheduler kaldırıldı

## Veri Akışı

### Casino Tracking
```
Slot/Blackjack/Coinflip/Crash/Mines Oynanır
    ↓
dailyStatsService.incrementCasinoPlay(userId, gameType)
    ↓
Firebase: players/{userId}/dailyStats/slotPlays++ (veya diğer oyun)
    ↓
questService.updateQuestProgressFromDailyStats()
    ↓
dailyStats'ten okur: slotPlays, blackjackPlays, etc.
    ↓
Quest progress güncellenir
```

### Voice Tracking
```
voiceActivityService her 2 dakikada kontrol eder
    ↓
Yeni dakika hesaplanır (incremental)
    ↓
dailyStatsService.incrementVoiceMinutes(userId, increment)
    ↓
Firebase: players/{userId}/dailyStats/voiceMinutes += increment
Firebase: players/{userId}/totalStats/voiceMinutesTotal += increment
    ↓
questService.updateQuestProgressFromDailyStats()
    ↓
dailyStats.voiceMinutes okunur
    ↓
Quest progress güncellenir
```

### Message Tracking
```
Mesaj gönderilir
    ↓
dailyStatsService.incrementMessage(userId, channelId)
dailyStatsService.addMention(userId, mentionedUserId) [eğer mention varsa]
dailyStatsService.addReply(userId, repliedUserId) [eğer reply varsa]
dailyStatsService.addEmoji(userId, emoji) [eğer emoji varsa]
    ↓
Firebase: players/{userId}/dailyStats/* güncellenir
    ↓
questService.updateQuestProgressFromDailyStats()
    ↓
dailyStats'ten okur: messagesCount, mentionsGiven, repliesGiven, emojisUsed, etc.
    ↓
Quest progress güncellenir
```

### Günlük Reset (00:00 İstanbul)
```
dailyResetService.performDailyReset()
    ↓
Tüm players collection'ı taranır
    ↓
Her kullanıcı için dailyStatsService.resetDailyStats(userId)
    ↓
Firebase: players/{userId}/dailyStats = {
  date: "YYYY-MM-DD",
  lastReset: new Date(),
  slotPlays: 0,
  coinflipPlays: 0,
  ... (tüm alanlar sıfırlanır)
}
    ↓
totalStats değişmez (voiceMinutesTotal, casinoWinsTotal korunur)
```

## Edge Cases ve Düzeltmeler

### 1. Slot Kazanma/Kaybetme
✅ **Düzeltildi**: `trackCasinoWin` sadece kazanıldığında çağrılıyor
- Slot: `if (won) { trackCasinoWin(netWin) }`
- Blackjack: `trackBlackjackPlay(userId, won)` - won parametresi var
- Coinflip: Sadece kazanan için `trackCasinoWin` çağrılıyor
- Crash/Mines: Sadece cashout/win durumunda çağrılıyor

### 2. Voice Tracking (Incremental vs Total)
✅ **Düzeltildi**: 
- `voiceActivityService` her 2 dakikada total süreyi gönderir
- `questService.trackVoice` incremental farkı hesaplar
- `dailyStatsService.incrementVoiceMinutes` sadece farkı ekler
- Total stats da güncellenir

### 3. Unique User Tracking (Mention, Reply, Reaction)
✅ **Düzeltildi**:
- `dailyStats.mentionsGiven`: Set<string> (unique user IDs)
- `dailyStats.repliesGiven`: Set<string> (unique user IDs)
- `userQuests.reactionGivenToUsers`: Set<string> (unique user IDs)
- Firebase'e kaydederken Set → Array dönüşümü yapılıyor

### 4. Emoji Tracking
✅ **Düzeltildi**:
- Mesajlardaki emojiler: `dailyStats.emojisUsed`
- Reaction emojileri: `userQuests.reactionEmojisUsed`
- Comprehensive emoji regex kullanılıyor (Discord custom + Unicode)

### 5. Casino Variety Quest
✅ **Düzeltildi**:
- 5 farklı oyun tipini kontrol ediyor
- Her oyun için `dailyStats.{game}Plays > 0` kontrolü

### 6. Biggest Single Win
✅ **Düzeltildi**:
- `trackCasinoWin(userId, amount, isSingleBet=true)` parametresi
- `userQuests.biggestSingleWin` tracking
- Sadece tek bahiste en büyük kazanç kaydediliyor

### 7. Morning/Evening Messages
✅ **Düzeltildi**:
- `dailyStats.hourlyActivity`: Set<number> (0-23 saatler)
- Quest progress'te saat aralığı kontrolü yapılıyor

### 8. Fast Messages (10 dakika / 3 saat)
✅ **Düzeltildi**:
- `userQuests.fastMessageTimestamps`: number[] (timestamp array)
- Son 3 saat tutulur, eski timestamp'ler temizlenir
- Quest progress'te zaman aralığı filtrelenir

## Firebase Quota Optimizasyonu

### Önceki Durum
- Her event'te userQuests okunup yazılıyordu
- Voice tracking her 2 dakikada tüm kullanıcıları `getDocs()` ile okuyordu
- ~20k read/write per day

### Yeni Durum
- Daily stats direkt yazılıyor (read yok, sadece write)
- Voice tracking memory cache kullanıyor (getDocs yok)
- Quest progress sadece gerektiğinde okunuyor
- Beklenen: ~5k read/write per day (%75 azalma)

## Test Checklist

- [ ] Casino oyunları oyna (slot, blackjack, coinflip, crash, mines)
  - [ ] Oyun sayıları artıyor mu?
  - [ ] Kazanma durumunda casinoWins artıyor mu?
  - [ ] Kaybetme durumunda casinoWins artmıyor mu?
  
- [ ] Voice kanalına katıl
  - [ ] 5 dakika sonra quest progress güncellenmiş mi?
  - [ ] Total voice minutes artıyor mu?
  - [ ] Günlük voice minutes artıyor mu?
  
- [ ] Mesaj gönder
  - [ ] Message count artıyor mu?
  - [ ] Mention tracking çalışıyor mu?
  - [ ] Reply tracking çalışıyor mu?
  - [ ] Emoji tracking çalışıyor mu?
  
- [ ] Reaction ver
  - [ ] Reaction count artıyor mu?
  - [ ] Unique user tracking çalışıyor mu?
  - [ ] Emoji variety tracking çalışıyor mu?
  
- [ ] Günlük reset (00:00 İstanbul)
  - [ ] Daily stats sıfırlanıyor mu?
  - [ ] Total stats korunuyor mu?
  - [ ] Quest progress sıfırlanıyor mu?

## Notlar

1. **İstanbul Saati**: Tüm sistem UTC+3 ile çalışıyor
2. **Set → Array**: Firebase Set desteklemediği için dönüşüm yapılıyor
3. **Memory Cache**: Voice tracking Firebase okuma yapmıyor
4. **Async Tracking**: Tüm tracking fonksiyonları async ve error handling var
5. **Quest Progress**: Daily stats'ten okunuyor, userQuests sadece unique tracking için
