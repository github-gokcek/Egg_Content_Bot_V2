"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatService = void 0;
const rpgService_1 = require("./rpgService");
const logger_1 = require("../utils/logger");
class CombatService {
    // Calculate damage
    static calculateDamage(attack, defense, critChance, isMagic = false) {
        // Base damage formula
        let damage = attack - Math.floor(defense / 2);
        damage = Math.max(1, damage); // Minimum 1 damage
        // Random variance (90% - 110%)
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        // Critical hit check
        const isCrit = Math.random() * 100 < critChance;
        if (isCrit) {
            damage = Math.floor(damage * 1.75);
        }
        return { damage, isCrit };
    }
    // Check dodge
    static checkDodge(dodgeChance) {
        return Math.random() * 100 < dodgeChance;
    }
    // Execute combat turn
    static executeTurn(character, characterStats, enemy, action, isDefending = false) {
        const turn = {
            playerAction: action.type,
            playerDamage: 0,
            enemyDamage: 0,
            isCrit: false,
            isDodged: false,
            playerHpAfter: character.currentHp,
            enemyHpAfter: enemy.hp
        };
        // Player action
        if (action.type === 'attack') {
            // Check if enemy dodges
            const enemyDodgeChance = enemy.speed * 0.3;
            const enemyDodged = this.checkDodge(enemyDodgeChance);
            if (!enemyDodged) {
                const { damage, isCrit } = this.calculateDamage(characterStats.attack, enemy.defense, characterStats.critChance);
                turn.playerDamage = damage;
                turn.isCrit = isCrit;
                enemy.hp = Math.max(0, enemy.hp - damage);
            }
            else {
                turn.isDodged = true;
            }
        }
        else if (action.type === 'defend') {
            // Defending reduces incoming damage by 50%
            turn.playerAction = 'defend';
        }
        // Enemy turn (if still alive)
        if (enemy.hp > 0) {
            // Check if player dodges
            const playerDodged = this.checkDodge(characterStats.dodgeChance);
            if (!playerDodged) {
                const enemyCritChance = enemy.speed * 0.3;
                let { damage, isCrit } = this.calculateDamage(enemy.attack, characterStats.defense, enemyCritChance);
                // Apply defense bonus if defending
                if (isDefending) {
                    damage = Math.floor(damage * 0.5);
                }
                turn.enemyDamage = damage;
                character.currentHp = Math.max(0, character.currentHp - damage);
            }
        }
        turn.playerHpAfter = character.currentHp;
        turn.enemyHpAfter = enemy.hp;
        return turn;
    }
    // Process combat result
    static async processCombatResult(character, enemy, victory) {
        const result = {
            victory,
            damageDealt: enemy.maxHp - enemy.hp,
            damageTaken: rpgService_1.rpgService.calculateDerivedStats(character).maxHp - character.currentHp,
            xpGained: 0,
            coinGained: 0,
            itemsLooted: [],
            leveledUp: false
        };
        if (victory) {
            // Award XP
            result.xpGained = enemy.xpReward;
            const levelUpResult = await rpgService_1.rpgService.addXP(character, enemy.xpReward);
            result.leveledUp = levelUpResult.leveledUp;
            result.newLevel = levelUpResult.newLevel;
            // Award coins
            result.coinGained = enemy.coinReward;
            character.rpgCoin += enemy.coinReward;
            // Process loot
            for (const loot of enemy.lootTable) {
                const roll = Math.random() * 100;
                if (roll < loot.chance) {
                    const amount = Math.floor(Math.random() * (loot.maxAmount - loot.minAmount + 1) + loot.minAmount);
                    result.itemsLooted.push({ itemId: loot.itemId, amount });
                    // Add to inventory
                    const existingItem = character.inventory.find(i => i.itemId === loot.itemId && !i.equipped);
                    if (existingItem) {
                        existingItem.amount += amount;
                    }
                    else {
                        character.inventory.push({
                            itemId: loot.itemId,
                            amount: amount,
                            equipped: false
                        });
                    }
                }
            }
            // Update stats
            character.totalKills++;
            await rpgService_1.rpgService.updateCharacter(character);
            logger_1.Logger.success('Combat victory', {
                userId: character.userId,
                enemy: enemy.name,
                xp: result.xpGained,
                coin: result.coinGained
            });
        }
        else {
            // Defeat
            character.totalDeaths++;
            // Respawn with 50% HP
            const derivedStats = rpgService_1.rpgService.calculateDerivedStats(character);
            character.currentHp = Math.floor(derivedStats.maxHp * 0.5);
            await rpgService_1.rpgService.updateCharacter(character);
            logger_1.Logger.info('Combat defeat', {
                userId: character.userId,
                enemy: enemy.name
            });
        }
        return result;
    }
    // Calculate flee chance
    static calculateFleeChance(characterSpeed, enemySpeed) {
        const speedDiff = characterSpeed - enemySpeed;
        let fleeChance = 50 + speedDiff * 2; // Base 50%, ±2% per speed difference
        return Math.max(10, Math.min(90, fleeChance)); // Clamp between 10-90%
    }
    // Attempt to flee
    static attemptFlee(characterSpeed, enemySpeed) {
        const fleeChance = this.calculateFleeChance(characterSpeed, enemySpeed);
        return Math.random() * 100 < fleeChance;
    }
    // Generate combat log message
    static generateCombatLog(turn, turnNumber) {
        let log = '';
        if (turnNumber) {
            log += `**Turn ${turnNumber}**\n`;
        }
        // Player action
        if (turn.playerAction === 'attack') {
            if (turn.isDodged) {
                log += '> Your attack missed! Enemy dodged.\n';
            }
            else {
                log += `> You attack! ${turn.playerDamage} damage`;
                if (turn.isCrit)
                    log += ' **CRITICAL HIT!**';
                log += '\n';
            }
        }
        else if (turn.playerAction === 'defend') {
            log += '> You take a defensive stance! (50% damage reduction)\n';
        }
        // Enemy action
        if (turn.enemyHpAfter > 0) {
            if (turn.enemyDamage === 0 && turn.playerAction === 'attack') {
                log += '> Enemy attack missed! You dodged.\n';
            }
            else if (turn.enemyDamage > 0) {
                log += `> Enemy attacks! ${turn.enemyDamage} damage\n`;
            }
        }
        return log;
    }
    // Create HP bar
    static createHPBar(current, max, length = 10) {
        // Ensure values are valid
        current = Math.max(0, current);
        max = Math.max(1, max);
        const percentage = current / max;
        const filled = Math.floor(percentage * length);
        const empty = Math.max(0, length - filled);
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}
exports.CombatService = CombatService;
