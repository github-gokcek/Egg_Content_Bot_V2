"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnemyGenerator = exports.AREA_ENEMIES = exports.ENEMY_TEMPLATES = void 0;
// Enemy Templates
exports.ENEMY_TEMPLATES = {
    // Level 1-5 Enemies
    snail: {
        name: 'Forest Snail',
        baseHp: 80,
        baseAttack: 8,
        baseDefense: 3,
        baseSpeed: 3,
        xpMultiplier: 1.0,
        coinMultiplier: 1.0,
        image: 'snail.png',
        emoji: '🐌'
    },
    bee: {
        name: 'Wild Bee',
        baseHp: 70,
        baseAttack: 12,
        baseDefense: 2,
        baseSpeed: 12,
        xpMultiplier: 1.2,
        coinMultiplier: 1.1,
        image: 'bee.png',
        emoji: '🐝'
    },
    pumpkin: {
        name: 'Cursed Pumpkin',
        baseHp: 100,
        baseAttack: 10,
        baseDefense: 5,
        baseSpeed: 5,
        xpMultiplier: 1.3,
        coinMultiplier: 1.2,
        image: 'pumpkin.png',
        emoji: '🎃'
    },
    // Level 5-10 Enemies
    boar: {
        name: 'Wild Boar',
        baseHp: 150,
        baseAttack: 18,
        baseDefense: 8,
        baseSpeed: 8,
        xpMultiplier: 1.5,
        coinMultiplier: 1.4,
        image: 'boar.png',
        emoji: '🐗'
    },
    // Level 10-15 Enemies
    cursed_spirit: {
        name: 'Cursed Spirit',
        baseHp: 200,
        baseAttack: 25,
        baseDefense: 6,
        baseSpeed: 15,
        xpMultiplier: 2.0,
        coinMultiplier: 1.8,
        image: 'cursed_spirit.png',
        emoji: '👻'
    },
    // Level 15+ Enemies
    cloud_monster: {
        name: 'Cloud Monster',
        baseHp: 280,
        baseAttack: 35,
        baseDefense: 12,
        baseSpeed: 10,
        xpMultiplier: 2.5,
        coinMultiplier: 2.2,
        image: 'cloud_monster.png',
        emoji: '☁️'
    }
};
// Area-based enemy pools
exports.AREA_ENEMIES = {
    forest: {
        name: 'Peaceful Forest',
        minLevel: 1,
        maxLevel: 5,
        enemies: ['snail', 'bee', 'pumpkin'],
        background: 'forest.png'
    },
    dark_forest: {
        name: 'Dark Forest',
        minLevel: 5,
        maxLevel: 10,
        enemies: ['boar', 'pumpkin', 'cursed_spirit'],
        background: 'forest.png'
    },
    haunted_woods: {
        name: 'Haunted Woods',
        minLevel: 10,
        maxLevel: 15,
        enemies: ['cursed_spirit', 'cloud_monster'],
        background: 'forest.png'
    },
    sky_realm: {
        name: 'Sky Realm',
        minLevel: 15,
        maxLevel: 25,
        enemies: ['cloud_monster', 'cursed_spirit'],
        background: 'forest.png'
    }
};
// Loot tables by rarity
const COMMON_LOOT = [
    { itemId: 'health_potion_small', chance: 40, minAmount: 1, maxAmount: 2 },
    { itemId: 'mana_potion_small', chance: 30, minAmount: 1, maxAmount: 2 },
    { itemId: 'leather_scrap', chance: 20, minAmount: 1, maxAmount: 3 }
];
const UNCOMMON_LOOT = [
    { itemId: 'health_potion', chance: 25, minAmount: 1, maxAmount: 1 },
    { itemId: 'iron_ore', chance: 15, minAmount: 1, maxAmount: 2 },
    { itemId: 'common_weapon', chance: 10, minAmount: 1, maxAmount: 1 }
];
const RARE_LOOT = [
    { itemId: 'rare_weapon', chance: 5, minAmount: 1, maxAmount: 1 },
    { itemId: 'rare_armor', chance: 4, minAmount: 1, maxAmount: 1 },
    { itemId: 'magic_gem', chance: 3, minAmount: 1, maxAmount: 1 }
];
class EnemyGenerator {
    // Generate enemy based on player level
    static generateEnemy(playerLevel, areaKey) {
        // Determine area
        let area = exports.AREA_ENEMIES.forest;
        if (areaKey && exports.AREA_ENEMIES[areaKey]) {
            area = exports.AREA_ENEMIES[areaKey];
        }
        else {
            // Auto-select area based on player level
            for (const [key, areaData] of Object.entries(exports.AREA_ENEMIES)) {
                if (playerLevel >= areaData.minLevel && playerLevel <= areaData.maxLevel) {
                    area = areaData;
                    break;
                }
            }
        }
        // Select random enemy from area
        const enemyKey = area.enemies[Math.floor(Math.random() * area.enemies.length)];
        const template = exports.ENEMY_TEMPLATES[enemyKey];
        // Calculate enemy level (±2 from player level, within area bounds)
        const levelVariance = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let enemyLevel = Math.max(1, playerLevel + levelVariance);
        enemyLevel = Math.max(area.minLevel, Math.min(area.maxLevel, enemyLevel));
        // Scale stats based on level
        const levelMultiplier = 1 + (enemyLevel - 1) * 0.25;
        const hp = Math.floor(template.baseHp * levelMultiplier);
        const attack = Math.floor(template.baseAttack * levelMultiplier);
        const defense = Math.floor(template.baseDefense * levelMultiplier);
        const speed = Math.floor(template.baseSpeed * levelMultiplier);
        // Calculate rewards
        const xpReward = Math.floor(enemyLevel * 50 * template.xpMultiplier);
        const coinReward = Math.floor(enemyLevel * 10 * template.coinMultiplier);
        // Generate loot table
        const lootTable = [
            ...COMMON_LOOT,
            ...(enemyLevel >= 5 ? UNCOMMON_LOOT : []),
            ...(enemyLevel >= 10 ? RARE_LOOT : [])
        ];
        return {
            id: `${enemyKey}_${Date.now()}`,
            name: `${template.name} (Lv.${enemyLevel})`,
            level: enemyLevel,
            hp,
            maxHp: hp,
            attack,
            defense,
            speed,
            xpReward,
            coinReward,
            lootTable
        };
    }
    // Generate boss enemy (2x stronger)
    static generateBoss(playerLevel, areaKey) {
        const normalEnemy = this.generateEnemy(playerLevel, areaKey);
        return {
            ...normalEnemy,
            name: `💀 BOSS: ${normalEnemy.name}`,
            hp: normalEnemy.hp * 2,
            maxHp: normalEnemy.maxHp * 2,
            attack: Math.floor(normalEnemy.attack * 1.5),
            defense: Math.floor(normalEnemy.defense * 1.5),
            xpReward: normalEnemy.xpReward * 3,
            coinReward: normalEnemy.coinReward * 5,
            lootTable: [
                ...normalEnemy.lootTable,
                ...RARE_LOOT,
                { itemId: 'epic_weapon', chance: 10, minAmount: 1, maxAmount: 1 },
                { itemId: 'legendary_gem', chance: 5, minAmount: 1, maxAmount: 1 }
            ]
        };
    }
    // Get enemy image path
    static getEnemyImage(enemyName) {
        for (const [key, template] of Object.entries(exports.ENEMY_TEMPLATES)) {
            if (enemyName.includes(template.name)) {
                return template.image;
            }
        }
        return 'snail.png'; // default
    }
    // Get enemy emoji
    static getEnemyEmoji(enemyName) {
        for (const [key, template] of Object.entries(exports.ENEMY_TEMPLATES)) {
            if (enemyName.includes(template.name)) {
                return template.emoji;
            }
        }
        return '👾'; // default
    }
}
exports.EnemyGenerator = EnemyGenerator;
