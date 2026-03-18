# 🎮 RPG SİSTEMİ - GENEL İSKELET

## 📋 GENEL BAKIŞ

RPG sistemi, mevcut bot sistemlerini **bozmadan** eklenmiş, tamamen bağımsız bir sistemdir.
Tüm RPG komutları `/rpg` prefix'i ile başlar.

---

## 🏗️ OLUŞTURULAN YAPILAR

### **1. Type Definitions** (`src/types/rpg.ts`)
- ✅ RPGClass (5 class: Warrior, Mage, Archer, Assassin, Cleric)
- ✅ RPGStats (STR, DEX, INT, VIT, AGI)
- ✅ DerivedStats (HP, Mana, Attack, Defense, Crit, Dodge)
- ✅ RPGCharacter (karakter verisi)
- ✅ RPGItem (item sistemi için hazır)
- ✅ Enemy (düşman sistemi için hazır)
- ✅ Dungeon (dungeon sistemi için hazır)
- ✅ RaidInvitation (raid daveti sistemi için hazır)
- ✅ EconomyRate (coin dönüşüm sistemi)

### **2. RPG Service** (`src/services/rpgService.ts`)
- ✅ Character Creation
- ✅ Character Stats Calculation (class multipliers)
- ✅ XP & Level System (formula: 100 * level^1.5)
- ✅ Economy Exchange System (dynamic rates based on supply/demand)
- ✅ Derived Stats Calculation

### **3. RPG Commands** (`src/commands/rpg.ts`)
- ✅ `/rpg create` - Karakter oluşturma (class selection menu)
- ✅ `/rpg profil` - Karakter profili görüntüleme
- ✅ `/rpg exchange` - Coin dönüşümü (Server ↔ RPG)

### **4. Event Handlers** (`src/events/interactionCreate.ts`)
- ✅ RPG Class Selection Menu Handler

---

## 🎯 CLASS SİSTEMİ

### **Class Multipliers**

| Class     | STR  | DEX  | INT  | VIT  | AGI  |
|-----------|------|------|------|------|------|
| Warrior   | 1.4  | 0.9  | 0.6  | 1.3  | 0.8  |
| Mage      | 0.6  | 0.9  | 1.6  | 0.8  | 1.1  |
| Archer    | 1.1  | 1.3  | 0.7  | 0.9  | 1.4  |
| Assassin  | 1.2  | 1.5  | 0.7  | 0.7  | 1.6  |
| Cleric    | 0.8  | 1.0  | 1.3  | 1.2  | 0.9  |

### **Stat Formulas**
```
HP = 50 + (VIT * multiplier) * 10
Mana = 30 + (INT * multiplier) * 5
Attack = weapon + (STR * multiplier) * 2
Magic Attack = weapon + (INT * multiplier) * 2
Defense = armor + (STR * multiplier)
Speed = (AGI * multiplier)
Crit Chance = (DEX * multiplier) * 0.5%
Dodge Chance = (AGI * multiplier) * 0.3%
```

---

## 💰 EKONOMİ SİSTEMİ

### **Dynamic Exchange Rate**
Coin dönüşüm oranları arz-talebe göre değişir:

```typescript
serverToRPGRate = totalRPGCoin / totalServerCoin
rpgToServerRate = totalServerCoin / totalRPGCoin
```

**Örnek:**
- Eğer RPG Coin az ise → RPG Coin değerli
- Eğer Server Coin az ise → Server Coin değerli

### **Dönüşüm**
- `/rpg exchange tip:server_to_rpg miktar:100` - 100 Server Coin → X RPG Coin
- `/rpg exchange tip:rpg_to_server miktar:50` - 50 RPG Coin → X Server Coin

---

## 📊 LEVEL SİSTEMİ

### **XP Formula**
```
XP_to_level = 100 * level^1.5
```

**Örnekler:**
- Level 1 → 2: 100 XP
- Level 2 → 3: 282 XP
- Level 3 → 4: 519 XP
- Level 10 → 11: 3162 XP

### **Level Up Bonuses**
Her level'da:
- +2 STR
- +2 DEX
- +2 INT
- +2 VIT
- +2 AGI
- Full HP/Mana restore

