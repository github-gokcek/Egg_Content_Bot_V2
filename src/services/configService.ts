import { Logger } from '../utils/logger';
import { databaseService } from './databaseService';

interface ChannelConfig {
  guildId: string;
  gameChannels: {
    lol?: string;
    tft?: string;
  };
  winnerLogChannels: {
    lol?: string;
    tft?: string;
  };
  devChannel?: string;
  leaderboardChannel?: string;
}

export class ConfigService {
  private configs: Map<string, ChannelConfig> = new Map();

  async getConfig(guildId: string): Promise<ChannelConfig> {
    if (!this.configs.has(guildId)) {
      // Firebase'den yükle
      const savedConfig = await databaseService.getConfig(guildId);
      const config: ChannelConfig = savedConfig || {
        guildId,
        gameChannels: {},
        winnerLogChannels: {}
      };
      this.configs.set(guildId, config);
    }
    return this.configs.get(guildId)!;
  }

  async setGameChannel(guildId: string, game: 'lol' | 'tft', channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    config.gameChannels[game] = channelId;
    await databaseService.saveConfig(guildId, config); // Firebase'e kaydet
    Logger.success(`${game.toUpperCase()} oyun kanalı ayarlandı`, { guildId, channelId });
  }

  async setWinnerLogChannel(guildId: string, game: 'lol' | 'tft', channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    config.winnerLogChannels[game] = channelId;
    await databaseService.saveConfig(guildId, config); // Firebase'e kaydet
    Logger.success(`${game.toUpperCase()} sonuç kanalı ayarlandı`, { guildId, channelId });
  }

  async disableGameChannel(guildId: string, game: 'lol' | 'tft'): Promise<boolean> {
    const config = await this.getConfig(guildId);
    if (config.gameChannels[game]) {
      delete config.gameChannels[game];
      await databaseService.saveConfig(guildId, config); // Firebase'e kaydet
      Logger.info(`${game.toUpperCase()} oyun kanalı devre dışı bırakıldı`, { guildId });
      return true;
    }
    return false;
  }

  async disableWinnerLogChannel(guildId: string, game: 'lol' | 'tft'): Promise<boolean> {
    const config = await this.getConfig(guildId);
    if (config.winnerLogChannels[game]) {
      delete config.winnerLogChannels[game];
      await databaseService.saveConfig(guildId, config); // Firebase'e kaydet
      Logger.info(`${game.toUpperCase()} sonuç kanalı devre dışı bırakıldı`, { guildId });
      return true;
    }
    return false;
  }

  async getGameChannel(guildId: string, game: 'lol' | 'tft'): Promise<string | undefined> {
    const config = await this.getConfig(guildId);
    return config.gameChannels[game];
  }

  async getWinnerLogChannel(guildId: string, game: 'lol' | 'tft'): Promise<string | undefined> {
    const config = await this.getConfig(guildId);
    return config.winnerLogChannels[game];
  }

  async setLeaderboardChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    config.leaderboardChannel = channelId;
    await databaseService.saveConfig(guildId, config);
    Logger.success('Liderlik kanalı ayarlandı', { guildId, channelId });
  }

  async getLeaderboardChannel(guildId: string): Promise<string | undefined> {
    const config = await this.getConfig(guildId);
    return config.leaderboardChannel;
  }

  async setDevChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    config.devChannel = channelId;
    await databaseService.saveConfig(guildId, config);
    Logger.success('Test kanalı ayarlandı', { guildId, channelId });
  }

  async getDevChannel(guildId: string): Promise<string | undefined> {
    const config = await this.getConfig(guildId);
    return config.devChannel;
  }
}

export const configService = new ConfigService();
