"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOSS_TRAITS = exports.BossTraitType = void 0;
exports.getRandomBossTrait = getRandomBossTrait;
exports.getBossTrait = getBossTrait;
var BossTraitType;
(function (BossTraitType) {
    BossTraitType["TRIPLE_STRIKE"] = "triple_strike";
    BossTraitType["THICK_SKIN"] = "thick_skin";
    BossTraitType["SLEEP_ATTACK"] = "sleep_attack";
    BossTraitType["RAGE_MODE"] = "rage_mode";
    BossTraitType["COUNTER_ATTACK"] = "counter_attack";
    BossTraitType["LIFE_STEAL"] = "life_steal";
    BossTraitType["POISON_AURA"] = "poison_aura";
    BossTraitType["SHIELD_BREAK"] = "shield_break";
    BossTraitType["CRITICAL_MASTER"] = "critical_master";
    BossTraitType["SPEED_DEMON"] = "speed_demon";
    BossTraitType["BERSERKER"] = "berserker";
    BossTraitType["MAGIC_REFLECT"] = "magic_reflect";
    BossTraitType["ARMOR_PIERCE"] = "armor_pierce";
    BossTraitType["REGENERATION"] = "regeneration";
    BossTraitType["ENRAGE"] = "enrage";
})(BossTraitType || (exports.BossTraitType = BossTraitType = {}));
exports.BOSS_TRAITS = {
    [BossTraitType.TRIPLE_STRIKE]: {
        id: BossTraitType.TRIPLE_STRIKE,
        name: '⚡ Triple Strike',
        description: 'Her 3 saldırıda bir, sonraki saldırısı 3 kat hasar verir!',
        emoji: '⚡',
        onAttack: (damage, turnCount) => {
            if (turnCount % 3 === 0) {
                return {
                    damage: damage * 3,
                    message: '⚡ **TRIPLE STRIKE!** Boss 3 kat hasar vurdu!'
                };
            }
            return { damage };
        }
    },
    [BossTraitType.THICK_SKIN]: {
        id: BossTraitType.THICK_SKIN,
        name: '🛡️ Thick Skin',
        description: 'Derisi çok kalın. Fiziksel saldırılardan %50 az hasar alır, büyülerden %50 fazla hasar alır.',
        emoji: '🛡️',
        damageModifier: {
            physical: 0.5,
            magical: 1.5
        }
    },
    [BossTraitType.SLEEP_ATTACK]: {
        id: BossTraitType.SLEEP_ATTACK,
        name: '😴 Sleep Attack',
        description: 'Her saldırısında %20 ihtimalle hedefini uyutur. Uyutulan oyuncu bir tur aksiyon alamaz.',
        emoji: '😴',
        onHit: (damage, attacker) => {
            if (Math.random() < 0.2) {
                return {
                    statusEffect: 'sleep',
                    message: '😴 **UYUTULDU!** Bir sonraki turunu kaçıracaksın!'
                };
            }
            return {};
        }
    },
    [BossTraitType.RAGE_MODE]: {
        id: BossTraitType.RAGE_MODE,
        name: '😡 Rage Mode',
        description: 'HP %30\'un altına düştüğünde öfkelenir ve saldırı gücü 2 katına çıkar.',
        emoji: '😡',
        onAttack: (damage, turnCount) => {
            // This will be checked in combat handler based on boss HP
            return { damage };
        }
    },
    [BossTraitType.COUNTER_ATTACK]: {
        id: BossTraitType.COUNTER_ATTACK,
        name: '🔄 Counter Attack',
        description: 'Saldırıya uğradığında %30 ihtimalle karşı saldırı yapar (aldığı hasarın %50\'si kadar).',
        emoji: '🔄',
        onHit: (damage, attacker) => {
            if (Math.random() < 0.3) {
                return {
                    counterDamage: Math.floor(damage * 0.5),
                    message: '🔄 **COUNTER ATTACK!** Boss karşı saldırı yaptı!'
                };
            }
            return {};
        }
    },
    [BossTraitType.LIFE_STEAL]: {
        id: BossTraitType.LIFE_STEAL,
        name: '🩸 Life Steal',
        description: 'Her saldırısında verdiği hasarın %30\'u kadar can kazanır.',
        emoji: '🩸',
        onAttack: (damage, turnCount) => {
            return {
                damage,
                message: `🩸 Boss ${Math.floor(damage * 0.3)} HP çaldı!`
            };
        }
    },
    [BossTraitType.POISON_AURA]: {
        id: BossTraitType.POISON_AURA,
        name: '☠️ Poison Aura',
        description: 'Her tur başında tüm oyunculara 10 zehir hasarı verir.',
        emoji: '☠️',
        onTurnStart: (boss, turnCount) => {
            return {
                message: '☠️ **POISON AURA!** Tüm oyuncular 10 zehir hasarı aldı!'
            };
        }
    },
    [BossTraitType.SHIELD_BREAK]: {
        id: BossTraitType.SHIELD_BREAK,
        name: '🔨 Shield Break',
        description: 'Defend yapan oyunculara %75 hasar verir (normal %50 yerine).',
        emoji: '🔨',
        onDefend: (damage) => {
            return {
                damage: Math.floor(damage * 0.75),
                message: '🔨 **SHIELD BREAK!** Savunma kırıldı!'
            };
        }
    },
    [BossTraitType.CRITICAL_MASTER]: {
        id: BossTraitType.CRITICAL_MASTER,
        name: '🎯 Critical Master',
        description: 'Kritik şansı %50. Kritik vurduğunda 2.5 kat hasar verir.',
        emoji: '🎯',
        onAttack: (damage, turnCount) => {
            if (Math.random() < 0.5) {
                return {
                    damage: Math.floor(damage * 2.5),
                    message: '🎯 **CRITICAL HIT!** Boss kritik vurdu!'
                };
            }
            return { damage };
        }
    },
    [BossTraitType.SPEED_DEMON]: {
        id: BossTraitType.SPEED_DEMON,
        name: '💨 Speed Demon',
        description: 'Her 2 turda bir, 2 kez saldırır.',
        emoji: '💨',
        onAttack: (damage, turnCount) => {
            if (turnCount % 2 === 0) {
                return {
                    damage: damage * 2,
                    message: '💨 **DOUBLE ATTACK!** Boss 2 kez saldırdı!'
                };
            }
            return { damage };
        }
    },
    [BossTraitType.BERSERKER]: {
        id: BossTraitType.BERSERKER,
        name: '⚔️ Berserker',
        description: 'HP azaldıkça güçlenir. Her %10 HP kaybında +%5 hasar.',
        emoji: '⚔️',
        onAttack: (damage, turnCount) => {
            // This will be calculated in combat handler based on HP percentage
            return { damage };
        }
    },
    [BossTraitType.MAGIC_REFLECT]: {
        id: BossTraitType.MAGIC_REFLECT,
        name: '🔮 Magic Reflect',
        description: 'Büyü saldırılarının %40\'ını geri yansıtır.',
        emoji: '🔮',
        damageModifier: {
            magical: 0.6 // Takes 60% magic damage, reflects 40%
        }
    },
    [BossTraitType.ARMOR_PIERCE]: {
        id: BossTraitType.ARMOR_PIERCE,
        name: '🗡️ Armor Pierce',
        description: 'Zırh delici saldırılar. Savunmayı %50 daha az etkili yapar.',
        emoji: '🗡️',
        onAttack: (damage, turnCount) => {
            return { damage }; // Will be handled in damage calculation
        }
    },
    [BossTraitType.REGENERATION]: {
        id: BossTraitType.REGENERATION,
        name: '💚 Regeneration',
        description: 'Her tur sonunda maksimum HP\'sinin %5\'i kadar can yeniler.',
        emoji: '💚',
        onTurnEnd: (boss, turnCount) => {
            const healAmount = Math.floor(boss.maxHp * 0.05);
            return {
                heal: healAmount,
                message: `💚 Boss ${healAmount} HP yeniledi!`
            };
        }
    },
    [BossTraitType.ENRAGE]: {
        id: BossTraitType.ENRAGE,
        name: '🔥 Enrage',
        description: 'Her 5 turda bir öfkelenir ve o turda aldığı hasar %50 azalır, verdiği hasar 2 katına çıkar.',
        emoji: '🔥',
        onAttack: (damage, turnCount) => {
            if (turnCount % 5 === 0) {
                return {
                    damage: damage * 2,
                    message: '🔥 **ENRAGED!** Boss öfkelendi!'
                };
            }
            return { damage };
        }
    }
};
// Get random trait for boss
function getRandomBossTrait() {
    const traits = Object.values(exports.BOSS_TRAITS);
    return traits[Math.floor(Math.random() * traits.length)];
}
// Get trait by ID
function getBossTrait(traitId) {
    return exports.BOSS_TRAITS[traitId];
}
