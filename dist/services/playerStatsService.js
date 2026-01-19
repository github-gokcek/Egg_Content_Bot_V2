"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerStatsService = exports.PlayerStatsService = void 0;
const databaseService_1 = require("./databaseService");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class PlayerStatsService {
    async updateLolStats(playerIds, winner, blueTeam, redTeam) {
        try {
            const bluePlayerIds = Object.values(blueTeam);
            const redPlayerIds = Object.values(redTeam);
            // Mavi takım oyuncularını güncelle
            for (const playerId of bluePlayerIds) {
                const player = await this.getOrCreatePlayer(playerId);
                if (winner === types_1.Team.BLUE) {
                    player.stats.lol.wins++;
                }
                else {
                    player.stats.lol.losses++;
                }
                player.balance += 10; // Her maç için 10 bakiye
                await databaseService_1.databaseService.updatePlayer(player);
            }
            // Kırmızı takım oyuncularını güncelle
            for (const playerId of redPlayerIds) {
                const player = await this.getOrCreatePlayer(playerId);
                if (winner === types_1.Team.RED) {
                    player.stats.lol.wins++;
                }
                else {
                    player.stats.lol.losses++;
                }
                player.balance += 10; // Her maç için 10 bakiye
                await databaseService_1.databaseService.updatePlayer(player);
            }
            logger_1.Logger.success('LoL istatistikleri güncellendi', { winner, playerCount: bluePlayerIds.length + redPlayerIds.length });
        }
        catch (error) {
            logger_1.Logger.error('LoL istatistikleri güncellenemedi', error);
        }
    }
    async updateTftStats(rankings) {
        try {
            for (let i = 0; i < rankings.length; i++) {
                const playerId = rankings[i];
                const rank = i + 1;
                const points = this.getTftPoints(rank);
                const player = await this.getOrCreatePlayer(playerId);
                player.stats.tft.matches++;
                player.stats.tft.points += points;
                player.stats.tft.rankings.push(rank);
                player.balance += 10; // Her maç için 10 bakiye
                // Top 4 kontrolü
                if (rank <= 4) {
                    player.stats.tft.top4++;
                }
                // Son 50 sıralamayı tut
                if (player.stats.tft.rankings.length > 50) {
                    player.stats.tft.rankings = player.stats.tft.rankings.slice(-50);
                }
                await databaseService_1.databaseService.updatePlayer(player);
            }
            logger_1.Logger.success('TFT istatistikleri güncellendi', { playerCount: rankings.length });
        }
        catch (error) {
            logger_1.Logger.error('TFT istatistikleri güncellenemedi', error);
        }
    }
    async getOrCreatePlayer(discordId) {
        let player = await databaseService_1.databaseService.getPlayer(discordId);
        if (!player) {
            // Yeni oyuncu oluştur
            player = {
                discordId,
                username: 'Unknown',
                balance: 100,
                createdAt: new Date(),
                stats: {
                    lol: { wins: 0, losses: 0 },
                    tft: { matches: 0, top4: 0, rankings: [], points: 0 }
                }
            };
            await databaseService_1.databaseService.savePlayer(player);
        }
        return player;
    }
    getTftPoints(rank) {
        const points = [5, 3, 2, 1, -1, -2, -3, -5];
        return points[rank - 1] || 0;
    }
}
exports.PlayerStatsService = PlayerStatsService;
exports.playerStatsService = new PlayerStatsService();
