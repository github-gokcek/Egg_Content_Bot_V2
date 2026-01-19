"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factionService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const faction_1 = require("../types/faction");
const logger_1 = require("../utils/logger");
class FactionService {
    // Get user's faction data
    async getUserFaction(userId) {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'userFactions', userId);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        }
        catch (error) {
            logger_1.Logger.error('getUserFaction error', error);
            return null;
        }
    }
    // Join a faction (Tier 1 purchase)
    async joinFaction(userId, factionType, userBalance, tier1Price) {
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
            const userFaction = {
                userId,
                factionType,
                tier: faction_1.FactionTier.TIER_1,
                factionPoints: 0,
                totalFPEarned: 0,
                weeklyFPEarned: 0,
                lastWeeklyReset: new Date(),
                joinedAt: new Date(),
                progressBoost: 0,
                lastActivityAt: new Date(),
            };
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'userFactions', userId), userFaction);
            logger_1.Logger.success('User joined faction', { userId, factionType });
            return { success: true, message: `${factionType} faction'ına katıldınız!` };
        }
        catch (error) {
            logger_1.Logger.error('joinFaction error', error);
            return { success: false, message: 'Bir hata oluştu!' };
        }
    }
    // Award Faction Points
    async awardFP(userId, amount, activityType, metadata) {
        try {
            const userFaction = await this.getUserFaction(userId);
            if (!userFaction) {
                logger_1.Logger.warn('User has no faction', { userId });
                return false;
            }
            // Calculate boost
            const progress = (userFaction.factionPoints / faction_1.TIER_REQUIREMENTS.TIER_2) * 100;
            let boost = 0;
            if (progress >= 66)
                boost = faction_1.PROGRESS_BOOSTS.AT_66_PERCENT;
            else if (progress >= 33)
                boost = faction_1.PROGRESS_BOOSTS.AT_33_PERCENT;
            const boostedAmount = Math.floor(amount * (1 + boost / 100));
            // Update user faction
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'userFactions', userId);
            await (0, firestore_1.updateDoc)(docRef, {
                factionPoints: (0, firestore_1.increment)(boostedAmount),
                totalFPEarned: (0, firestore_1.increment)(boostedAmount),
                weeklyFPEarned: (0, firestore_1.increment)(boostedAmount),
                lastActivityAt: new Date(),
                progressBoost: boost,
            });
            // Log activity
            const activity = {
                id: `${Date.now()}_${userId}`,
                userId,
                factionType: userFaction.factionType,
                activityType: activityType,
                fpEarned: boostedAmount,
                timestamp: new Date(),
                metadata,
            };
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'factionActivities', activity.id), activity);
            logger_1.Logger.success('FP awarded', { userId, amount: boostedAmount, boost });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('awardFP error', error);
            return false;
        }
    }
    // Upgrade to Tier 2
    async upgradeTier(userId) {
        try {
            const userFaction = await this.getUserFaction(userId);
            if (!userFaction) {
                return { success: false, message: 'Bir faction\'a üye değilsiniz!' };
            }
            if (userFaction.tier >= faction_1.FactionTier.TIER_2) {
                return { success: false, message: 'Zaten Tier 2\'desiniz!' };
            }
            if (userFaction.factionPoints < faction_1.TIER_REQUIREMENTS.TIER_2) {
                return { success: false, message: `Tier 2 için ${faction_1.TIER_REQUIREMENTS.TIER_2} FP gerekli! (Mevcut: ${userFaction.factionPoints})` };
            }
            // Upgrade
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'userFactions', userId);
            await (0, firestore_1.updateDoc)(docRef, {
                tier: faction_1.FactionTier.TIER_2,
                factionPoints: (0, firestore_1.increment)(-faction_1.TIER_REQUIREMENTS.TIER_2),
            });
            logger_1.Logger.success('User upgraded to Tier 2', { userId, factionType: userFaction.factionType });
            return { success: true, message: 'Tier 2\'ye yükseltildiniz!' };
        }
        catch (error) {
            logger_1.Logger.error('upgradeTier error', error);
            return { success: false, message: 'Bir hata oluştu!' };
        }
    }
    // Get faction progress
    async getFactionProgress(userId) {
        try {
            const userFaction = await this.getUserFaction(userId);
            if (!userFaction) {
                return null;
            }
            const nextTierFP = userFaction.tier === faction_1.FactionTier.TIER_1 ? faction_1.TIER_REQUIREMENTS.TIER_2 : faction_1.TIER_REQUIREMENTS.TIER_3;
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
        }
        catch (error) {
            logger_1.Logger.error('getFactionProgress error', error);
            return null;
        }
    }
    // Reset weekly FP (cron job)
    async resetWeeklyFP() {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'userFactions'));
            const snapshot = await (0, firestore_1.getDocs)(q);
            for (const docSnap of snapshot.docs) {
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'userFactions', docSnap.id), {
                    weeklyFPEarned: 0,
                    lastWeeklyReset: new Date(),
                });
            }
            logger_1.Logger.success('Weekly FP reset completed');
        }
        catch (error) {
            logger_1.Logger.error('resetWeeklyFP error', error);
        }
    }
    // Check if user can join faction match
    canJoinFactionMatch(userFaction, requiredFaction, requiredTier) {
        if (!userFaction)
            return false;
        if (userFaction.factionType !== requiredFaction)
            return false;
        if (requiredTier && userFaction.tier < requiredTier)
            return false;
        return true;
    }
}
exports.factionService = new FactionService();
