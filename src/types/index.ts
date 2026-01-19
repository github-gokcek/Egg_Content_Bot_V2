export enum GameType {
  LOL = 'lol',
  TFT = 'tft'
}

export enum LolMode {
  SUMMONERS_RIFT = 'summoners_rift',
  ARAM = 'aram'
}

export enum TftMode {
  SOLO = 'solo',
  DOUBLE = 'double'
}

export enum LolRole {
  TOP = 'top',
  JUNGLE = 'jungle',
  MID = 'mid',
  ADC = 'adc',
  SUPPORT = 'support'
}

export enum Team {
  BLUE = 'blue',
  RED = 'red'
}

export interface LolTeam {
  [LolRole.TOP]?: string;
  [LolRole.JUNGLE]?: string;
  [LolRole.MID]?: string;
  [LolRole.ADC]?: string;
  [LolRole.SUPPORT]?: string;
}

export interface LolMatch {
  id: string;
  mode: LolMode;
  createdBy: string;
  createdAt: Date;
  status: 'waiting' | 'active' | 'completed';
  blueTeam: LolTeam;
  redTeam: LolTeam;
  winner?: Team;
  messageId?: string;
  channelId?: string;
  threadId?: string;
}

export interface TftMatch {
  id: string;
  mode: TftMode;
  createdBy: string;
  createdAt: Date;
  status: 'waiting' | 'active' | 'completed';
  players: string[]; // Solo için
  reserves: string[];
  teams?: { // Double Up için
    team1?: string[]; // 2 kişilik grup
    team2?: string[];
    team3?: string[];
    team4?: string[];
  };
  rankings?: string[]; // Solo: oyuncu ID'leri, Double: grup ID'leri
  messageId?: string;
  channelId?: string;
  threadId?: string;
}

export interface Player {
  discordId: string;
  username: string;
  balance: number; // Bakiye sistemi
  stats: {
    lol: {
      wins: number;
      losses: number;
    };
    tft: {
      matches: number;
      top4: number;
      rankings: number[];
      points: number;
    };
  };
}
