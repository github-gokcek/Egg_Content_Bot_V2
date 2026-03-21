"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.MARKET_ITEMS = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
exports.MARKET_ITEMS = [
    { id: 'custom_title', name: 'Custom Title', price: 5000, description: 'Özel bir unvan al', emoji: '👑' },
    { id: 'derank', name: 'Derank', price: 1000, description: 'Birisinin yetkisini 1 gün düşür', emoji: '⬇️' },
    { id: 'private_room', name: 'Özel Oda', price: 5000, description: 'Kendine özel 5 kişilik ses odası aç', emoji: '🚪' },
    { id: 'sticker_add', name: 'Sticker Ekleme', price: 2000, description: 'Sunucuya özel sticker ekle (admin onayı)', emoji: '🎭' },
    { id: 'pin', name: 'Pin', price: 500, description: 'Bir mesajı sabitle', emoji: '📌' },
    { id: 'trashtalk', name: 'Trashtalk', price: 100, description: 'Birine trashtalk at', emoji: '💬' },
];
class InventoryService {
    async getUserInventory(userId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'inventories', userId));
            if (docSnap.exists()) {
                return docSnap.data();
            }
            const newInventory = {
                userId,
                items: []
            };
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'inventories', userId), newInventory);
            return newInventory;
        }
        catch (error) {
            logger_1.Logger.error('getUserInventory error', error);
            return { userId, items: [] };
        }
    }
    async addItem(userId, itemId) {
        try {
            const marketItem = exports.MARKET_ITEMS.find(i => i.id === itemId);
            if (!marketItem) {
                throw new Error('Item not found in market');
            }
            const item = {
                id: itemId,
                name: marketItem.name,
                type: itemId,
                acquiredAt: new Date().toISOString(),
                used: false
            };
            const inventory = await this.getUserInventory(userId);
            inventory.items.push(item);
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'inventories', userId), inventory);
            logger_1.Logger.success('Item added to inventory', { userId, itemId });
        }
        catch (error) {
            logger_1.Logger.error('addItem error', error);
            throw error;
        }
    }
    async useItem(userId, itemType, metadata) {
        try {
            const inventory = await this.getUserInventory(userId);
            const item = inventory.items.find(i => i.type === itemType && !i.used);
            if (!item) {
                return null;
            }
            item.used = true;
            item.usedAt = new Date().toISOString();
            if (metadata) {
                item.metadata = metadata;
            }
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'inventories', userId), inventory);
            logger_1.Logger.success('Item used', { userId, itemType });
            return item;
        }
        catch (error) {
            logger_1.Logger.error('useItem error', error);
            return null;
        }
    }
    async hasItem(userId, itemType) {
        try {
            const inventory = await this.getUserInventory(userId);
            return inventory.items.some(i => i.type === itemType && !i.used);
        }
        catch (error) {
            logger_1.Logger.error('hasItem error', error);
            return false;
        }
    }
    async getItemCount(userId, itemType) {
        try {
            const inventory = await this.getUserInventory(userId);
            return inventory.items.filter(i => i.type === itemType && !i.used).length;
        }
        catch (error) {
            logger_1.Logger.error('getItemCount error', error);
            return 0;
        }
    }
}
exports.inventoryService = new InventoryService();
