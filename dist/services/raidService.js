"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaidService = void 0;
const enemyService_1 = require("./enemyService");
const bossTraits_1 = require("../data/bossTraits");
class RaidService {
    // Generate 3 bosses for raid (stronger than normal enemies)
    static generateRaidBosses(averageLevel) {
        const bosses = [];
        // Boss 1: Mini Boss (2x stronger)
        const boss1 = enemyService_1.EnemyGenerator.generateEnemy(averageLevel, undefined);
        const trait1 = (0, bossTraits_1.getRandomBossTrait)();
        boss1.name = `💀 ${boss1.name} Boss`;
        boss1.maxHp = Math.floor(boss1.maxHp * 2);
        boss1.hp = boss1.maxHp;
        boss1.attack = Math.floor(boss1.attack * 1.5);
        boss1.defense = Math.floor(boss1.defense * 1.5);
        boss1.xpReward = Math.floor(boss1.xpReward * 2);
        boss1.coinReward = Math.floor(boss1.coinReward * 2);
        boss1.trait = trait1.id;
        boss1.traitTurnCounter = 0;
        bosses.push(boss1);
        // Boss 2: Elite Boss (3x stronger)
        const boss2 = enemyService_1.EnemyGenerator.generateEnemy(averageLevel + 2, undefined);
        const trait2 = (0, bossTraits_1.getRandomBossTrait)();
        boss2.name = `👹 ${boss2.name} Elite`;
        boss2.maxHp = Math.floor(boss2.maxHp * 3);
        boss2.hp = boss2.maxHp;
        boss2.attack = Math.floor(boss2.attack * 2);
        boss2.defense = Math.floor(boss2.defense * 2);
        boss2.xpReward = Math.floor(boss2.xpReward * 3);
        boss2.coinReward = Math.floor(boss2.coinReward * 3);
        boss2.trait = trait2.id;
        boss2.traitTurnCounter = 0;
        bosses.push(boss2);
        // Boss 3: Final Boss (4x stronger)
        const boss3 = enemyService_1.EnemyGenerator.generateEnemy(averageLevel + 5, undefined);
        const trait3 = (0, bossTraits_1.getRandomBossTrait)();
        boss3.name = `🔥 ${boss3.name} Lord`;
        boss3.maxHp = Math.floor(boss3.maxHp * 4);
        boss3.hp = boss3.maxHp;
        boss3.attack = Math.floor(boss3.attack * 2.5);
        boss3.defense = Math.floor(boss3.defense * 2.5);
        boss3.xpReward = Math.floor(boss3.xpReward * 4);
        boss3.coinReward = Math.floor(boss3.coinReward * 4);
        boss3.trait = trait3.id;
        boss3.traitTurnCounter = 0;
        bosses.push(boss3);
        return bosses;
    }
    // Calculate turn order based on speed
    static calculateTurnOrder(participants) {
        return participants
            .sort((a, b) => b.speed - a.speed)
            .map(p => p.userId);
    }
    // Get next turn user
    static getNextTurnUser(currentUserId, turnOrder) {
        const currentIndex = turnOrder.indexOf(currentUserId);
        const nextIndex = (currentIndex + 1) % turnOrder.length;
        return turnOrder[nextIndex];
    }
}
exports.RaidService = RaidService;
