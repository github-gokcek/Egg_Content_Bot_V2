import { riotApiService } from './riotApiService';
import { Logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface MatchupData {
  champion: string;
  opponent: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

interface CounterDatabase {
  [champion: string]: {
    counters: Array<{
      name: string;
      winRate: number;
      games: number;
    }>;
    lastUpdated: number;
  };
}

export class CounterAnalysisService {
  private dataPath = path.join(__dirname, '../data/counterDatabase.json');
  private counterDb: CounterDatabase = {};

  constructor() {
    this.loadDatabase();
  }

  // Veritabanını yükle
  private loadDatabase() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.counterDb = JSON.parse(data);
        Logger.info('[Counter Analysis] Veritabanı yüklendi');
      }
    } catch (error) {
      Logger.error('[Counter Analysis] Veritabanı yüklenemedi:', error);
    }
  }

  // Veritabanını kaydet
  private saveDatabase() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.counterDb, null, 2));
      Logger.info('[Counter Analysis] Veritabanı kaydedildi');
    } catch (error) {
      Logger.error('[Counter Analysis] Veritabanı kaydedilemedi:', error);
    }
  }

  /**
   * Belirli bir oyuncunun son maçlarını analiz ederek counter verisi topla
   */
  async analyzePlayerMatches(riotId: string, matchCount: number = 20) {
    try {
      const { gameName, tagLine } = riotApiService.parseRiotId(riotId);
      const account = await riotApiService.getAccountByRiotId(gameName, tagLine);
      const matchIds = await riotApiService.getMatchHistory(account.puuid, matchCount);

      Logger.info(`[Counter Analysis] ${matchIds.length} maç analiz ediliyor...`);

      const matchups: MatchupData[] = [];

      for (const matchId of matchIds) {
        try {
          const match = await riotApiService.getMatchDetails(matchId);
          
          // Sadece Ranked Solo/Duo maçlarını al
          if (match.info.gameMode !== 'CLASSIC') continue;

          // Her oyuncunun karşısındaki lane opponent'ını bul
          const participants = match.info.participants;
          
          for (let i = 0; i < participants.length; i++) {
            const player = participants[i];
            
            // Karşı takımdan lane opponent bul (basit yaklaşım: aynı role)
            const opponent = participants.find(p => 
              p.puuid !== player.puuid && 
              this.isSameRole(player, p) &&
              this.isOppositeTeam(i, participants.indexOf(p))
            );

            if (opponent) {
              matchups.push({
                champion: player.championName,
                opponent: opponent.championName,
                wins: player.win ? 1 : 0,
                losses: player.win ? 0 : 1,
                totalGames: 1,
                winRate: player.win ? 1 : 0
              });
            }
          }

          // Rate limit için bekleme
          await this.sleep(100);
        } catch (error) {
          Logger.error(`[Counter Analysis] Maç analiz hatası: ${matchId}`, error);
        }
      }

      // Matchup verilerini birleştir ve kaydet
      this.aggregateMatchups(matchups);
      this.saveDatabase();

      return matchups.length;
    } catch (error) {
      Logger.error('[Counter Analysis] Oyuncu analiz hatası:', error);
      throw error;
    }
  }

  /**
   * Birden fazla yüksek elo oyuncuyu analiz et (daha iyi veri için)
   */
  async analyzeMultiplePlayers(riotIds: string[], matchCountPerPlayer: number = 20) {
    let totalMatches = 0;
    
    for (const riotId of riotIds) {
      try {
        Logger.info(`[Counter Analysis] ${riotId} analiz ediliyor...`);
        const matches = await this.analyzePlayerMatches(riotId, matchCountPerPlayer);
        totalMatches += matches;
        
        // Rate limit için bekleme
        await this.sleep(2000);
      } catch (error) {
        Logger.error(`[Counter Analysis] ${riotId} analiz edilemedi:`, error);
      }
    }

    Logger.info(`[Counter Analysis] Toplam ${totalMatches} matchup analiz edildi`);
    return totalMatches;
  }

  /**
   * Matchup verilerini birleştir ve counter listesi oluştur
   */
  private aggregateMatchups(matchups: MatchupData[]) {
    const aggregated: { [key: string]: { [opponent: string]: { wins: number; losses: number } } } = {};

    // Verileri grupla
    for (const matchup of matchups) {
      if (!aggregated[matchup.champion]) {
        aggregated[matchup.champion] = {};
      }
      if (!aggregated[matchup.champion][matchup.opponent]) {
        aggregated[matchup.champion][matchup.opponent] = { wins: 0, losses: 0 };
      }
      
      aggregated[matchup.champion][matchup.opponent].wins += matchup.wins;
      aggregated[matchup.champion][matchup.opponent].losses += matchup.losses;
    }

    // Counter listesi oluştur
    for (const champion in aggregated) {
      const counters = Object.entries(aggregated[champion])
        .map(([opponent, data]) => {
          const totalGames = data.wins + data.losses;
          const winRate = totalGames > 0 ? data.wins / totalGames : 0;
          
          return {
            name: opponent,
            winRate: parseFloat((winRate).toFixed(4)),
            games: totalGames
          };
        })
        .filter(c => c.games >= 3) // En az 3 maç olmalı
        .sort((a, b) => a.winRate - b.winRate); // Düşük win rate = counter

      if (counters.length > 0) {
        this.counterDb[champion] = {
          counters: counters.slice(0, 10), // İlk 10 counter
          lastUpdated: Date.now()
        };
      }
    }
  }

  /**
   * Bir şampiyonun counter'larını getir
   */
  getCounters(championName: string) {
    const data = this.counterDb[championName.toLowerCase()];
    if (!data) return null;

    return {
      counters: data.counters,
      lastUpdated: new Date(data.lastUpdated).toLocaleDateString('tr-TR')
    };
  }

  // Helper: Aynı role'de mi kontrol et
  private isSameRole(p1: any, p2: any): boolean {
    // Basit yaklaşım: lane pozisyonuna göre
    return p1.teamPosition === p2.teamPosition && p1.teamPosition !== '';
  }

  // Helper: Karşı takımda mı kontrol et
  private isOppositeTeam(index1: number, index2: number): boolean {
    return (index1 < 5 && index2 >= 5) || (index1 >= 5 && index2 < 5);
  }

  // Helper: Bekleme fonksiyonu
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Veritabanı istatistikleri
   */
  getStats() {
    const champions = Object.keys(this.counterDb);
    const totalMatchups = champions.reduce((sum, champ) => 
      sum + this.counterDb[champ].counters.reduce((s, c) => s + c.games, 0), 0
    );

    return {
      totalChampions: champions.length,
      totalMatchups,
      champions: champions.sort()
    };
  }
}

export const counterAnalysisService = new CounterAnalysisService();
