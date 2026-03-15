import { GuildMember } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { Logger } from '../utils/logger';
import { Player } from '../types';

module.exports = {
  name: 'guildMemberAdd',
  async execute(member: GuildMember) {
    try {
      // Botları kontrol et
      if (member.user.bot) return;

      // Oyuncunun zaten hesabı olup olmadığını kontrol et
      const existingPlayer = await databaseService.getPlayer(member.id);
      
      if (!existingPlayer) {
        // Yeni oyuncu oluştur (0 gold ile başla)
        const newPlayer: Player = {
          discordId: member.id,
          username: member.user.username,
          balance: 0,
          voicePackets: 0,
          createdAt: new Date(),
          stats: {
            lol: {
              wins: 0,
              losses: 0
            },
            tft: {
              matches: 0,
              top4: 0,
              rankings: [],
              points: 0
            }
          }
        };

        await databaseService.savePlayer(newPlayer);
        Logger.success('Yeni oyuncu otomatik kaydedildi', { userId: member.id, username: member.user.username });
      }
    } catch (error) {
      Logger.error('Oyuncu kaydı sırasında hata oluştu', error);
    }
  }
};
