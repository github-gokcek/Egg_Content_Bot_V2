"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
const voiceActivityService_1 = require("../services/voiceActivityService");
module.exports = {
    name: discord_js_1.Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Voice activity tracking
        await voiceActivityService_1.voiceActivityService.handleVoiceStateUpdate(oldState, newState);
        // Maç kanalından çıkan izleyicilerin susturmasını kaldır
        if (oldState.channel && oldState.channel.parent?.name.startsWith('🎮 Maç #')) {
            // Maç kanalından ayrıldı
            if (!newState.channel || !newState.channel.parent?.name.startsWith('🎮 Maç #')) {
                // Başka bir maç kanalına geçmediyse susturmayı kaldır
                try {
                    if (oldState.serverMute && oldState.member) {
                        await oldState.member.voice.setMute(false);
                        logger_1.Logger.info('İzleyici susturması kaldırıldı', { userId: oldState.member.id });
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Susturma kaldırılırken hata', error);
                }
            }
        }
    },
};
