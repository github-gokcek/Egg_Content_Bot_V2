import { LolMatch, LolMode, LolRole, Team, TftMatch, TftMode } from '../types';
import { Logger } from '../utils/logger';
import { databaseService } from './databaseService';
import { botStatusService } from './botStatusService';

export class MatchService {

  // LoL Methods
  async createLolMatch(mode: LolMode, createdBy: string, channelId: string): Promise<LolMatch> {
    const match: LolMatch = {
      id: botStatusService.isDevMode() ? botStatusService.generateTestId() : Date.now().toString(),
      mode,
      createdBy,
      createdAt: new Date(),
      status: 'waiting',
      blueTeam: {},
      redTeam: {},
      channelId,
    };
    
    await databaseService.saveLolMatch(match);
    Logger.success(`LoL ${mode} maçı oluşturuldu ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
    return match;
  }

  async getLolMatch(id: string): Promise<LolMatch | null> {
    return await databaseService.getLolMatch(id);
  }

  async addPlayerToLolMatch(matchId: string, team: Team, role: LolRole, playerId: string): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    if (!match || match.status !== 'waiting') return false;

    const targetTeam = team === Team.BLUE ? match.blueTeam : match.redTeam;
    if (targetTeam[role]) return false;

    targetTeam[role] = playerId;
    await databaseService.updateLolMatch(match);
    Logger.info(`Oyuncu eklendi`, { matchId, team, role, playerId });
    return true;
  }

  async removePlayerFromLolMatch(matchId: string, playerId: string): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    if (!match || match.status !== 'waiting') return false;

    for (const role of Object.values(LolRole)) {
      if (match.blueTeam[role] === playerId) {
        delete match.blueTeam[role];
        await databaseService.updateLolMatch(match);
        Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'blue', role, playerId });
        return true;
      }
      if (match.redTeam[role] === playerId) {
        delete match.redTeam[role];
        await databaseService.updateLolMatch(match);
        Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'red', role, playerId });
        return true;
      }
    }
    return false;
  }

  async isLolMatchFull(matchId: string): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    if (!match) return false;

    const blueCount = Object.keys(match.blueTeam).length;
    const redCount = Object.keys(match.redTeam).length;
    return blueCount === 5 && redCount === 5;
  }

  async startLolMatch(matchId: string): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    const isFull = await this.isLolMatchFull(matchId);
    if (!match || !isFull) return false;

    match.status = 'active';
    await databaseService.updateLolMatch(match);
    Logger.success(`LoL maçı başladı ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId });
    return true;
  }

  async completeLolMatch(matchId: string, winner: Team): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    if (!match || match.status !== 'active') return false;

    match.status = 'completed';
    match.winner = winner;
    match.completedAt = new Date();
    await databaseService.updateLolMatch(match);
    Logger.success(`LoL maçı tamamlandı ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId, winner });
    return true;
  }

  async deleteLolMatch(matchId: string): Promise<boolean> {
    const match = await this.getLolMatch(matchId);
    if (match) {
      await databaseService.deleteLolMatch(matchId);
      Logger.info(`LoL maçı silindi`, { matchId });
      return true;
    }
    return false;
  }

  // TFT Methods
  async createTftMatch(mode: TftMode, createdBy: string, channelId: string): Promise<TftMatch> {
    const match: TftMatch = {
      id: botStatusService.isDevMode() ? botStatusService.generateTestId() : Date.now().toString(),
      mode,
      createdBy,
      createdAt: new Date(),
      status: 'waiting',
      players: [],
      reserves: [],
      channelId,
    };
    
    if (mode === TftMode.DOUBLE) {
      match.teams = {
        team1: undefined,
        team2: undefined,
        team3: undefined,
        team4: undefined,
      };
    }
    
    await databaseService.saveTftMatch(match);
    Logger.success(`TFT ${mode} maçı oluşturuldu ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
    return match;
  }

  async getTftMatch(id: string): Promise<TftMatch | null> {
    return await databaseService.getTftMatch(id);
  }

  async addPlayerToTftMatch(matchId: string, playerId: string, isReserve: boolean = false): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    if (!match || match.status !== 'waiting') return false;

    if (match.players.includes(playerId) || match.reserves.includes(playerId)) return false;

    if (isReserve) {
      match.reserves.push(playerId);
      Logger.info(`Yedek oyuncu eklendi`, { matchId, playerId });
    } else {
      if (match.players.length >= 8) return false;
      match.players.push(playerId);
      Logger.info(`Oyuncu eklendi`, { matchId, playerId });
    }
    await databaseService.updateTftMatch(match);
    return true;
  }

  async removePlayerFromTftMatch(matchId: string, playerId: string): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    if (!match || match.status !== 'waiting') return false;

    const playerIndex = match.players.indexOf(playerId);
    if (playerIndex > -1) {
      match.players.splice(playerIndex, 1);
      await databaseService.updateTftMatch(match);
      Logger.info(`Oyuncu çıkarıldı`, { matchId, playerId });
      return true;
    }

    const reserveIndex = match.reserves.indexOf(playerId);
    if (reserveIndex > -1) {
      match.reserves.splice(reserveIndex, 1);
      await databaseService.updateTftMatch(match);
      Logger.info(`Yedek oyuncu çıkarıldı`, { matchId, playerId });
      return true;
    }

    return false;
  }

  async isTftMatchFull(matchId: string): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    return match ? match.players.length === 8 : false;
  }

  async startTftMatch(matchId: string): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    const isFull = await this.isTftMatchFull(matchId);
    if (!match || !isFull) return false;

    match.status = 'active';
    await databaseService.updateTftMatch(match);
    Logger.success(`TFT maçı başladı`, { matchId });
    return true;
  }

  async completeTftMatch(matchId: string, rankings: string[]): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    if (!match || match.status !== 'active') return false;

    match.status = 'completed';
    match.rankings = rankings;
    match.completedAt = new Date();
    await databaseService.updateTftMatch(match);
    Logger.success(`TFT maçı tamamlandı`, { matchId, rankings });
    return true;
  }

  async deleteTftMatch(matchId: string): Promise<boolean> {
    const match = await this.getTftMatch(matchId);
    if (match) {
      await databaseService.deleteTftMatch(matchId);
      Logger.info(`TFT maçı silindi`, { matchId });
      return true;
    }
    return false;
  }

  getTftPointsForRank(rank: number): number {
    const points = [5, 3, 2, 1, -1, -2, -3, -5];
    return points[rank - 1] || 0;
  }
}

export const matchService = new MatchService();
