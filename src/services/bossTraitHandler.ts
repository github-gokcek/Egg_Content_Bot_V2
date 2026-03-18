import { Enemy, RaidCombat } from '../types/rpg';
import { getBossTrait, BossTraitType } from '../data/bossTraits';

export interface TraitEffectResult {
  damageModifier?: number;
  additionalDamage?: number;
  counterDamage?: number;
  statusEffect?: 'sleep';
  skipTurn?: boolean;
  heal?: number;
  messages: string[];
}

export class BossTraitHandler {
  // Apply trait effects on boss attack
  static applyTraitOnAttack(
    boss: Enemy,
    baseDamage: number,
    isDefending: boolean
  ): TraitEffectResult {
    const result: TraitEffectResult = { messages: [] };
    
    if (!boss.trait) return result;
    
    const trait = getBossTrait(boss.trait as BossTraitType);
    if (!trait) return result;

    boss.traitTurnCounter = (boss.traitTurnCounter || 0) + 1;
    let finalDamage = baseDamage;

    // Triple Strike
    if (trait.id === BossTraitType.TRIPLE_STRIKE && boss.traitTurnCounter % 3 === 0) {
      finalDamage = baseDamage * 3;
      result.messages.push('⚡ **TRIPLE STRIKE!** Boss 3 kat hasar vurdu!');
    }

    // Sleep Attack
    if (trait.id === BossTraitType.SLEEP_ATTACK && Math.random() < 0.2) {
      result.statusEffect = 'sleep';
      result.messages.push('😴 **UYUTULDU!** Bir sonraki turunu kaçıracaksın!');
    }

    // Rage Mode (HP < 30%)
    if (trait.id === BossTraitType.RAGE_MODE && boss.hp < boss.maxHp * 0.3) {
      finalDamage = baseDamage * 2;
      result.messages.push('😡 **RAGE MODE!** Boss öfkelendi ve 2 kat hasar vurdu!');
    }

    // Life Steal
    if (trait.id === BossTraitType.LIFE_STEAL) {
      const healAmount = Math.floor(baseDamage * 0.3);
      result.heal = healAmount;
      result.messages.push(`🩸 Boss ${healAmount} HP çaldı!`);
    }

    // Shield Break (if defending)
    if (trait.id === BossTraitType.SHIELD_BREAK && isDefending) {
      // Normally defend reduces to 50%, but Shield Break makes it 75%
      result.damageModifier = 0.75 / 0.5; // This will be multiplied with the 0.5 from defend
      result.messages.push('🔨 **SHIELD BREAK!** Savunma kırıldı!');
    }

    // Critical Master
    if (trait.id === BossTraitType.CRITICAL_MASTER && Math.random() < 0.5) {
      finalDamage = Math.floor(baseDamage * 2.5);
      result.messages.push('🎯 **CRITICAL HIT!** Boss kritik vurdu!');
    }

    // Speed Demon
    if (trait.id === BossTraitType.SPEED_DEMON && boss.traitTurnCounter % 2 === 0) {
      finalDamage = baseDamage * 2;
      result.messages.push('💨 **DOUBLE ATTACK!** Boss 2 kez saldırdı!');
    }

    // Berserker (damage increases as HP decreases)
    if (trait.id === BossTraitType.BERSERKER) {
      const hpPercent = (boss.hp / boss.maxHp) * 100;
      const damageBonus = Math.floor((100 - hpPercent) / 10) * 0.05; // +5% per 10% HP lost
      if (damageBonus > 0) {
        finalDamage = Math.floor(baseDamage * (1 + damageBonus));
        result.messages.push(`⚔️ **BERSERKER!** Boss güçlendi (+${Math.floor(damageBonus * 100)}% hasar)!`);
      }
    }

    // Armor Pierce
    if (trait.id === BossTraitType.ARMOR_PIERCE) {
      result.messages.push('🗡️ **ARMOR PIERCE!** Zırh delici saldırı!');
    }

    // Enrage (every 5 turns)
    if (trait.id === BossTraitType.ENRAGE && boss.traitTurnCounter % 5 === 0) {
      finalDamage = baseDamage * 2;
      result.messages.push('🔥 **ENRAGED!** Boss öfkelendi!');
    }

    result.additionalDamage = finalDamage - baseDamage;
    return result;
  }

  // Apply trait effects when boss takes damage
  static applyTraitOnHit(
    boss: Enemy,
    damageDealt: number,
    attackType: 'physical' | 'magical' = 'physical'
  ): TraitEffectResult {
    const result: TraitEffectResult = { messages: [] };
    
    if (!boss.trait) return result;
    
    const trait = getBossTrait(boss.trait as BossTraitType);
    if (!trait) return result;

    // Thick Skin
    if (trait.id === BossTraitType.THICK_SKIN) {
      if (attackType === 'physical') {
        result.damageModifier = 0.5;
        result.messages.push('🛡️ **THICK SKIN!** Fiziksel hasar azaltıldı!');
      } else {
        result.damageModifier = 1.5;
        result.messages.push('🛡️ **THICK SKIN!** Büyü hasarı arttı!');
      }
    }

    // Counter Attack
    if (trait.id === BossTraitType.COUNTER_ATTACK && Math.random() < 0.3) {
      result.counterDamage = Math.floor(damageDealt * 0.5);
      result.messages.push('🔄 **COUNTER ATTACK!** Boss karşı saldırı yaptı!');
    }

    // Magic Reflect
    if (trait.id === BossTraitType.MAGIC_REFLECT && attackType === 'magical') {
      result.counterDamage = Math.floor(damageDealt * 0.4);
      result.damageModifier = 0.6;
      result.messages.push('🔮 **MAGIC REFLECT!** Büyü yansıtıldı!');
    }

    // Enrage (damage reduction every 5 turns)
    if (trait.id === BossTraitType.ENRAGE && (boss.traitTurnCounter || 0) % 5 === 0) {
      result.damageModifier = 0.5;
      result.messages.push('🔥 **ENRAGED!** Boss aldığı hasarı azalttı!');
    }

    return result;
  }

  // Apply trait effects at turn start
  static applyTraitOnTurnStart(
    boss: Enemy,
    raid: RaidCombat
  ): TraitEffectResult {
    const result: TraitEffectResult = { messages: [] };
    
    if (!boss.trait) return result;
    
    const trait = getBossTrait(boss.trait as BossTraitType);
    if (!trait) return result;

    // Poison Aura
    if (trait.id === BossTraitType.POISON_AURA) {
      result.messages.push('☠️ **POISON AURA!** Tüm oyuncular 10 zehir hasarı aldı!');
      // Damage will be applied in the handler
    }

    return result;
  }

  // Apply trait effects at turn end
  static applyTraitOnTurnEnd(
    boss: Enemy
  ): TraitEffectResult {
    const result: TraitEffectResult = { messages: [] };
    
    if (!boss.trait) return result;
    
    const trait = getBossTrait(boss.trait as BossTraitType);
    if (!trait) return result;

    // Regeneration
    if (trait.id === BossTraitType.REGENERATION) {
      const healAmount = Math.floor(boss.maxHp * 0.05);
      result.heal = healAmount;
      boss.hp = Math.min(boss.hp + healAmount, boss.maxHp);
      result.messages.push(`💚 Boss ${healAmount} HP yeniledi!`);
    }

    return result;
  }

  // Get trait display info
  static getTraitInfo(boss: Enemy): string {
    if (!boss.trait) return '';
    
    const trait = getBossTrait(boss.trait as BossTraitType);
    if (!trait) return '';

    return `${trait.emoji} **${trait.name}**\n> ${trait.description}`;
  }
}
