"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITEMS = void 0;
exports.getItem = getItem;
exports.getShopItems = getShopItems;
const rpg_1 = require("../types/rpg");
exports.ITEMS = {
    // WEAPONS
    'wooden_sword': {
        id: 'wooden_sword',
        name: 'Wooden Sword',
        description: 'A basic wooden sword',
        type: rpg_1.ItemType.WEAPON,
        rarity: rpg_1.ItemRarity.COMMON,
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
        type: rpg_1.ItemType.WEAPON,
        rarity: rpg_1.ItemRarity.UNCOMMON,
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
        type: rpg_1.ItemType.WEAPON,
        rarity: rpg_1.ItemRarity.RARE,
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
        type: rpg_1.ItemType.WEAPON,
        rarity: rpg_1.ItemRarity.UNCOMMON,
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
        type: rpg_1.ItemType.WEAPON,
        rarity: rpg_1.ItemRarity.COMMON,
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
        type: rpg_1.ItemType.ARMOR,
        rarity: rpg_1.ItemRarity.COMMON,
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
        type: rpg_1.ItemType.ARMOR,
        rarity: rpg_1.ItemRarity.UNCOMMON,
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
        type: rpg_1.ItemType.ACCESSORY,
        rarity: rpg_1.ItemRarity.RARE,
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
        type: rpg_1.ItemType.CONSUMABLE,
        rarity: rpg_1.ItemRarity.COMMON,
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
        type: rpg_1.ItemType.CONSUMABLE,
        rarity: rpg_1.ItemRarity.COMMON,
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
        type: rpg_1.ItemType.MATERIAL,
        rarity: rpg_1.ItemRarity.COMMON,
        level: 1,
        price: 5,
        sellPrice: 1,
        stackable: true,
        maxStack: 99
    }
};
function getItem(itemId) {
    return exports.ITEMS[itemId];
}
function getShopItems() {
    return Object.values(exports.ITEMS).filter(item => item.type !== rpg_1.ItemType.MATERIAL).sort((a, b) => a.price - b.price);
}
