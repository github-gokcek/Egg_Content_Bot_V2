"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotApiService = exports.RiotApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const RIOT_API_KEY = 'RGAPI-43037d00-16e0-4023-ad98-109691a47aa7'; // process.env.RIOT_API_KEY?.trim();
const REGION = 'tr1'; // Türkiye sunucusu
const ROUTING = 'europe'; // TR1 için routing değeri
class RiotApiService {
    baseUrl = `https://${REGION}.api.riotgames.com`;
    routingUrl = `https://${ROUTING}.api.riotgames.com`;
    async makeRequest(url) {
        if (!RIOT_API_KEY) {
            throw new Error('Riot API key tanımlanmamış!');
        }
        logger_1.Logger.info(`[RIOT API] Key: ${RIOT_API_KEY.substring(0, 20)}... | URL: ${url}`);
        try {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
                timeout: 5000
            });
            return response.data;
        }
        catch (error) {
            logger_1.Logger.error(`[RIOT API] Status: ${error.response?.status} | Message: ${error.message}`);
            if (error.response?.status === 404) {
                throw new Error('Oyuncu bulunamadı!');
            }
            else if (error.response?.status === 403) {
                throw new Error('API key geçersiz veya süresi dolmuş! Yeni key alın: https://developer.riotgames.com/');
            }
            else if (error.response?.status === 429) {
                throw new Error('Rate limit aşıldı, lütfen biraz bekleyin!');
            }
            throw new Error('Riot API bağlantı hatası!');
        }
    }
    async getAccountByRiotId(gameName, tagLine) {
        const url = `${this.routingUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        return await this.makeRequest(url);
    }
    async getSummonerByPuuid(puuid) {
        const url = `${this.baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        return await this.makeRequest(url);
    }
    async getRankedDataByPuuid(puuid) {
        // Yeni API: PUUID ile ranked data almayı dene
        const url = `${this.baseUrl}/lol/league/v4/entries/by-puuid/${puuid}`;
        return await this.makeRequest(url);
    }
    async getRankedData(encryptedSummonerId) {
        const url = `${this.baseUrl}/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`;
        return await this.makeRequest(url);
    }
    async getMatchHistory(puuid, count = 10) {
        const url = `${this.routingUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
        return await this.makeRequest(url);
    }
    async getMatchDetails(matchId) {
        const url = `${this.routingUrl}/lol/match/v5/matches/${matchId}`;
        return await this.makeRequest(url);
    }
    async getCurrentGame(puuid) {
        const url = `${this.baseUrl}/lol/spectator/v5/active-games/by-summoner/${puuid}`;
        return await this.makeRequest(url);
    }
    async getChampionMastery(puuid, count = 5) {
        const url = `${this.baseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
        return await this.makeRequest(url);
    }
    // Helper: Parse Riot ID (Elma#TR1 -> {gameName: "Elma", tagLine: "TR1"})
    parseRiotId(riotId) {
        const parts = riotId.split('#');
        if (parts.length !== 2) {
            throw new Error('Geçersiz format! Örnek: `Elma#TR1`');
        }
        return { gameName: parts[0].trim(), tagLine: parts[1].trim() };
    }
}
exports.RiotApiService = RiotApiService;
exports.riotApiService = new RiotApiService();
