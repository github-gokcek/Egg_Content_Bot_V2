import { LolMatch, LolMode, LolRole, Team, TftMatch, TftMode } from '../types';
import { Logger } from '../utils/logger';
import { databaseService } from './databaseService';
import { botStatusService } from './botStatusService';

export class MatchService {
  private lolMatches: Map<string, LolMatch> = new Map();
  private tftMatches: Map<string, TftMatch> = new Map();

  // LoL Methods
  createLolMatch(mode: LolMode, createdBy: string, channelId: string): LolMatch {
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
    
    this.lolMatches.set(match.id, match);
    
    if (botStatusService.isLiveMode()) {
      databaseService.saveLolMatch(match); // Sadece live modda Firebase'e kaydet
    }
    
    Logger.success(`LoL ${mode} maçı oluşturuldu ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
    return match;
  }

  getLolMatch(id: string): LolMatch | undefined {
    return this.lolMatches.get(id);
  }

  addPlayerToLolMatch(matchId: string, team: Team, role: LolRole, playerId: string): boolean {
    const match = this.lolMatches.get(matchId);
    if (!match || match.status !== 'waiting') return false;

    const targetTeam = team === Team.BLUE ? match.blueTeam : match.redTeam;
    if (targetTeam[role]) return false;

    targetTeam[role] = playerId;
    Logger.info(`Oyuncu eklendi`, { matchId, team, role, playerId });
    return true;
  }

  removePlayerFromLolMatch(matchId: string, playerId: string): boolean {
    const match = this.lolMatches.get(matchId);
    if (!match || match.status !== 'waiting') return false;

    for (const role of Object.values(LolRole)) {
      if (match.blueTeam[role] === playerId) {
        delete match.blueTeam[role];
        Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'blue', role, playerId });
        return true;
      }
      if (match.redTeam[role] === playerId) {
        delete match.redTeam[role];
        Logger.info(`Oyuncu çıkarıldı`, { matchId, team: 'red', role, playerId });
        return true;
      }
    }
    return false;
  }

  isLolMatchFull(matchId: string): boolean {
    const match = this.lolMatches.get(matchId);
    if (!match) return false;

    const blueCount = Object.keys(match.blueTeam).length;
    const redCount = Object.keys(match.redTeam).length;
    return blueCount === 5 && redCount === 5;
  }

  startLolMatch(matchId: string): boolean {
    const match = this.lolMatches.get(matchId);
    if (!match || !this.isLolMatchFull(matchId)) return false;

    match.status = 'active';
    
    if (botStatusService.isLiveMode()) {
      databaseService.updateLolMatch(match); // Sadece live modda Firebase'e güncelle
    }
    
    Logger.success(`LoL maçı başladı ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId });
    return true;
  }

  completeLolMatch(matchId: string, winner: Team): boolean {
    const match = this.lolMatches.get(matchId);
    if (!match || match.status !== 'active') return false;

    match.status = 'completed';
    match.winner = winner;
    
    if (botStatusService.isLiveMode()) {
      databaseService.updateLolMatch(match); // Sadece live modda Firebase'e güncelle
    }
    
    Logger.success(`LoL maçı tamamlandı ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { matchId, winner });
    return true;
  }

  deleteLolMatch(matchId: string): boolean {
    const deleted = this.lolMatches.delete(matchId);
    if (deleted) {
      databaseService.deleteLolMatch(matchId); // Firebase'den sil
      Logger.info(`LoL maçı silindi`, { matchId });
    }
    return deleted;
  }

  // TFT Methods
  createTftMatch(mode: TftMode, createdBy: string, channelId: string): TftMatch {
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
    
    this.tftMatches.set(match.id, match);
    
    if (botStatusService.isLiveMode()) {
      databaseService.saveTftMatch(match); // Sadece live modda Firebase'e kaydet
    }
    
    Logger.success(`TFT ${mode} maçı oluşturuldu ${botStatusService.isDevMode() ? '(TEST MODU)' : ''}`, { id: match.id, createdBy });
    return match;
  }

  getTftMatch(id: string): TftMatch | undefined {
    return this.tftMatches.get(id);
  }

  addPlayerToTftMatch(matchId: string, playerId: string, isReserve: boolean = false): boolean {
    const match = this.tftMatches.get(matchId);
    if (!match || match.status !== 'waiting') return false;

    // Zaten oyunda mı?
    if (match.players.includes(playerId) || match.reserves.includes(playerId)) return false;

    if (isReserve) {
      match.reserves.push(playerId);
      Logger.info(`Yedek oyuncu eklendi`, { matchId, playerId });
    } else {
      if (match.players.length >= 8) return false;
      match.players.push(playerId);
      Logger.info(`Oyuncu eklendi`, { matchId, playerId });
    }
    return true;
  }

  removePlayerFromTftMatch(matchId: string, playerId: string): boolean {
    const match = this.tftMatches.get(matchId);
    if (!match || match.status !== 'waiting') return false;

    const playerIndex = match.players.indexOf(playerId);
    if (playerIndex > -1) {
      match.players.splice(playerIndex, 1);
      Logger.info(`Oyuncu çıkarıldı`, { matchId, playerId });
      return true;
    }

    const reserveIndex = match.reserves.indexOf(playerId);
    if (reserveIndex > -1) {
      match.reserves.splice(reserveIndex, 1);
      Logger.info(`Yedek oyuncu çıkarıldı`, { matchId, playerId });
      return true;
    }

    return false;
  }

  isTftMatchFull(matchId: string): boolean {
    const match = this.tftMatches.get(matchId);
    return match ? match.players.length === 8 : false;
  }

  startTftMatch(matchId: string): boolean {
    const match = this.tftMatches.get(matchId);
    if (!match || !this.isTftMatchFull(matchId)) return false;

    match.status = 'active';
    databaseService.updateTftMatch(match); // Firebase'e güncelle
    Logger.success(`TFT maçı başladı`, { matchId });
    return true;
  }

  completeTftMatch(matchId: string, rankings: string[]): boolean {
    const match = this.tftMatches.get(matchId);
    if (!match || match.status !== 'active') return false;

    match.status = 'completed';
    match.rankings = rankings;
    databaseService.updateTftMatch(match); // Firebase'e güncelle
    Logger.success(`TFT maçı tamamlandı`, { matchId, rankings });
    return true;
  }

  deleteTftMatch(matchId: string): boolean {
    const deleted = this.tftMatches.delete(matchId);
    if (deleted) {
      databaseService.deleteTftMatch(matchId); // Firebase'den sil
      Logger.info(`TFT maçı silindi`, { matchId });
    }
    return deleted;
  }

  getTftPointsForRank(rank: number): number {
    const points = [5, 3, 2, 1, -1, -2, -3, -5];
    return points[rank - 1] || 0;
  }
}

export const matchService = new MatchService();
