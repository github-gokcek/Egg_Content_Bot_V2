import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Logger } from '../utils/logger';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'custom_title' | 'derank' | 'private_room' | 'sticker_add' | 'pin' | 'trashtalk';
  acquiredAt: string;
  used: boolean;
  usedAt?: string;
  metadata?: any;
}

export interface UserInventory {
  userId: string;
  items: InventoryItem[];
}

export const MARKET_ITEMS = [
  { id: 'custom_title', name: 'Custom Title', price: 5000, description: 'Özel bir unvan al', emoji: '👑' },
  { id: 'derank', name: 'Derank', price: 1000, description: 'Birisinin yetkisini 1 gün düşür', emoji: '⬇️' },
  { id: 'private_room', name: 'Özel Oda', price: 5000, description: 'Kendine özel 5 kişilik ses odası aç', emoji: '🚪' },
  { id: 'sticker_add', name: 'Sticker Ekleme', price: 2000, description: 'Sunucuya özel sticker ekle (admin onayı)', emoji: '🎭' },
  { id: 'pin', name: 'Pin', price: 500, description: 'Bir mesajı sabitle', emoji: '📌' },
  { id: 'trashtalk', name: 'Trashtalk', price: 100, description: 'Birine trashtalk at', emoji: '💬' },
];

class InventoryService {
  async getUserInventory(userId: string): Promise<UserInventory> {
    try {
      const docSnap = await getDoc(doc(db, 'inventories', userId));
      if (docSnap.exists()) {
        return docSnap.data() as UserInventory;
      }
      
      const newInventory: UserInventory = {
        userId,
        items: []
      };
      await setDoc(doc(db, 'inventories', userId), newInventory);
      return newInventory;
    } catch (error) {
      Logger.error('getUserInventory error', error);
      return { userId, items: [] };
    }
  }

  async addItem(userId: string, itemId: string): Promise<void> {
    try {
      const marketItem = MARKET_ITEMS.find(i => i.id === itemId);
      if (!marketItem) {
        throw new Error('Item not found in market');
      }

      const item: InventoryItem = {
        id: itemId,
        name: marketItem.name,
        type: itemId as any,
        acquiredAt: new Date().toISOString(),
        used: false
      };

      const inventory = await this.getUserInventory(userId);
      inventory.items.push(item);
      
      await setDoc(doc(db, 'inventories', userId), inventory);
      Logger.success('Item added to inventory', { userId, itemId });
    } catch (error) {
      Logger.error('addItem error', error);
      throw error;
    }
  }

  async useItem(userId: string, itemType: string, metadata?: any): Promise<InventoryItem | null> {
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

      await setDoc(doc(db, 'inventories', userId), inventory);
      Logger.success('Item used', { userId, itemType });
      return item;
    } catch (error) {
      Logger.error('useItem error', error);
      return null;
    }
  }

  async hasItem(userId: string, itemType: string): Promise<boolean> {
    try {
      const inventory = await this.getUserInventory(userId);
      return inventory.items.some(i => i.type === itemType && !i.used);
    } catch (error) {
      Logger.error('hasItem error', error);
      return false;
    }
  }

  async getItemCount(userId: string, itemType: string): Promise<number> {
    try {
      const inventory = await this.getUserInventory(userId);
      return inventory.items.filter(i => i.type === itemType && !i.used).length;
    } catch (error) {
      Logger.error('getItemCount error', error);
      return 0;
    }
  }
}

export const inventoryService = new InventoryService();
