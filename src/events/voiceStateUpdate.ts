import { Events, VoiceState } from 'discord.js';
import { Logger } from '../utils/logger';

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
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
