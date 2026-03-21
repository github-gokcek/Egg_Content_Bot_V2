"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.counterAnalysisService = exports.CounterAnalysisService = void 0;
const riotApiService_1 = require("./riotApiService");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CounterAnalysisService {
    dataPath = path.join(__dirname, '../data/counterDatabase.json');
    counterDb = {};
    constructor() {
        this.loadDatabase();
    }
    // Veritabanını yükle
    loadDatabase() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const data = fs.readFileSync(this.dataPath, 'utf-8');
                this.counterDb = JSON.parse(data);
                logger_1.Logger.info('[Counter Analysis] Veritabanı yüklendi');
            }
        }
        catch (error) {
            logger_1.Logger.error('[Counter Analysis] Veritabanı yüklenemedi:', error);
        }
    }
    // Veritabanını kaydet
    saveDatabase() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.counterDb, null, 2));
            logger_1.Logger.info('[Counter Analysis] Veritabanı kaydedildi');
        }
        catch (error) {
            logger_1.Logger.error('[Counter Analysis] Veritabanı kaydedilemedi:', error);
        }
    }
    /**
     * Belirli bir oyuncunun son maçlarını analiz ederek counter verisi topla
     */
    async analyzePlayerMatches(riotId, matchCount = 20) {
        try {
            const { gameName, tagLine } = riotApiService_1.riotApiService.parseRiotId(riotId);
            const account = await riotApiService_1.riotApiService.getAccountByRiotId(gameName, tagLine);
            const matchIds = await riotApiService_1.riotApiService.getMatchHistory(account.puuid, matchCount);
            logger_1.Logger.info(`[Counter Analysis] ${matchIds.length} maç analiz ediliyor...`);
            const matchups = [];
            for (const matchId of matchIds) {
                try {
                    const match = await riotApiService_1.riotApiService.getMatchDetails(matchId);
                    // Sadece Ranked Solo/Duo maçlarını al
                    if (match.info.gameMode !== 'CLASSIC')
                        continue;
                    // Her oyuncunun karşısındaki lane opponent'ını bul
                    const participants = match.info.participants;
                    for (let i = 0; i < participants.length; i++) {
                        const player = participants[i];
                        // Karşı takımdan lane opponent bul (basit yaklaşım: aynı role)
                        const opponent = participants.find(p => p.puuid !== player.puuid &&
                            this.isSameRole(player, p) &&
                            this.isOppositeTeam(i, participants.indexOf(p)));
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
                }
                catch (error) {
                    logger_1.Logger.error(`[Counter Analysis] Maç analiz hatası: ${matchId}`, error);
                }
            }
            // Matchup verilerini birleştir ve kaydet
            this.aggregateMatchups(matchups);
            this.saveDatabase();
            return matchups.length;
        }
        catch (error) {
            logger_1.Logger.error('[Counter Analysis] Oyuncu analiz hatası:', error);
            throw error;
        }
    }
    /**
     * Birden fazla yüksek elo oyuncuyu analiz et (daha iyi veri için)
     */
    async analyzeMultiplePlayers(riotIds, matchCountPerPlayer = 20) {
        let totalMatches = 0;
        for (const riotId of riotIds) {
            try {
                logger_1.Logger.info(`[Counter Analysis] ${riotId} analiz ediliyor...`);
                const matches = await this.analyzePlayerMatches(riotId, matchCountPerPlayer);
                totalMatches += matches;
                // Rate limit için bekleme
                await this.sleep(2000);
            }
            catch (error) {
                logger_1.Logger.error(`[Counter Analysis] ${riotId} analiz edilemedi:`, error);
            }
        }
        logger_1.Logger.info(`[Counter Analysis] Toplam ${totalMatches} matchup analiz edildi`);
        return totalMatches;
    }
    /**
     * Matchup verilerini birleştir ve counter listesi oluştur
     */
    aggregateMatchups(matchups) {
        const aggregated = {};
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
    getCounters(championName) {
        const data = this.counterDb[championName.toLowerCase()];
        if (!data)
            return null;
        return {
            counters: data.counters,
            lastUpdated: new Date(data.lastUpdated).toLocaleDateString('tr-TR')
        };
    }
    // Helper: Aynı role'de mi kontrol et
    isSameRole(p1, p2) {
        // Basit yaklaşım: lane pozisyonuna göre
        return p1.teamPosition === p2.teamPosition && p1.teamPosition !== '';
    }
    // Helper: Karşı takımda mı kontrol et
    isOppositeTeam(index1, index2) {
        return (index1 < 5 && index2 >= 5) || (index1 >= 5 && index2 < 5);
    }
    // Helper: Bekleme fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Veritabanı istatistikleri
     */
    getStats() {
        const champions = Object.keys(this.counterDb);
        const totalMatchups = champions.reduce((sum, champ) => sum + this.counterDb[champ].counters.reduce((s, c) => s + c.games, 0), 0);
        return {
            totalChampions: champions.length,
            totalMatchups,
            champions: champions.sort()
        };
    }
}
exports.CounterAnalysisService = CounterAnalysisService;
exports.counterAnalysisService = new CounterAnalysisService();
