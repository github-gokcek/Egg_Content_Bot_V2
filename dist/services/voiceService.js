"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceService = exports.VoiceService = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
class VoiceService {
    async createMatchVoiceChannels(guild, matchId, playerIds) {
        try {
            const category = await guild.channels.create({
                name: `🎮 Maç #${matchId}`,
                type: discord_js_1.ChannelType.GuildCategory,
            });
            const channels = [];
            // Mavi takım kanalı
            const blueChannel = await guild.channels.create({
                name: '🔵 Mavi Takım',
                type: discord_js_1.ChannelType.GuildVoice,
                parent: category,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [discord_js_1.PermissionFlagsBits.Connect],
                    }
                ]
            });
            // Kırmızı takım kanalı
            const redChannel = await guild.channels.create({
                name: '🔴 Kırmızı Takım',
                type: discord_js_1.ChannelType.GuildVoice,
                parent: category,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [discord_js_1.PermissionFlagsBits.Connect],
                    }
                ]
            });
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
            logger_1.Logger.success('Maç ses kanalları oluşturuldu', { matchId, channelCount: channels.length });
            return channels;
        }
        catch (error) {
            logger_1.Logger.error('Ses kanalları oluşturulamadı', error);
            return [];
        }
    }
    async createTftVoiceChannel(guild, matchId, playerIds) {
        try {
            const category = await guild.channels.create({
                name: `♟️ TFT Maç #${matchId}`,
                type: discord_js_1.ChannelType.GuildCategory,
            });
            const channel = await guild.channels.create({
                name: '♟️ TFT Oyuncuları',
                type: discord_js_1.ChannelType.GuildVoice,
                parent: category,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [discord_js_1.PermissionFlagsBits.Connect],
                    }
                ]
            });
            // Tüm oyunculara izin ver
            for (const playerId of playerIds) {
                await channel.permissionOverwrites.create(playerId, {
                    Connect: true,
                    Speak: true
                });
            }
            logger_1.Logger.success('TFT ses kanalı oluşturuldu', { matchId, playerCount: playerIds.length });
            return channel;
        }
        catch (error) {
            logger_1.Logger.error('TFT ses kanalı oluşturulamadı', error);
            return null;
        }
    }
    async movePlayersToChannels(guild, blueTeam, redTeam, blueChannel, redChannel) {
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
            logger_1.Logger.success('Oyuncular ses kanallarına taşındı');
        }
        catch (error) {
            logger_1.Logger.error('Oyuncular taşınamadı', error);
        }
    }
    async movePlayersToTftChannel(guild, playerIds, channel) {
        try {
            for (const playerId of playerIds) {
                const member = await guild.members.fetch(playerId).catch(() => null);
                if (member?.voice.channel) {
                    await member.voice.setChannel(channel);
                }
            }
            logger_1.Logger.success('TFT oyuncuları ses kanalına taşındı');
        }
        catch (error) {
            logger_1.Logger.error('TFT oyuncuları taşınamadı', error);
        }
    }
    async deleteMatchChannels(guild, matchId) {
        try {
            const categories = guild.channels.cache.filter(c => c.type === discord_js_1.ChannelType.GuildCategory &&
                (c.name.includes(`Maç #${matchId}`) || c.name.includes(`TFT Maç #${matchId}`)));
            for (const category of categories.values()) {
                // Kategori altındaki tüm kanalları sil
                const childChannels = guild.channels.cache.filter(c => c.parentId === category.id);
                for (const child of childChannels.values()) {
                    await child.delete();
                }
                // Kategoriyi sil
                await category.delete();
            }
            logger_1.Logger.success('Maç kanalları silindi', { matchId });
        }
        catch (error) {
            logger_1.Logger.error('Maç kanalları silinemedi', error);
        }
    }
}
exports.VoiceService = VoiceService;
exports.voiceService = new VoiceService();
