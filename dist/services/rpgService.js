"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpgService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
const rpg_1 = require("../types/rpg");
// Class Multipliers
const CLASS_MULTIPLIERS = {
    [rpg_1.RPGClass.WARRIOR]: { str: 1.4, dex: 0.9, int: 0.6, vit: 1.3, agi: 0.8 },
    [rpg_1.RPGClass.MAGE]: { str: 0.6, dex: 0.9, int: 1.6, vit: 0.8, agi: 1.1 },
    [rpg_1.RPGClass.ARCHER]: { str: 1.1, dex: 1.3, int: 0.7, vit: 0.9, agi: 1.4 },
    [rpg_1.RPGClass.ASSASSIN]: { str: 1.2, dex: 1.5, int: 0.7, vit: 0.7, agi: 1.6 },
    [rpg_1.RPGClass.CLERIC]: { str: 0.8, dex: 1.0, int: 1.3, vit: 1.2, agi: 0.9 }
};
class RPGService {
    // Calculate XP needed for next level
    calculateXPToNextLevel(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    }
    // Calculate derived stats from base stats
    calculateDerivedStats(character) {
        const multipliers = CLASS_MULTIPLIERS[character.class];
        // Get equipment bonuses
        const { EquipmentService } = require('./equipmentService');
        const equipmentBonuses = EquipmentService.calculateEquipmentBonuses(character);
        // Apply equipment bonuses to base stats
        const totalStr = character.stats.str + equipmentBonuses.str;
        const totalDex = character.stats.dex + equipmentBonuses.dex;
        const totalInt = character.stats.int + equipmentBonuses.int;
        const totalVit = character.stats.vit + equipmentBonuses.vit;
        const totalAgi = character.stats.agi + equipmentBonuses.agi;
        // Apply class multipliers
        const effectiveStr = totalStr * multipliers.str;
        const effectiveDex = totalDex * multipliers.dex;
        const effectiveInt = totalInt * multipliers.int;
        const effectiveVit = totalVit * multipliers.vit;
        const effectiveAgi = totalAgi * multipliers.agi;
        // Calculate derived stats
        const maxHp = 50 + Math.floor(effectiveVit * 10);
        const maxMana = 30 + Math.floor(effectiveInt * 5);
        const attack = Math.floor(effectiveStr * 2);
        const magicAttack = Math.floor(effectiveInt * 2);
        const defense = Math.floor(effectiveStr);
        const speed = Math.floor(effectiveAgi);
        const critChance = effectiveDex * 0.5; // %
        const dodgeChance = effectiveAgi * 0.3; // %
        return {
            hp: character.currentHp,
            maxHp,
            mana: character.currentMana,
            maxMana,
            attack,
            magicAttack,
            defense,
            speed,
            critChance,
            dodgeChance
        };
    }
    // Create new character
    async createCharacter(userId, name, characterClass) {
        // Base stats (same for all classes, multipliers applied in calculations)
        const baseStats = {
            str: 10,
            dex: 10,
            int: 10,
            vit: 10,
            agi: 10
        };
        const character = {
            userId,
            name,
            class: characterClass,
            level: 1,
            xp: 0,
            xpToNextLevel: this.calculateXPToNextLevel(1),
            stats: baseStats,
            currentHp: 50 + baseStats.vit * 10,
            currentMana: 30 + baseStats.int * 5,
            rpgCoin: 100, // Starting RPG coin
            inventory: [],
            maxInventorySize: 20,
            equipment: {},
            totalKills: 0,
            totalDeaths: 0,
            dungeonsCompleted: 0,
            raidsCompleted: 0,
            createdAt: new Date()
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'rpgCharacters', userId), {
            ...character,
            createdAt: character.createdAt.toISOString(),
            lastAdventure: null,
            lastDungeon: null,
            lastRaid: null
        });
        logger_1.Logger.success('RPG Character created', { userId, name, class: characterClass });
        return character;
    }
    // Get character
    async getCharacter(userId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'rpgCharacters', userId));
            if (!docSnap.exists())
                return null;
            const data = docSnap.data();
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                lastAdventure: data.lastAdventure ? new Date(data.lastAdventure) : undefined,
                lastDungeon: data.lastDungeon ? new Date(data.lastDungeon) : undefined,
                lastRaid: data.lastRaid ? new Date(data.lastRaid) : undefined
            };
        }
        catch (error) {
            logger_1.Logger.error('getCharacter error', error);
            return null;
        }
    }
    // Update character
    async updateCharacter(character) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'rpgCharacters', character.userId), {
                ...character,
                createdAt: character.createdAt.toISOString(),
                lastAdventure: character.lastAdventure?.toISOString() || null,
                lastDungeon: character.lastDungeon?.toISOString() || null,
                lastRaid: character.lastRaid?.toISOString() || null
            });
            logger_1.Logger.success('RPG Character updated', { userId: character.userId });
        }
        catch (error) {
            logger_1.Logger.error('updateCharacter error', error);
        }
    }
    // Add XP and handle level up
    async addXP(character, xp) {
        character.xp += xp;
        let leveledUp = false;
        let newLevel = character.level;
        while (character.xp >= character.xpToNextLevel) {
            character.xp -= character.xpToNextLevel;
            character.level++;
            newLevel = character.level;
            leveledUp = true;
            // Increase stats on level up
            character.stats.str += 2;
            character.stats.dex += 2;
            character.stats.int += 2;
            character.stats.vit += 2;
            character.stats.agi += 2;
            // Recalculate XP needed for next level
            character.xpToNextLevel = this.calculateXPToNextLevel(character.level);
            // Heal to full on level up
            const derivedStats = this.calculateDerivedStats(character);
            character.currentHp = derivedStats.maxHp;
            character.currentMana = derivedStats.maxMana;
            logger_1.Logger.success('Character leveled up', { userId: character.userId, newLevel });
        }
        await this.updateCharacter(character);
        return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
    }
    // Economy: Calculate exchange rates
    async calculateExchangeRates() {
        try {
            // Get all players
            const playersSnap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'players'));
            let totalServerCoin = 0;
            playersSnap.forEach(doc => {
                const player = doc.data();
                totalServerCoin += player.balance || 0;
            });
            // Get all RPG characters
            const charactersSnap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'rpgCharacters'));
            let totalRPGCoin = 0;
            charactersSnap.forEach(doc => {
                const character = doc.data();
                totalRPGCoin += character.rpgCoin || 0;
            });
            // Prevent division by zero
            if (totalServerCoin === 0)
                totalServerCoin = 1;
            if (totalRPGCoin === 0)
                totalRPGCoin = 1;
            // Calculate rates (scarcity = value)
            // If RPG coin is scarce, it's more valuable
            const serverToRPGRate = totalRPGCoin / totalServerCoin;
            const rpgToServerRate = totalServerCoin / totalRPGCoin;
            const rate = {
                totalServerCoin,
                totalRPGCoin,
                serverToRPGRate,
                rpgToServerRate,
                lastUpdate: new Date()
            };
            // Save to database
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'rpgEconomy', 'rates'), {
                ...rate,
                lastUpdate: rate.lastUpdate.toISOString()
            });
            return rate;
        }
        catch (error) {
            logger_1.Logger.error('calculateExchangeRates error', error);
            // Return default rates
            return {
                totalServerCoin: 1,
                totalRPGCoin: 1,
                serverToRPGRate: 1,
                rpgToServerRate: 1,
                lastUpdate: new Date()
            };
        }
    }
    // Get current exchange rates
    async getExchangeRates() {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'rpgEconomy', 'rates'));
            if (!docSnap.exists()) {
                return await this.calculateExchangeRates();
            }
            const data = docSnap.data();
            return {
                ...data,
                lastUpdate: new Date(data.lastUpdate)
            };
        }
        catch (error) {
            logger_1.Logger.error('getExchangeRates error', error);
            return await this.calculateExchangeRates();
        }
    }
    // Exchange server coin to RPG coin
    async exchangeServerToRPG(userId, serverCoinAmount) {
        const rates = await this.getExchangeRates();
        const rpgCoinAmount = Math.floor(serverCoinAmount * rates.serverToRPGRate);
        // Update rates after exchange
        await this.calculateExchangeRates();
        return rpgCoinAmount;
    }
    // Exchange RPG coin to server coin
    async exchangeRPGToServer(userId, rpgCoinAmount) {
        const rates = await this.getExchangeRates();
        const serverCoinAmount = Math.floor(rpgCoinAmount * rates.rpgToServerRate);
        // Update rates after exchange
        await this.calculateExchangeRates();
        return serverCoinAmount;
    }
}
exports.rpgService = new RPGService();
