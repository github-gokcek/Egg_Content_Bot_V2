// Faction Types
export enum FactionType {
  DEMACIA = 'demacia',
  NOXUS = 'noxus',
  IONIA = 'ionia',
  PILTOVER = 'piltover',
  ZAUN = 'zaun',
  FRELJORD = 'freljord',
  SHURIMA = 'shurima',
  BILGEWATER = 'bilgewater',
}

export enum FactionTier {
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3, // Future
}

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  description: string;
  color: number; // Discord color
  tier1Price: number; // Normal currency
  tier2FPCost: number; // Faction Points
  createdAt: Date;
}

export interface UserFaction {
  userId: string;
  factionType: FactionType;
  tier: FactionTier;
  factionPoints: number; // FP
  totalFPEarned: number;
  weeklyFPEarned: number;
  lastWeeklyReset: Date;
  joinedAt: Date;
  progressBoost: number; // 0, 10, or 20 (percentage)
  lastActivityAt: Date;
}

export interface FactionActivity {
  id: string;
  userId: string;
  factionType: FactionType;
  activityType: 'match_participation' | 'match_completion' | 'match_win' | 'voice_activity' | 'event';
  fpEarned: number;
  timestamp: Date;
  metadata?: any;
}

export interface FactionMatch {
  id: string;
  factionA: FactionType;
  factionB: FactionType;
  tierRestriction?: FactionTier;
  status: 'waiting' | 'active' | 'completed';
  winnerId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface FactionStore {
  id: string;
  factionType: FactionType;
  itemName: string;
  itemType: 'tier_upgrade' | 'cosmetic' | 'badge';
  fpCost: number;
  description: string;
  available: boolean;
}

// FP Earning Rates (Constants)
export const FP_RATES = {
  MATCH_PARTICIPATION: 5,
  MATCH_COMPLETION: 10,
  MATCH_WIN: 15,
  VOICE_ACTIVITY_PER_10MIN: 1,
  VOICE_DAILY_CAP: 30,
  EVENT_COMPLETION: 25,
};

// Tier Requirements
export const TIER_REQUIREMENTS = {
  TIER_2: 500, // FP needed for Tier 2
  TIER_3: 2000, // FP needed for Tier 3 (future)
};

// Progress Boosts
export const PROGRESS_BOOSTS = {
  AT_33_PERCENT: 10, // +10% FP gain
  AT_66_PERCENT: 20, // +20% FP gain (cumulative)
};
