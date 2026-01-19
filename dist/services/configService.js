"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = exports.ConfigService = void 0;
const logger_1 = require("../utils/logger");
const databaseService_1 = require("./databaseService");
class ConfigService {
    configs = new Map();
    async getConfig(guildId) {
        if (!this.configs.has(guildId)) {
            // Firebase'den yükle
            const savedConfig = await databaseService_1.databaseService.getConfig(guildId);
            const config = savedConfig || {
                guildId,
                gameChannels: {},
                winnerLogChannels: {}
            };
            this.configs.set(guildId, config);
        }
        return this.configs.get(guildId);
    }
    async setGameChannel(guildId, game, channelId) {
        const config = await this.getConfig(guildId);
        config.gameChannels[game] = channelId;
        await databaseService_1.databaseService.saveConfig(guildId, config); // Firebase'e kaydet
        logger_1.Logger.success(`${game.toUpperCase()} oyun kanalı ayarlandı`, { guildId, channelId });
    }
    async setWinnerLogChannel(guildId, game, channelId) {
        const config = await this.getConfig(guildId);
        config.winnerLogChannels[game] = channelId;
        await databaseService_1.databaseService.saveConfig(guildId, config); // Firebase'e kaydet
        logger_1.Logger.success(`${game.toUpperCase()} sonuç kanalı ayarlandı`, { guildId, channelId });
    }
    async disableGameChannel(guildId, game) {
        const config = await this.getConfig(guildId);
        if (config.gameChannels[game]) {
            delete config.gameChannels[game];
            await databaseService_1.databaseService.saveConfig(guildId, config); // Firebase'e kaydet
            logger_1.Logger.info(`${game.toUpperCase()} oyun kanalı devre dışı bırakıldı`, { guildId });
            return true;
        }
        return false;
    }
    async disableWinnerLogChannel(guildId, game) {
        const config = await this.getConfig(guildId);
        if (config.winnerLogChannels[game]) {
            delete config.winnerLogChannels[game];
            await databaseService_1.databaseService.saveConfig(guildId, config); // Firebase'e kaydet
            logger_1.Logger.info(`${game.toUpperCase()} sonuç kanalı devre dışı bırakıldı`, { guildId });
            return true;
        }
        return false;
    }
    async getGameChannel(guildId, game) {
        const config = await this.getConfig(guildId);
        return config.gameChannels[game];
    }
    async getWinnerLogChannel(guildId, game) {
        const config = await this.getConfig(guildId);
        return config.winnerLogChannels[game];
    }
    async setLeaderboardChannel(guildId, channelId) {
        const config = await this.getConfig(guildId);
        config.leaderboardChannel = channelId;
        await databaseService_1.databaseService.saveConfig(guildId, config);
        logger_1.Logger.success('Liderlik kanalı ayarlandı', { guildId, channelId });
    }
    async getLeaderboardChannel(guildId) {
        const config = await this.getConfig(guildId);
        return config.leaderboardChannel;
    }
    async setDevChannel(guildId, channelId) {
        const config = await this.getConfig(guildId);
        config.devChannel = channelId;
        await databaseService_1.databaseService.saveConfig(guildId, config);
        logger_1.Logger.success('Test kanalı ayarlandı', { guildId, channelId });
    }
    async getDevChannel(guildId) {
        const config = await this.getConfig(guildId);
        return config.devChannel;
    }
}
exports.ConfigService = ConfigService;
exports.configService = new ConfigService();
