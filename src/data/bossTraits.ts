export enum BossTraitType {
  TRIPLE_STRIKE = 'triple_strike',
  THICK_SKIN = 'thick_skin',
  SLEEP_ATTACK = 'sleep_attack',
  RAGE_MODE = 'rage_mode',
  COUNTER_ATTACK = 'counter_attack',
  LIFE_STEAL = 'life_steal',
  POISON_AURA = 'poison_aura',
  SHIELD_BREAK = 'shield_break',
  CRITICAL_MASTER = 'critical_master',
  SPEED_DEMON = 'speed_demon',
  BERSERKER = 'berserker',
  MAGIC_REFLECT = 'magic_reflect',
  ARMOR_PIERCE = 'armor_pierce',
  REGENERATION = 'regeneration',
  ENRAGE = 'enrage'
}

export interface BossTrait {
  id: BossTraitType;
  name: string;
  description: string;
  emoji: string;
  // Trait effects
  onAttack?: (damage: number, turnCount: number) => { damage: number; message?: string };
  onDefend?: (damage: number) => { damage: number; message?: string };
  onTurnStart?: (boss: any, turnCount: number) => { skipTurn?: boolean; message?: string };
  onTurnEnd?: (boss: any, turnCount: number) => { heal?: number; message?: string };
  onHit?: (damage: number, attacker: any) => { counterDamage?: number; statusEffect?: string; message?: string };
  damageModifier?: {
    physical?: number; // multiplier (0.5 = 50% less, 1.5 = 50% more)
    magical?: number;
  };
}

export const BOSS_TRAITS: Record<BossTraitType, BossTrait> = {
  [BossTraitType.TRIPLE_STRIKE]: {
    id: BossTraitType.TRIPLE_STRIKE,
    name: '⚡ Triple Strike',
    description: 'Her 3 saldırıda bir, sonraki saldırısı 3 kat hasar verir!',
    emoji: '⚡',
    onAttack: (damage: number, turnCount: number) => {
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
    onHit: (damage: number, attacker: any) => {
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
    onAttack: (damage: number, turnCount: number) => {
      // This will be checked in combat handler based on boss HP
      return { damage };
    }
  },

  [BossTraitType.COUNTER_ATTACK]: {
    id: BossTraitType.COUNTER_ATTACK,
    name: '🔄 Counter Attack',
    description: 'Saldırıya uğradığında %30 ihtimalle karşı saldırı yapar (aldığı hasarın %50\'si kadar).',
    emoji: '🔄',
    onHit: (damage: number, attacker: any) => {
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
    onAttack: (damage: number, turnCount: number) => {
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
    onTurnStart: (boss: any, turnCount: number) => {
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
    onDefend: (damage: number) => {
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
    onAttack: (damage: number, turnCount: number) => {
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
    onAttack: (damage: number, turnCount: number) => {
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
    onAttack: (damage: number, turnCount: number) => {
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
    onAttack: (damage: number, turnCount: number) => {
      return { damage }; // Will be handled in damage calculation
    }
  },

  [BossTraitType.REGENERATION]: {
    id: BossTraitType.REGENERATION,
    name: '💚 Regeneration',
    description: 'Her tur sonunda maksimum HP\'sinin %5\'i kadar can yeniler.',
    emoji: '💚',
    onTurnEnd: (boss: any, turnCount: number) => {
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
    onAttack: (damage: number, turnCount: number) => {
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
export function getRandomBossTrait(): BossTrait {
  const traits = Object.values(BOSS_TRAITS);
  return traits[Math.floor(Math.random() * traits.length)];
}

// Get trait by ID
export function getBossTrait(traitId: BossTraitType): BossTrait | undefined {
  return BOSS_TRAITS[traitId];
}
