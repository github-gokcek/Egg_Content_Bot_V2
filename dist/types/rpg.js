"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemRarity = exports.ItemType = exports.RPGClass = void 0;
// RPG Character Classes
var RPGClass;
(function (RPGClass) {
    RPGClass["WARRIOR"] = "warrior";
    RPGClass["MAGE"] = "mage";
    RPGClass["ARCHER"] = "archer";
    RPGClass["ASSASSIN"] = "assassin";
    RPGClass["CLERIC"] = "cleric";
})(RPGClass || (exports.RPGClass = RPGClass = {}));
// Item Types
var ItemType;
(function (ItemType) {
    ItemType["WEAPON"] = "weapon";
    ItemType["ARMOR"] = "armor";
    ItemType["ACCESSORY"] = "accessory";
    ItemType["CONSUMABLE"] = "consumable";
    ItemType["MATERIAL"] = "material";
})(ItemType || (exports.ItemType = ItemType = {}));
// Item Rarity
var ItemRarity;
(function (ItemRarity) {
    ItemRarity["COMMON"] = "common";
    ItemRarity["UNCOMMON"] = "uncommon";
    ItemRarity["RARE"] = "rare";
    ItemRarity["EPIC"] = "epic";
    ItemRarity["LEGENDARY"] = "legendary";
    ItemRarity["MYTHIC"] = "mythic";
})(ItemRarity || (exports.ItemRarity = ItemRarity = {}));
