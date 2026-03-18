import { RPGClass } from '../types/rpg';

export interface Skill {
  id: string;
  name: string;
  description: string;
  class: RPGClass;
  manaCost: number;
  cooldown: number; // turns
  levelRequired: number;
  effect: {
    type: 'damage' | 'heal' | 'buff' | 'debuff';
    value: number; // multiplier or flat value
    target: 'self' | 'enemy' | 'party';
  };
}

export const SKILLS: Record<string, Skill> = {
  // WARRIOR SKILLS
  'power_strike': {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Güçlü bir saldırı (150% damage)',
    class: RPGClass.WARRIOR,
    manaCost: 10,
    cooldown: 2,
    levelRequired: 3,
    effect: {
      type: 'damage',
      value: 1.5,
      target: 'enemy'
    }
  },
  'shield_bash': {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Kalkanla vur ve 2 turn savunma bonusu al',
    class: RPGClass.WARRIOR,
    manaCost: 15,
    cooldown: 3,
    levelRequired: 5,
    effect: {
      type: 'buff',
      value: 1.5,
      target: 'self'
    }
  },

  // MAGE SKILLS
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    description: 'Ateş topu fırlat (200% magic damage)',
    class: RPGClass.MAGE,
    manaCost: 20,
    cooldown: 2,
    levelRequired: 3,
    effect: {
      type: 'damage',
      value: 2.0,
      target: 'enemy'
    }
  },
  'ice_barrier': {
    id: 'ice_barrier',
    name: 'Ice Barrier',
    description: 'Buz kalkanı (75% damage reduction, 2 turn)',
    class: RPGClass.MAGE,
    manaCost: 25,
    cooldown: 4,
    levelRequired: 7,
    effect: {
      type: 'buff',
      value: 0.75,
      target: 'self'
    }
  },

  // ARCHER SKILLS
  'aimed_shot': {
    id: 'aimed_shot',
    name: 'Aimed Shot',
    description: 'Nişanlı atış (garantili critical)',
    class: RPGClass.ARCHER,
    manaCost: 15,
    cooldown: 3,
    levelRequired: 3,
    effect: {
      type: 'damage',
      value: 1.75,
      target: 'enemy'
    }
  },
  'rapid_fire': {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: '3 hızlı ok (3x 60% damage)',
    class: RPGClass.ARCHER,
    manaCost: 20,
    cooldown: 4,
    levelRequired: 6,
    effect: {
      type: 'damage',
      value: 1.8,
      target: 'enemy'
    }
  },

  // ASSASSIN SKILLS
  'backstab': {
    id: 'backstab',
    name: 'Backstab',
    description: 'Arkadan bıçakla (250% damage)',
    class: RPGClass.ASSASSIN,
    manaCost: 18,
    cooldown: 3,
    levelRequired: 3,
    effect: {
      type: 'damage',
      value: 2.5,
      target: 'enemy'
    }
  },
  'shadow_step': {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Gölgelere karış (100% dodge, 1 turn)',
    class: RPGClass.ASSASSIN,
    manaCost: 15,
    cooldown: 4,
    levelRequired: 5,
    effect: {
      type: 'buff',
      value: 1.0,
      target: 'self'
    }
  },

  // CLERIC SKILLS
  'heal': {
    id: 'heal',
    name: 'Heal',
    description: 'Kendini iyileştir (50% max HP)',
    class: RPGClass.CLERIC,
    manaCost: 20,
    cooldown: 3,
    levelRequired: 3,
    effect: {
      type: 'heal',
      value: 0.5,
      target: 'self'
    }
  },
  'holy_smite': {
    id: 'holy_smite',
    name: 'Holy Smite',
    description: 'Kutsal darbe (180% magic damage)',
    class: RPGClass.CLERIC,
    manaCost: 18,
    cooldown: 2,
    levelRequired: 5,
    effect: {
      type: 'damage',
      value: 1.8,
      target: 'enemy'
    }
  }
};

// Get skills by class
export function getSkillsByClass(characterClass: RPGClass): Skill[] {
  return Object.values(SKILLS).filter(skill => skill.class === characterClass);
}

// Get skill by ID
export function getSkill(skillId: string): Skill | undefined {
  return SKILLS[skillId];
}

// Get available skills for character (based on level)
export function getAvailableSkills(characterClass: RPGClass, level: number): Skill[] {
  return getSkillsByClass(characterClass).filter(skill => skill.levelRequired <= level);
}
