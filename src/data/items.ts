import { RPGItem, ItemType, ItemRarity } from '../types/rpg';

export const ITEMS: Record<string, RPGItem> = {
  // WEAPONS
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A basic wooden sword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    level: 1,
    stats: { str: 2 },
    price: 50,
    sellPrice: 10,
    stackable: false,
    maxStack: 1
  },
  'iron_sword': {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    level: 5,
    stats: { str: 5 },
    price: 200,
    sellPrice: 50,
    stackable: false,
    maxStack: 1
  },
  'steel_sword': {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'A sharp steel sword',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    level: 10,
    stats: { str: 10, dex: 3 },
    price: 800,
    sellPrice: 200,
    stackable: false,
    maxStack: 1
  },
  'magic_staff': {
    id: 'magic_staff',
    name: 'Magic Staff',
    description: 'A staff imbued with magic',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    level: 5,
    stats: { int: 8 },
    price: 250,
    sellPrice: 60,
    stackable: false,
    maxStack: 1
  },
  'wooden_bow': {
    id: 'wooden_bow',
    name: 'Wooden Bow',
    description: 'A simple wooden bow',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    level: 1,
    stats: { dex: 3 },
    price: 60,
    sellPrice: 15,
    stackable: false,
    maxStack: 1
  },
  'leather_armor': {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic leather protection',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    level: 1,
    stats: { vit: 3 },
    price: 80,
    sellPrice: 20,
    stackable: false,
    maxStack: 1
  },
  'iron_armor': {
    id: 'iron_armor',
    name: 'Iron Armor',
    description: 'Sturdy iron armor',
    type: ItemType.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    level: 5,
    stats: { vit: 7, str: 2 },
    price: 300,
    sellPrice: 75,
    stackable: false,
    maxStack: 1
  },
  'power_ring': {
    id: 'power_ring',
    name: 'Ring of Power',
    description: 'Increases strength',
    type: ItemType.ACCESSORY,
    rarity: ItemRarity.RARE,
    level: 5,
    stats: { str: 5, vit: 3 },
    price: 500,
    sellPrice: 125,
    stackable: false,
    maxStack: 1
  },
  'health_potion': {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 50 HP',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    level: 1,
    price: 30,
    sellPrice: 5,
    stackable: true,
    maxStack: 99
  },
  'mana_potion': {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 30 Mana',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    level: 1,
    price: 25,
    sellPrice: 5,
    stackable: true,
    maxStack: 99
  },
  'slime_gel': {
    id: 'slime_gel',
    name: 'Slime Gel',
    description: 'Sticky gel from slimes',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    level: 1,
    price: 5,
    sellPrice: 1,
    stackable: true,
    maxStack: 99
  }
};

export function getItem(itemId: string): RPGItem | undefined {
  return ITEMS[itemId];
}

export function getShopItems(): RPGItem[] {
  return Object.values(ITEMS).filter(item => 
    item.type !== ItemType.MATERIAL
  ).sort((a, b) => a.price - b.price);
}
