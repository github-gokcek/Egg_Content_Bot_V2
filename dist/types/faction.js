"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRESS_BOOSTS = exports.TIER_REQUIREMENTS = exports.FP_RATES = exports.FactionTier = exports.FactionType = void 0;
// Faction Types
var FactionType;
(function (FactionType) {
    FactionType["DEMACIA"] = "demacia";
    FactionType["NOXUS"] = "noxus";
    FactionType["IONIA"] = "ionia";
    FactionType["PILTOVER"] = "piltover";
    FactionType["ZAUN"] = "zaun";
    FactionType["FRELJORD"] = "freljord";
    FactionType["SHURIMA"] = "shurima";
    FactionType["BILGEWATER"] = "bilgewater";
})(FactionType || (exports.FactionType = FactionType = {}));
var FactionTier;
(function (FactionTier) {
    FactionTier[FactionTier["TIER_1"] = 1] = "TIER_1";
    FactionTier[FactionTier["TIER_2"] = 2] = "TIER_2";
    FactionTier[FactionTier["TIER_3"] = 3] = "TIER_3";
})(FactionTier || (exports.FactionTier = FactionTier = {}));
// FP Earning Rates (Constants)
exports.FP_RATES = {
    MATCH_PARTICIPATION: 5,
    MATCH_COMPLETION: 10,
    MATCH_WIN: 15,
    VOICE_ACTIVITY_PER_10MIN: 1,
    VOICE_DAILY_CAP: 30,
    EVENT_COMPLETION: 25,
};
// Tier Requirements
exports.TIER_REQUIREMENTS = {
    TIER_2: 500, // FP needed for Tier 2
    TIER_3: 2000, // FP needed for Tier 3 (future)
};
// Progress Boosts
exports.PROGRESS_BOOSTS = {
    AT_33_PERCENT: 10, // +10% FP gain
    AT_66_PERCENT: 20, // +20% FP gain (cumulative)
};
