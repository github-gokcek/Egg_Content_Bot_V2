import { databaseService } from './databaseService';
import { Player, Team } from '../types';
import { Logger } from '../utils/logger';

export class PlayerStatsService {
  async updateLolStats(playerIds: string[], winner: Team, blueTeam: any, redTeam: any): Promise<void> {
    try {
      const bluePlayerIds = Object.values(blueTeam) as string[];
      const redPlayerIds = Object.values(redTeam) as string[];

      // Mavi takım oyuncularını güncelle
      for (const playerId of bluePlayerIds) {
        const player = await this.getOrCreatePlayer(playerId);
        if (winner === Team.BLUE) {
          player.stats.lol.wins++;
        } else {
          player.stats.lol.losses++;
        }
        player.balance += 10; // Her maç için 10 bakiye
        await databaseService.updatePlayer(player);
      }

      // Kırmızı takım oyuncularını güncelle
      for (const playerId of redPlayerIds) {
        const player = await this.getOrCreatePlayer(playerId);
        if (winner === Team.RED) {
          player.stats.lol.wins++;
        } else {
          player.stats.lol.losses++;
        }
        player.balance += 10; // Her maç için 10 bakiye
        await databaseService.updatePlayer(player);
      }

      Logger.success('LoL istatistikleri güncellendi', { winner, playerCount: bluePlayerIds.length + redPlayerIds.length });
    } catch (error) {
      Logger.error('LoL istatistikleri güncellenemedi', error);
    }
  }

  async updateTftStats(rankings: string[]): Promise<void> {
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

        await databaseService.updatePlayer(player);
      }

      Logger.success('TFT istatistikleri güncellendi', { playerCount: rankings.length });
    } catch (error) {
      Logger.error('TFT istatistikleri güncellenemedi', error);
    }
  }

  private async getOrCreatePlayer(discordId: string): Promise<Player> {
    let player = await databaseService.getPlayer(discordId);
    
    if (!player) {
      // Yeni oyuncu oluştur
      player = {
        discordId,
        username: 'Unknown',
        balance: 100,
        stats: {
          lol: { wins: 0, losses: 0 },
          tft: { matches: 0, top4: 0, rankings: [], points: 0 }
        }
      } as Player;
      await databaseService.savePlayer(player);
    }
    
    return player;
  }

  private getTftPoints(rank: number): number {
    const points = [5, 3, 2, 1, -1, -2, -3, -5];
    return points[rank - 1] || 0;
  }
}

export const playerStatsService = new PlayerStatsService();