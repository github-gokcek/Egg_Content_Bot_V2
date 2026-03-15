import { Events, VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../utils/logger';
import { voiceActivityService } from '../services/voiceActivityService';
import { voiceCoinService } from '../services/voiceCoinService';
import { PrivateRoomService } from '../services/privateRoomService';

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    // Voice activity tracking
    await voiceActivityService.handleVoiceStateUpdate(oldState, newState);
    
    // Voice coin tracking
    await voiceCoinService.handleVoiceStateUpdate(oldState, newState);

    // Private room system
    const privateRoomService = PrivateRoomService.getInstance();
    const guildId = newState.guild.id;

    // Kullanıcı trigger kanalına girdi
    if (newState.channel) {
      const triggerChannelId = await privateRoomService.getTriggerChannel(guildId);
      
      if (triggerChannelId === newState.channel.id) {
        try {
          const member = newState.member!;
          const guild = newState.guild;

          // "Özel odalar" kategorisini bul veya oluştur
          let category = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === '📁 Özel odalar'
          );

          if (!category) {
            category = await guild.channels.create({
              name: '📁 Özel odalar',
              type: ChannelType.GuildCategory,
            });
            await privateRoomService.setCategoryId(guildId, category.id);
          }

          // Kullanıcı için özel oda oluştur
          const privateChannel = await guild.channels.create({
            name: member.user.username,
            type: ChannelType.GuildVoice,
            parent: category.id,
            userLimit: 5,
            permissionOverwrites: [
              {
                id: member.id,
                allow: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels],
              },
              {
                id: guild.id,
                deny: [PermissionFlagsBits.ManageChannels],
              },
            ],
          });

          privateRoomService.addRoom(privateChannel.id, member.id, guildId);

          // Kullanıcıyı yeni odaya taşı (500ms delay)
          setTimeout(async () => {
            try {
              await member.voice.setChannel(privateChannel);
            } catch (error) {
              Logger.error('Kullanıcı özel odaya taşınamadı', error);
            }
          }, 500);

          Logger.info('Özel oda oluşturuldu', { userId: member.id, channelId: privateChannel.id });
        } catch (error) {
          Logger.error('Özel oda oluşturulurken hata', error);
        }
      }
    }

    // Kullanıcı özel odadan ayrıldı - oda boş mu kontrol et
    if (oldState.channel && privateRoomService.isPrivateRoom(oldState.channel.id)) {
      const channel = oldState.channel;
      
      // 1 saniye bekle (kullanıcı taşınma sırasında geçici olarak 0 olabilir)
      setTimeout(async () => {
        try {
          const updatedChannel = await channel.fetch();
          
          if (updatedChannel.members.size === 0) {
            privateRoomService.removeRoom(channel.id);
            await channel.delete();
            Logger.info('Boş özel oda silindi', { channelId: channel.id });

            // Kategoride başka özel oda var mı kontrol et
            const remainingRooms = privateRoomService.getRoomsByGuild(guildId);
            
            if (remainingRooms.length === 0) {
              const categoryId = await privateRoomService.getCategoryId(guildId);
              if (categoryId) {
                const category = channel.guild.channels.cache.get(categoryId);
                if (category) {
                  await category.delete();
                  Logger.info('Özel odalar kategorisi silindi', { categoryId });
                }
              }
            }
          }
        } catch (error) {
          Logger.error('Özel oda silinirken hata', error);
        }
      }, 1000);
    }

    // Maç kanalından çıkan izleyicilerin susturmasını kaldır
    if (oldState.channel && oldState.channel.parent?.name.startsWith('🎮 Maç #')) {
      // Maç kanalından ayrıldı
      if (!newState.channel || !newState.channel.parent?.name.startsWith('🎮 Maç #')) {
        // Başka bir maç kanalına geçmediyse susturmayı kaldır
        try {
          if (oldState.serverMute && oldState.member) {
            await oldState.member.voice.setMute(false);
            Logger.info('İzleyici susturması kaldırıldı', { userId: oldState.member.id });
          }
        } catch (error) {
          Logger.error('Susturma kaldırılırken hata', error);
        }
      }
    }
  },
};
