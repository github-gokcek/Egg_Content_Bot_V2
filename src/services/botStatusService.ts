import { Logger } from '../utils/logger';

type BotMode = 'live' | 'dev';

export class BotStatusService {
  private mode: BotMode = 'live';

  setMode(mode: BotMode): void {
    this.mode = mode;
    Logger.success(`Bot modu değiştirildi: ${mode.toUpperCase()}`, { mode });
  }

  getMode(): BotMode {
    return this.mode;
  }

  isLiveMode(): boolean {
    return this.mode === 'live';
  }

  isDevMode(): boolean {
    return this.mode === 'dev';
  }

  // Test modu mesajları
  getTestMessage(action: string): string {
    return `🧪 **TEST MODU** - ${action} yapılabilir durumda ancak test modunda gerçekleştirilmedi.`;
  }

  // Test kanalına mesaj gönder
  async sendToDevChannel(client: any, guildId: string, message: string): Promise<void> {
    try {
      const { configService } = await import('./configService');
      const devChannelId = await configService.getDevChannel(guildId);
      
      if (devChannelId) {
        const channel = await client.channels.fetch(devChannelId);
        if (channel?.isTextBased()) {
          await channel.send(`🧪 **TEST MODU LOG:** ${message}`);
        }
      }
    } catch (error) {
      console.error('Test kanalına mesaj gönderilemedi:', error);
    }
  }

  // Simülasyon ID'leri oluştur
  generateTestId(): string {
    return `TEST_${Date.now()}`;
  }
}

export const botStatusService = new BotStatusService();