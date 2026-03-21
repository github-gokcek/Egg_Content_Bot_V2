"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
const voiceActivityService_1 = require("../services/voiceActivityService");
const voiceCoinService_1 = require("../services/voiceCoinService");
const privateRoomService_1 = require("../services/privateRoomService");
module.exports = {
    name: discord_js_1.Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Voice activity tracking
        await voiceActivityService_1.voiceActivityService.handleVoiceStateUpdate(oldState, newState);
        // Voice coin tracking
        await voiceCoinService_1.voiceCoinService.handleVoiceStateUpdate(oldState, newState);
        // Private room system
        const privateRoomService = privateRoomService_1.PrivateRoomService.getInstance();
        const guildId = newState.guild.id;
        // Kullanıcı trigger kanalına girdi
        if (newState.channel) {
            const triggerChannelId = await privateRoomService.getTriggerChannel(guildId);
            if (triggerChannelId === newState.channel.id) {
                try {
                    const member = newState.member;
                    const guild = newState.guild;
                    // "Özel odalar" kategorisini bul veya oluştur
                    let category = guild.channels.cache.find(c => c.type === discord_js_1.ChannelType.GuildCategory && c.name === '📁 Özel odalar');
                    if (!category) {
                        category = await guild.channels.create({
                            name: '📁 Özel odalar',
                            type: discord_js_1.ChannelType.GuildCategory,
                        });
                        await privateRoomService.setCategoryId(guildId, category.id);
                    }
                    // Kullanıcı için özel oda oluştur
                    const privateChannel = await guild.channels.create({
                        name: member.user.username,
                        type: discord_js_1.ChannelType.GuildVoice,
                        parent: category.id,
                        userLimit: 5,
                        permissionOverwrites: [
                            {
                                id: member.id,
                                allow: [discord_js_1.PermissionFlagsBits.MuteMembers, discord_js_1.PermissionFlagsBits.MoveMembers, discord_js_1.PermissionFlagsBits.ManageChannels],
                            },
                            {
                                id: guild.id,
                                deny: [discord_js_1.PermissionFlagsBits.ManageChannels],
                            },
                        ],
                    });
                    privateRoomService.addRoom(privateChannel.id, member.id, guildId);
                    // Kullanıcıyı yeni odaya taşı (500ms delay)
                    setTimeout(async () => {
                        try {
                            await member.voice.setChannel(privateChannel);
                        }
                        catch (error) {
                            logger_1.Logger.error('Kullanıcı özel odaya taşınamadı', error);
                        }
                    }, 500);
                    logger_1.Logger.info('Özel oda oluşturuldu', { userId: member.id, channelId: privateChannel.id });
                }
                catch (error) {
                    logger_1.Logger.error('Özel oda oluşturulurken hata', error);
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
                        logger_1.Logger.info('Boş özel oda silindi', { channelId: channel.id });
                        // Kategoride başka özel oda var mı kontrol et
                        const remainingRooms = privateRoomService.getRoomsByGuild(guildId);
                        if (remainingRooms.length === 0) {
                            const categoryId = await privateRoomService.getCategoryId(guildId);
                            if (categoryId) {
                                const category = channel.guild.channels.cache.get(categoryId);
                                if (category) {
                                    await category.delete();
                                    logger_1.Logger.info('Özel odalar kategorisi silindi', { categoryId });
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    logger_1.Logger.error('Özel oda silinirken hata', error);
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
