import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { FactionType, FactionTier, UserFaction, FactionActivity, FP_RATES, TIER_REQUIREMENTS, PROGRESS_BOOSTS } from '../types/faction';
import { Logger } from '../utils/logger';

class FactionService {
  // Get user's faction data
  async getUserFaction(userId: string): Promise<UserFaction | null> {
    try {
      const docRef = doc(db, 'userFactions', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserFaction;
      }
      return null;
    } catch (error) {
      Logger.error('getUserFaction error', error);
      return null;
    }
  }

  // Join a faction (Tier 1 purchase)
  async joinFaction(userId: string, factionType: FactionType, userBalance: number, tier1Price: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already has a faction
      const existing = await this.getUserFaction(userId);
      if (existing) {
        return { success: false, message: 'Zaten bir faction\'a üyesiniz!' };
      }

      // Check balance
      if (userBalance < tier1Price) {
        return { success: false, message: 'Yetersiz bakiye!' };
      }

      // Create user faction
      const userFaction: UserFaction = {
        userId,
        factionType,
        tier: FactionTier.TIER_1,
        factionPoints: 0,
        totalFPEarned: 0,
        weeklyFPEarned: 0,
        lastWeeklyReset: new Date(),
        joinedAt: new Date(),
        progressBoost: 0,
        lastActivityAt: new Date(),
      };

      await setDoc(doc(db, 'userFactions', userId), userFaction);
      Logger.success('User joined faction', { userId, factionType });
      
      return { success: true, message: `${factionType} faction'ına katıldınız!` };
    } catch (error) {
      Logger.error('joinFaction error', error);
      return { success: false, message: 'Bir hata oluştu!' };
    }
  }

  // Award Faction Points
  async awardFP(userId: string, amount: number, activityType: string, metadata?: any): Promise<boolean> {
    try {
      const userFaction = await this.getUserFaction(userId);
      if (!userFaction) {
        Logger.warn('User has no faction', { userId });
        return false;
      }

      // Calculate boost
      const progress = (userFaction.factionPoints / TIER_REQUIREMENTS.TIER_2) * 100;
      let boost = 0;
      if (progress >= 66) boost = PROGRESS_BOOSTS.AT_66_PERCENT;
      else if (progress >= 33) boost = PROGRESS_BOOSTS.AT_33_PERCENT;

      const boostedAmount = Math.floor(amount * (1 + boost / 100));

      // Update user faction
      const docRef = doc(db, 'userFactions', userId);
      await updateDoc(docRef, {
        factionPoints: increment(boostedAmount),
        totalFPEarned: increment(boostedAmount),
        weeklyFPEarned: increment(boostedAmount),
        lastActivityAt: new Date(),
        progressBoost: boost,
      });

      // Log activity
      const activity: FactionActivity = {
        id: `${Date.now()}_${userId}`,
        userId,
        factionType: userFaction.factionType,
        activityType: activityType as any,
        fpEarned: boostedAmount,
        timestamp: new Date(),
        metadata,
      };
      await setDoc(doc(db, 'factionActivities', activity.id), activity);

      Logger.success('FP awarded', { userId, amount: boostedAmount, boost });
      return true;
    } catch (error) {
      Logger.error('awardFP error', error);
      return false;
    }
  }

  // Upgrade to Tier 2
  async upgradeTier(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const userFaction = await this.getUserFaction(userId);
      if (!userFaction) {
        return { success: false, message: 'Bir faction\'a üye değilsiniz!' };
      }

      if (userFaction.tier >= FactionTier.TIER_2) {
        return { success: false, message: 'Zaten Tier 2\'desiniz!' };
      }

      if (userFaction.factionPoints < TIER_REQUIREMENTS.TIER_2) {
        return { success: false, message: `Tier 2 için ${TIER_REQUIREMENTS.TIER_2} FP gerekli! (Mevcut: ${userFaction.factionPoints})` };
      }

      // Upgrade
      const docRef = doc(db, 'userFactions', userId);
      await updateDoc(docRef, {
        tier: FactionTier.TIER_2,
        factionPoints: increment(-TIER_REQUIREMENTS.TIER_2),
      });

      Logger.success('User upgraded to Tier 2', { userId, factionType: userFaction.factionType });
      return { success: true, message: 'Tier 2\'ye yükseltildiniz!' };
    } catch (error) {
      Logger.error('upgradeTier error', error);
      return { success: false, message: 'Bir hata oluştu!' };
    }
  }

  // Get faction progress
  async getFactionProgress(userId: string): Promise<any> {
    try {
      const userFaction = await this.getUserFaction(userId);
      if (!userFaction) {
        return null;
      }

      const nextTierFP = userFaction.tier === FactionTier.TIER_1 ? TIER_REQUIREMENTS.TIER_2 : TIER_REQUIREMENTS.TIER_3;
      const progress = (userFaction.factionPoints / nextTierFP) * 100;

      return {
        faction: userFaction.factionType,
        tier: userFaction.tier,
        currentFP: userFaction.factionPoints,
        nextTierFP,
        progress: Math.min(progress, 100),
        boost: userFaction.progressBoost,
        weeklyFP: userFaction.weeklyFPEarned,
      };
    } catch (error) {
      Logger.error('getFactionProgress error', error);
      return null;
    }
  }

  // Reset weekly FP (cron job)
  async resetWeeklyFP(): Promise<void> {
    try {
      const q = query(collection(db, 'userFactions'));
      const snapshot = await getDocs(q);
      
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'userFactions', docSnap.id), {
          weeklyFPEarned: 0,
          lastWeeklyReset: new Date(),
        });
      }
      
      Logger.success('Weekly FP reset completed');
    } catch (error) {
      Logger.error('resetWeeklyFP error', error);
    }
  }

  // Check if user can join faction match
  canJoinFactionMatch(userFaction: UserFaction | null, requiredFaction: FactionType, requiredTier?: FactionTier): boolean {
    if (!userFaction) return false;
    if (userFaction.factionType !== requiredFaction) return false;
    if (requiredTier && userFaction.tier < requiredTier) return false;
    return true;
  }
}

export const factionService = new FactionService();
