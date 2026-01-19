"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketService = exports.MarketService = void 0;
const databaseService_1 = require("./databaseService");
const logger_1 = require("../utils/logger");
class MarketService {
    async addItem(guildId, roleId, roleName, price, addedBy) {
        try {
            const config = await databaseService_1.databaseService.getConfig(guildId) || {};
            if (!config.marketItems)
                config.marketItems = [];
            const item = {
                roleId,
                roleName,
                price,
                addedBy,
                addedAt: new Date()
            };
            config.marketItems.push(item);
            await databaseService_1.databaseService.saveConfig(guildId, config);
            logger_1.Logger.success('Market ürünü eklendi', { roleId, price });
        }
        catch (error) {
            logger_1.Logger.error('Market ürünü eklenemedi', error);
        }
    }
    async removeItem(guildId, roleId) {
        try {
            const config = await databaseService_1.databaseService.getConfig(guildId) || {};
            if (!config.marketItems)
                return false;
            const initialLength = config.marketItems.length;
            config.marketItems = config.marketItems.filter((item) => item.roleId !== roleId);
            if (config.marketItems.length < initialLength) {
                await databaseService_1.databaseService.saveConfig(guildId, config);
                logger_1.Logger.success('Market ürünü silindi', { roleId });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.Logger.error('Market ürünü silinemedi', error);
            return false;
        }
    }
    async updatePrice(guildId, roleId, newPrice) {
        try {
            const config = await databaseService_1.databaseService.getConfig(guildId) || {};
            if (!config.marketItems)
                return false;
            const item = config.marketItems.find((item) => item.roleId === roleId);
            if (item) {
                item.price = newPrice;
                await databaseService_1.databaseService.saveConfig(guildId, config);
                logger_1.Logger.success('Market ürün fiyatı güncellendi', { roleId, newPrice });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.Logger.error('Market ürün fiyatı güncellenemedi', error);
            return false;
        }
    }
    async getItems(guildId) {
        try {
            const config = await databaseService_1.databaseService.getConfig(guildId) || {};
            return config.marketItems || [];
        }
        catch (error) {
            logger_1.Logger.error('Market ürünleri getirilemedi', error);
            return [];
        }
    }
    async getItem(guildId, roleId) {
        try {
            const items = await this.getItems(guildId);
            return items.find(item => item.roleId === roleId) || null;
        }
        catch (error) {
            logger_1.Logger.error('Market ürünü getirilemedi', error);
            return null;
        }
    }
}
exports.MarketService = MarketService;
exports.marketService = new MarketService();
