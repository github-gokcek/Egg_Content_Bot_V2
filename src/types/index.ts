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
  completedAt?: Date;
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
  completedAt?: Date;
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

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  lastReset: Date;
  // Casino
  slotPlays: number;
  coinflipPlays: number;
  crashPlays: number;
  blackjackPlays: number;
  minesPlays: number;
  casinoWins: number;
  casinoSpent: number;
  // Voice
  voiceMinutes: number;
  // Social
  messagesCount: number;
  reactionsGiven: number;
  reactionsReceived: number;
  mentionsGiven: Set<string>; // unique user IDs
  repliesGiven: Set<string>; // unique user IDs
  emojisUsed: Set<string>; // unique emoji names
  channelsUsed: Set<string>; // unique channel IDs
  hourlyActivity: Set<number>; // hours 0-23
}

export interface TotalStats {
  voiceMinutesTotal: number;
  casinoWinsTotal: number;
}

export interface Player {
  discordId: string;
  username: string;
  lolIgn?: string;
  tftIgn?: string;
  balance: number;
  voicePackets: number;
  createdAt: Date;
  dailyStats?: DailyStats;
  totalStats?: TotalStats;
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
