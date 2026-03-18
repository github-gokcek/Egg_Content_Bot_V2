# 🎮 RPG COMBAT SYSTEM - TAMAMLANDI!

## ✅ OLUŞTURULAN SİSTEMLER

### **1. Enemy System** (`enemyService.ts`)
- ✅ 6 farklı enemy tipi (Snail, Bee, Pumpkin, Boar, Cursed Spirit, Cloud Monster)
- ✅ 4 farklı area (Forest, Dark Forest, Haunted Woods, Sky Realm)
- ✅ Level-based enemy generation
- ✅ Boss generation (2x güçlü)
- ✅ Loot table system
- ✅ Enemy images ve emojiler

### **2. Combat System** (`combatService.ts`)
- ✅ Damage calculation (attack - defense/2)
- ✅ Critical hit system (1.75x damage)
- ✅ Dodge system
- ✅ Defend action (50% damage reduction)
- ✅ Flee system (speed-based)
- ✅ Turn-based combat
- ✅ Combat log generation
- ✅ HP bar visualization

### **3. Combat Handler** (`rpgCombatHandler.ts`)
- ✅ Button-based combat interface
- ✅ Real-time combat updates
- ✅ Victory/Defeat handling
- ✅ XP & Coin rewards
- ✅ Loot drops
- ✅ Level up detection

### **4. Adventure Command** (`rpg.ts`)
- ✅ `/rpg adventure` komutu
- ✅ Area selection
- ✅ 30 saniye cooldown
- ✅ Enemy encounter embed
- ✅ Combat başlatma

### **5. Assets** (`assets/`)
- ✅ 6 enemy resmi (pixel art)
- ✅ Character sprite
- ✅ Background image
- ✅ UI elements

---

## 🎮 NASIL OYNANIR?

### **1. Karakter Oluştur**
```
/rpg create
```
- Class seç (Warrior, Mage, Archer, Assassin, Cleric)

### **2. Maceraya Çık**
```
/rpg adventure
/rpg adventure area:forest
/rpg adventure area:dark_forest
```

### **3. Savaş!**
- **⚔️ Attack** - Düşmana saldır
- **🛡️ Defend** - Savunma yap (50% hasar azaltma)
- **🏃 Flee** - Kaçmaya çalış (speed-based)

### **4. Ödüller Kazan**
- XP kazanarak level atla
- RPG Coin kazan
- Item loot'la (gelecek)

---

## 📊 COMBAT MECHANICS

### **Damage Formula**
```typescript
damage = (attack - defense/2) * random(0.9 - 1.1)
if (crit) damage *= 1.75
if (dodge) damage = 0
```

### **Critical Hit**
```
critChance = DEX * 0.5%
```

### **Dodge**
```
dodgeChance = AGI * 0.3%
```

### **Flee Chance**
```
fleeChance = 50% + (playerSpeed - enemySpeed) * 2%
Clamped between 10% - 90%
```

---

## 🎨 GÖRSEL ÖZELLIKLER

### **Combat Embed**
- ✅ Enemy thumbnail image
- ✅ HP bars (ASCII: ████████░░)
- ✅ Real-time stat display
- ✅ Combat log
- ✅ Turn counter

### **Victory Embed**
- ✅ XP & Coin rewards
- ✅ Level up notification
- ✅ Loot display
- ✅ Combat statistics

### **Defeat Embed**
- ✅ Defeat message
- ✅ Respawn notification (50% HP)
- ✅ Turn survived count

---

## 🗄️ DATABASE

### **New Collections**
```
activeCombats/        - Aktif savaşlar (geçici)
  - userId
  - enemy (full enemy object)
  - turnCount
  - isDefending
  - messageId
  - startedAt
```

### **Updated Collections**
```
rpgCharacters/
  - lastAdventure (cooldown için)
  - currentHp (combat'ta güncellenir)
  - totalKills (artar)
  - totalDeaths (artar)
```

---

## 🎯 ENEMY TIPLERI

| Enemy | Level | HP | ATK | DEF | SPD | Area |
|-------|-------|----|----|-----|-----|------|
| 🐌 Snail | 1-5 | 30 | 5 | 2 | 3 | Forest |
| 🐝 Bee | 1-5 | 25 | 8 | 1 | 12 | Forest |
| 🎃 Pumpkin | 1-5 | 40 | 6 | 3 | 5 | Forest |
| 🐗 Boar | 5-10 | 60 | 12 | 5 | 8 | Dark Forest |
| 👻 Spirit | 10-15 | 80 | 18 | 4 | 15 | Haunted Woods |
| ☁️ Cloud | 15-25 | 120 | 25 | 8 | 10 | Sky Realm |

---

## 🎁 LOOT SYSTEM

### **Drop Rates**
- Common items: 40% chance
- Uncommon items: 25% chance (Level 5+)
- Rare items: 5% chance (Level 10+)

### **Loot Items** (Placeholder - gelecek)
- health_potion_small
- mana_potion_small
- leather_scrap
- iron_ore
- common_weapon
- rare_weapon
- rare_armor
- magic_gem

---

## ⚖️ BALANCE

### **Enemy Scaling**
```
enemyPower = baseStats * (1 + level * 0.15)
playerPower = baseStats * (1 + level * 0.15)
```
Enemy %10 daha zayıf (player advantage)

### **XP Rewards**
```
xpReward = enemyLevel * 50 * enemyMultiplier
```

### **Coin Rewards**
```
coinReward = enemyLevel * 10 * enemyMultiplier
```

### **Cooldown**
- Adventure: 30 saniye

---

## 🚀 SONRAKİ ADIMLAR

### **1. Item System** (Öncelik)
- Item database
- Equipment system
- Inventory management
- Item effects (stat bonuses)

### **2. Skills System**
- Class-specific skills
- Mana cost
- Cooldowns
- Skill buttons in combat

### **3. Raid System** (Sosyal)
- Multi-player dungeons
- Raid invitations
- Shared loot
- Boss fights

### **4. Shop System**
- Buy/Sell items
- RPG Coin economy

### **5. Crafting System**
- Combine materials
- Create items

---

## 🎮 TEST SENARYOSU

1. `/rpg create` - Warrior seç
2. `/rpg profil` - Stats kontrol et
3. `/rpg adventure` - Forest'ta savaş
4. Attack/Defend/Flee butonlarını test et
5. Victory/Defeat senaryolarını test et
6. Level up test et
7. Cooldown test et
8. Farklı area'ları test et

---

## 📝 NOTLAR

- ✅ Tüm resimler pixel art style
- ✅ Combat tamamen turn-based
- ✅ Button-based interface
- ✅ Real-time updates
- ✅ Mevcut sistemler etkilenmedi
- ✅ Cooldown sistemi var
- ✅ HP/Mana tracking
- ✅ Victory/Defeat handling

---

## 🎨 KULLANILAN ASSETLER

```
assets/
├── enemies/
│   ├── snail.png (✅)
│   ├── bee.png (✅)
│   ├── pumpkin.png (✅)
│   ├── boar.png (✅)
│   ├── cursed_spirit.png (✅)
│   └── cloud_monster.png (✅)
├── characters/
│   ├── warrior.png (✅)
│   └── warrior_attack.png (✅)
├── backgrounds/
│   └── forest.png (✅)
└── ui/
    └── hud_base.png (✅)
```

---

**Combat System Tamamlandı! 🎉**

Şimdi test edebilirsin veya Item System'e geçebiliriz! 🚀
