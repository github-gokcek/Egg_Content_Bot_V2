"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Botları kontrol et
            if (member.user.bot)
                return;
            // Oyuncunun zaten hesabı olup olmadığını kontrol et
            const existingPlayer = await databaseService_1.databaseService.getPlayer(member.id);
            if (!existingPlayer) {
                // Yeni oyuncu oluştur (0 gold ile başla)
                const newPlayer = {
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
                await databaseService_1.databaseService.savePlayer(newPlayer);
                logger_1.Logger.success('Yeni oyuncu otomatik kaydedildi', { userId: member.id, username: member.user.username });
            }
        }
        catch (error) {
            logger_1.Logger.error('Oyuncu kaydı sırasında hata oluştu', error);
        }
    }
};
