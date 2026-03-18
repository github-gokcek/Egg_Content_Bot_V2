// RPG Character Classes
export enum RPGClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ARCHER = 'archer',
  ASSASSIN = 'assassin',
  CLERIC = 'cleric'
}

// Item Types
export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material'
}

// Item Rarity
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

// Base Stats
export interface RPGStats {
  str: number;  // Strength - melee damage
  dex: number;  // Dexterity - crit + dodge
  int: number;  // Intelligence - magic damage
  vit: number;  // Vitality - HP
  agi: number;  // Agility - speed
}

// Derived Stats (calculated from base stats)
export interface DerivedStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  magicAttack: number;
  defense: number;
  speed: number;
  critChance: number;
  dodgeChance: number;
}

// Class Multipliers
export interface ClassMultipliers {
  str: number;
  dex: number;
  int: number;
  vit: number;
  agi: number;
}

// RPG Item
export interface RPGItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  stats?: Partial<RPGStats>;
  price: number; // RPG Coin price
  sellPrice: number;
  stackable: boolean;
  maxStack: number;
}

// Character Inventory Item
export interface InventoryItem {
  itemId: string;
  amount: number;
  equipped: boolean;
}

// RPG Character
export interface RPGCharacter {
  userId: string;
  name: string;
  class: RPGClass;
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Base Stats
  stats: RPGStats;
  
  // Current HP/Mana
  currentHp: number;
  currentMana: number;
  
  // Currency
  rpgCoin: number;
  
  // Inventory
  inventory: InventoryItem[];
  maxInventorySize: number;
  
  // Equipment Slots
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  
  // Progression
  totalKills: number;
  totalDeaths: number;
  dungeonsCompleted: number;
  raidsCompleted: number;
  
  // Timestamps
  createdAt: Date;
  lastAdventure?: Date;
  lastDungeon?: Date;
  lastRaid?: Date;
  lastRest?: Date;
  dailyRaidCount?: number; // Günlük raid sayısı
  lastRaidReset?: Date; // Son raid reset tarihi
}

// Enemy
export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  coinReward: number;
  lootTable: LootDrop[];
  trait?: string; // Boss trait ID
  traitTurnCounter?: number; // For tracking trait-specific turn counts
}

// Loot Drop
export interface LootDrop {
  itemId: string;
  chance: number; // 0-100
  minAmount: number;
  maxAmount: number;
}

// Dungeon
export interface Dungeon {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  maxPlayers: number;
  enemies: Enemy[];
  bossEnemy: Enemy;
  rewards: LootDrop[];
  cooldown: number; // minutes
}

// Raid Combat State
export interface RaidCombat {
  id: string;
  groupId: string;
  participants: string[];
  currentBossIndex: number;
  bosses: Enemy[];
  currentTurnUserId: string;
  turnOrder: string[];
  turnCount: number;
  participantStates: {
    [userId: string]: {
      isDefending: boolean;
      hp: number;
      mana: number;
      isSleeping?: boolean; // For Sleep Attack trait
    };
  };
  combatLog: string[];
  messageId: string;
  startedAt: number;
  status: 'active' | 'completed' | 'failed';
}

// Combat Result
export interface CombatResult {
  victory: boolean;
  damageDealt: number;
  damageTaken: number;
  xpGained: number;
  coinGained: number;
  itemsLooted: { itemId: string; amount: number }[];
  leveledUp: boolean;
  newLevel?: number;
}

// Economy Exchange Rate
export interface EconomyRate {
  totalServerCoin: number;
  totalRPGCoin: number;
  serverToRPGRate: number; // 1 server coin = X rpg coin
  rpgToServerRate: number; // 1 rpg coin = X server coin
  lastUpdate: Date;
}
