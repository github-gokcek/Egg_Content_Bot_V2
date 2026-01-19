import { databaseService } from './databaseService';
import { Logger } from '../utils/logger';

interface MarketItem {
  roleId: string;
  roleName: string;
  price: number;
  addedBy: string;
  addedAt: Date;
}

export class MarketService {
  async addItem(guildId: string, roleId: string, roleName: string, price: number, addedBy: string): Promise<void> {
    try {
      const config = await databaseService.getConfig(guildId) || {};
      if (!config.marketItems) config.marketItems = [];

      const item: MarketItem = {
        roleId,
        roleName,
        price,
        addedBy,
        addedAt: new Date()
      };

      config.marketItems.push(item);
      await databaseService.saveConfig(guildId, config);
      Logger.success('Market ürünü eklendi', { roleId, price });
    } catch (error) {
      Logger.error('Market ürünü eklenemedi', error);
    }
  }

  async removeItem(guildId: string, roleId: string): Promise<boolean> {
    try {
      const config = await databaseService.getConfig(guildId) || {};
      if (!config.marketItems) return false;

      const initialLength = config.marketItems.length;
      config.marketItems = config.marketItems.filter((item: MarketItem) => item.roleId !== roleId);
      
      if (config.marketItems.length < initialLength) {
        await databaseService.saveConfig(guildId, config);
        Logger.success('Market ürünü silindi', { roleId });
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('Market ürünü silinemedi', error);
      return false;
    }
  }

  async updatePrice(guildId: string, roleId: string, newPrice: number): Promise<boolean> {
    try {
      const config = await databaseService.getConfig(guildId) || {};
      if (!config.marketItems) return false;

      const item = config.marketItems.find((item: MarketItem) => item.roleId === roleId);
      if (item) {
        item.price = newPrice;
        await databaseService.saveConfig(guildId, config);
        Logger.success('Market ürün fiyatı güncellendi', { roleId, newPrice });
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('Market ürün fiyatı güncellenemedi', error);
      return false;
    }
  }

  async getItems(guildId: string): Promise<MarketItem[]> {
    try {
      const config = await databaseService.getConfig(guildId) || {};
      return config.marketItems || [];
    } catch (error) {
      Logger.error('Market ürünleri getirilemedi', error);
      return [];
    }
  }

  async getItem(guildId: string, roleId: string): Promise<MarketItem | null> {
    try {
      const items = await this.getItems(guildId);
      return items.find(item => item.roleId === roleId) || null;
    } catch (error) {
      Logger.error('Market ürünü getirilemedi', error);
      return null;
    }
  }
}

export const marketService = new MarketService();