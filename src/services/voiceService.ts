import { Guild, ChannelType, VoiceChannel, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../utils/logger';

export class VoiceService {
  async createMatchVoiceChannels(guild: Guild, matchId: string, playerIds: string[]): Promise<VoiceChannel[]> {
    try {
      const category = await guild.channels.create({
        name: `🎮 Maç #${matchId}`,
        type: ChannelType.GuildCategory,
      });

      const channels: VoiceChannel[] = [];

      // Mavi takım kanalı
      const blueChannel = await guild.channels.create({
        name: '🔵 Mavi Takım',
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect],
          }
        ]
      }) as VoiceChannel;

      // Kırmızı takım kanalı
      const redChannel = await guild.channels.create({
        name: '🔴 Kırmızı Takım',
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect],
          }
        ]
      }) as VoiceChannel;

      channels.push(blueChannel, redChannel);

      // Oyuncuları kanallara taşı (5-5 dağıt)
      const halfPoint = Math.ceil(playerIds.length / 2);
      const blueTeam = playerIds.slice(0, halfPoint);
      const redTeam = playerIds.slice(halfPoint);

      // İzinleri ver ve taşı
      for (const playerId of blueTeam) {
        await blueChannel.permissionOverwrites.create(playerId, {
          Connect: true,
          Speak: true
        });
      }

      for (const playerId of redTeam) {
        await redChannel.permissionOverwrites.create(playerId, {
          Connect: true,
          Speak: true
        });
      }

      Logger.success('Maç ses kanalları oluşturuldu', { matchId, channelCount: channels.length });
      return channels;

    } catch (error) {
      Logger.error('Ses kanalları oluşturulamadı', error);
      return [];
    }
  }

  async createTftVoiceChannel(guild: Guild, matchId: string, playerIds: string[]): Promise<VoiceChannel | null> {
    try {
      const category = await guild.channels.create({
        name: `♟️ TFT Maç #${matchId}`,
        type: ChannelType.GuildCategory,
      });

      const channel = await guild.channels.create({
        name: '♟️ TFT Oyuncuları',
        type: ChannelType.GuildVoice,
        parent: category,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect],
          }
        ]
      }) as VoiceChannel;

      // Tüm oyunculara izin ver
      for (const playerId of playerIds) {
        await channel.permissionOverwrites.create(playerId, {
          Connect: true,
          Speak: true
        });
      }

      Logger.success('TFT ses kanalı oluşturuldu', { matchId, playerCount: playerIds.length });
      return channel;

    } catch (error) {
      Logger.error('TFT ses kanalı oluşturulamadı', error);
      return null;
    }
  }

  async movePlayersToChannels(guild: Guild, blueTeam: string[], redTeam: string[], blueChannel: VoiceChannel, redChannel: VoiceChannel): Promise<void> {
    try {
      // Mavi takımı taşı
      for (const playerId of blueTeam) {
        const member = await guild.members.fetch(playerId).catch(() => null);
        if (member?.voice.channel) {
          await member.voice.setChannel(blueChannel);
        }
      }

      // Kırmızı takımı taşı
      for (const playerId of redTeam) {
        const member = await guild.members.fetch(playerId).catch(() => null);
        if (member?.voice.channel) {
          await member.voice.setChannel(redChannel);
        }
      }

      Logger.success('Oyuncular ses kanallarına taşındı');
    } catch (error) {
      Logger.error('Oyuncular taşınamadı', error);
    }
  }

  async movePlayersToTftChannel(guild: Guild, playerIds: string[], channel: VoiceChannel): Promise<void> {
    try {
      for (const playerId of playerIds) {
        const member = await guild.members.fetch(playerId).catch(() => null);
        if (member?.voice.channel) {
          await member.voice.setChannel(channel);
        }
      }

      Logger.success('TFT oyuncuları ses kanalına taşındı');
    } catch (error) {
      Logger.error('TFT oyuncuları taşınamadı', error);
    }
  }

  async deleteMatchChannels(guild: Guild, matchId: string): Promise<void> {
    try {
      const categories = guild.channels.cache.filter(c => 
        c.type === ChannelType.GuildCategory && 
        (c.name.includes(`Maç #${matchId}`) || c.name.includes(`TFT Maç #${matchId}`))
      );

      for (const category of categories.values()) {
        // Kategori altındaki tüm kanalları sil
        const childChannels = guild.channels.cache.filter(c => c.parentId === category.id);
        for (const child of childChannels.values()) {
          await child.delete();
        }
        // Kategoriyi sil
        await category.delete();
      }

      Logger.success('Maç kanalları silindi', { matchId });
    } catch (error) {
      Logger.error('Maç kanalları silinemedi', error);
    }
  }
}

export const voiceService = new VoiceService();