---

## 🗄️ DATABASE COLLECTIONS

### **Yeni Collections**
```
rpgCharacters/        - RPG karakter verileri
rpgEconomy/          - Exchange rate verileri
rpgItems/            - Item verileri (gelecek)
rpgDungeons/         - Dungeon verileri (gelecek)
rpgRaids/            - Raid invitation verileri (gelecek)
```

### **Mevcut Sistemlerle Bağlantı**
- `players/` - Server coin için kullanılıyor
- Mevcut sistemler **hiç etkilenmiyor**

---

## ✅ TAMAMLANAN ÖZELLIKLER

1. ✅ Karakter oluşturma sistemi
2. ✅ 5 farklı class (Warrior, Mage, Archer, Assassin, Cleric)
3. ✅ Class-based stat multipliers
4. ✅ Derived stats calculation
5. ✅ Level & XP sistemi
6. ✅ Dynamic economy exchange system
7. ✅ Profil görüntüleme
8. ✅ Coin dönüşümü

---

## 🚧 YAPILACAKLAR (Sıradaki Adımlar)

### **1. Combat System**
```typescript
// Combat formulas hazır (rpg.ts'de)
damage = (attack - defense/2) * random(0.9 - 1.1)
if (rand < critChance) damage *= 1.75
if (rand < dodgeChance) damage = 0
```

### **2. Adventure System**
- `/rpg adventure` - Solo macera (enemy encounter)
- Enemy generation
- Combat simulation
- Loot system
- XP reward

### **3. Dungeon System**
- `/rpg dungeon list` - Dungeon listesi
- `/rpg dungeon join <id>` - Dungeon'a katıl
- Multi-player dungeon raids
- Boss fights

### **4. Raid System** (SOSYAL ÖZELLIK)
- `/rpg raid create <dungeon_id>` - Raid daveti oluştur
- Davet butonu ile katılım
- "Ahmet bir dungeon raid'i daveti yolladı. Kabul etmek için tıkla"
- Team-based combat

### **5. Item System**
- Item generation
- Rarity system (Common → Mythic)
- Equipment system
- Inventory management
- `/rpg inventory` - Envanter
- `/rpg equip <item>` - Item kuşan

### **6. Market System**
- `/rpg market` - RPG item market
- Item alım/satım (RPG Coin ile)

### **7. Crafting System**
- `/rpg craft` - Item crafting
- Material system

---

## 🎮 GAMEPLAY LOOP (Hedef)

```
/rpg adventure
    ↓
Enemy Encounter
    ↓
Combat
    ↓
Loot (Items + XP + Coin)
    ↓
Level Up
    ↓
Better Gear
    ↓
Harder Dungeons
    ↓
Raid with Friends
```

---

## 🔗 SOSYAL ÖZELLIKLER (Öncelik)

### **Raid Invitation System**
```typescript
// Örnek kullanım:
/rpg raid create dungeon:dark_forest

// Embed:
"🏰 Ahmet bir dungeon raid'i daveti yolladı!"
"Dungeon: Dark Forest (Level 5+)"
"Katılımcılar: 1/4"
[Katıl] [Reddet]
```

### **Party System** (Gelecek)
- Grup oluşturma
- Shared XP
- Shared loot

---

## 📝 NOTLAR

### **Mevcut Sistemlerle Uyumluluk**
- ✅ Hiçbir mevcut komut etkilenmedi
- ✅ Tüm RPG komutları `/rpg` prefix'i ile
- ✅ Ayrı database collections
- ✅ Bağımsız economy (ama dönüşüm var)

### **Scalability**
- ✅ Type definitions hazır
- ✅ Service architecture hazır
- ✅ Kolayca genişletilebilir

### **Performance**
- ✅ Firebase optimized
- ✅ Async operations
- ✅ Error handling

---

## 🎯 SONRAKİ ADIM

**Combat & Adventure System** oluşturmak:
1. Enemy generation
2. Combat simulation
3. Loot system
4. `/rpg adventure` komutu

Hazır olduğunda devam edelim! 🚀
