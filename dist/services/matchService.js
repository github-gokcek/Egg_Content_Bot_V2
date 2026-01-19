"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchService = exports.MatchService = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const databaseService_1 = require("./databaseService");
const botStatusService_1 = require("./botStatusService");
class MatchService {
    // LoL Methods
    async createLolMatch(mode, createdBy, channelId) {
        const match = {
            id: botStatusService_1.botStatusService.isDevMode() ? botStatusService_1.botStatusService.generateTestId() : Date.now().toString(),
            mode,
            createdBy,
            createdAt: new Date(),
            status: 'waiting',
            blueTeam: {},
            redTeam: {},
            channelId,
        };
        await databaseService_1.databaseService.saveLolMatch(match);
        logger_1.Logger.success(`LoL ${mode} maçı oluşturuldu ${botStatusService_1.botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
        return match;
    }
    async getLolMatch(id) {
        return await databaseService_1.databaseService.getLolMatch(id);
    }
    async addPlayerToLolMatch(matchId, team, role, playerId) {
        const match = await this.getLolMatch(matchId);
        if (!match || match.status !== 'waiting')
            return false;
        const targetTeam = team === types_1.Team.BLUE ? match.blueTeam : match.redTeam;
        if (targetTeam[role])
            return false;
        targetTeam[role] = playerId;
        await databaseService_1.databaseService.updateLolMatch(match);
        logger_1.Logger.info(`Oyuncu eklendi`, { matchId, team, role, playerId });
        return true;
    }
    async removePlayerFromLolMatch(matchId, playerId) {
        const match = await this.getLolMatch(matchId);
        if (!match || match.status !== 'waiting')
            return false;
        for (const role of Object.values(types_1.LolRole)) {
            if (match.blueTeam[role] === playerId) {
                delete match.blueTeam[role];
                await databaseService_1.databaseService.updateLolMatch(match);
                logger_1.Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'blue', role, playerId });
                return true;
            }
            if (match.redTeam[role] === playerId) {
                delete match.redTeam[role];
                await databaseService_1.databaseService.updateLolMatch(match);
                logger_1.Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'red', role, playerId });
                return true;
            }
        }
        return false;
    }
    async isLolMatchFull(matchId) {
        const match = await this.getLolMatch(matchId);
        if (!match)
            return false;
        const blueCount = Object.keys(match.blueTeam).length;
        const redCount = Object.keys(match.redTeam).length;
        return blueCount === 5 && redCount === 5;
    }
    async startLolMatch(matchId) {
        const match = await this.getLolMatch(matchId);
        const isFull = await this.isLolMatchFull(matchId);
        if (!match || !isFull)
            return false;
        match.status = 'active';
        await databaseService_1.databaseService.updateLolMatch(match);
        logger_1.Logger.success(`LoL maçı başladı ${botStatusService_1.botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId });
        return true;
    }
    async completeLolMatch(matchId, winner) {
        const match = await this.getLolMatch(matchId);
        if (!match || match.status !== 'active')
            return false;
        match.status = 'completed';
        match.winner = winner;
        match.completedAt = new Date();
        await databaseService_1.databaseService.updateLolMatch(match);
        logger_1.Logger.success(`LoL maçı tamamlandı ${botStatusService_1.botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId, winner });
        return true;
    }
    async deleteLolMatch(matchId) {
        const match = await this.getLolMatch(matchId);
        if (match) {
            await databaseService_1.databaseService.deleteLolMatch(matchId);
            logger_1.Logger.info(`LoL maçı silindi`, { matchId });
            return true;
        }
        return false;
    }
    // TFT Methods
    async createTftMatch(mode, createdBy, channelId) {
        const match = {
            id: botStatusService_1.botStatusService.isDevMode() ? botStatusService_1.botStatusService.generateTestId() : Date.now().toString(),
            mode,
            createdBy,
            createdAt: new Date(),
            status: 'waiting',
            players: [],
            reserves: [],
            channelId,
        };
        if (mode === types_1.TftMode.DOUBLE) {
            match.teams = {
                team1: undefined,
                team2: undefined,
                team3: undefined,
                team4: undefined,
            };
        }
        await databaseService_1.databaseService.saveTftMatch(match);
        logger_1.Logger.success(`TFT ${mode} maçı oluşturuldu ${botStatusService_1.botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
        return match;
    }
    async getTftMatch(id) {
        return await databaseService_1.databaseService.getTftMatch(id);
    }
    async addPlayerToTftMatch(matchId, playerId, isReserve = false) {
        const match = await this.getTftMatch(matchId);
        if (!match || match.status !== 'waiting')
            return false;
        if (match.players.includes(playerId) || match.reserves.includes(playerId))
            return false;
        if (isReserve) {
            match.reserves.push(playerId);
            logger_1.Logger.info(`Yedek oyuncu eklendi`, { matchId, playerId });
        }
        else {
            if (match.players.length >= 8)
                return false;
            match.players.push(playerId);
            logger_1.Logger.info(`Oyuncu eklendi`, { matchId, playerId });
        }
        await databaseService_1.databaseService.updateTftMatch(match);
        return true;
    }
    async removePlayerFromTftMatch(matchId, playerId) {
        const match = await this.getTftMatch(matchId);
        if (!match || match.status !== 'waiting')
            return false;
        const playerIndex = match.players.indexOf(playerId);
        if (playerIndex > -1) {
            match.players.splice(playerIndex, 1);
            await databaseService_1.databaseService.updateTftMatch(match);
            logger_1.Logger.info(`Oyuncu çıkarıldı`, { matchId, playerId });
            return true;
        }
        const reserveIndex = match.reserves.indexOf(playerId);
        if (reserveIndex > -1) {
            match.reserves.splice(reserveIndex, 1);
            await databaseService_1.databaseService.updateTftMatch(match);
            logger_1.Logger.info(`Yedek oyuncu çıkarıldı`, { matchId, playerId });
            return true;
        }
        return false;
    }
    async isTftMatchFull(matchId) {
        const match = await this.getTftMatch(matchId);
        return match ? match.players.length === 8 : false;
    }
    async startTftMatch(matchId) {
        const match = await this.getTftMatch(matchId);
        const isFull = await this.isTftMatchFull(matchId);
        if (!match || !isFull)
            return false;
        match.status = 'active';
        await databaseService_1.databaseService.updateTftMatch(match);
        logger_1.Logger.success(`TFT maçı başladı`, { matchId });
        return true;
    }
    async completeTftMatch(matchId, rankings) {
        const match = await this.getTftMatch(matchId);
        if (!match || match.status !== 'active')
            return false;
        match.status = 'completed';
        match.rankings = rankings;
        match.completedAt = new Date();
        await databaseService_1.databaseService.updateTftMatch(match);
        logger_1.Logger.success(`TFT maçı tamamlandı`, { matchId, rankings });
        return true;
    }
    async deleteTftMatch(matchId) {
        const match = await this.getTftMatch(matchId);
        if (match) {
            await databaseService_1.databaseService.deleteTftMatch(matchId);
            logger_1.Logger.info(`TFT maçı silindi`, { matchId });
            return true;
        }
        return false;
    }
    getTftPointsForRank(rank) {
        const points = [5, 3, 2, 1, -1, -2, -3, -5];
        return points[rank - 1] || 0;
    }
}
exports.MatchService = MatchService;
exports.matchService = new MatchService();
