"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const factionService_1 = require("../services/factionService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('faction_admin')
        .setDescription('Faction yönetimi (Admin)')
        .addSubcommand(subcommand => subcommand
        .setName('award_fp')
        .setDescription('Bir kullanıcıya FP ver')
        .addUserOption(option => option.setName('user')
        .setDescription('Kullanıcı')
        .setRequired(true))
        .addIntegerOption(option => option.setName('amount')
        .setDescription('FP miktarı')
        .setRequired(true)
        .setMinValue(1))
        .addStringOption(option => option.setName('reason')
        .setDescription('Sebep')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('reset_weekly')
        .setDescription('Haftalık FP sıfırla (tüm kullanıcılar)'))
        .addSubcommand(subcommand => subcommand
        .setName('reset_daily_voice')
        .setDescription('Günlük voice FP sıfırla'))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'award_fp') {
            const user = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);
            const reason = interaction.options.getString('reason') || 'Admin tarafından verildi';
            const success = await factionService_1.factionService.awardFP(user.id, amount, 'event', { reason, adminId: interaction.user.id });
            if (success) {
                await interaction.reply({
                    content: `✅ ${user.username} kullanıcısına **${amount} FP** verildi!\nSebep: ${reason}`,
                    ephemeral: false
                });
                logger_1.Logger.success('Admin FP verdi', { userId: user.id, amount, adminId: interaction.user.id });
            }
            else {
                await interaction.reply({
                    content: `❌ ${user.username} bir faction'a üye değil!`,
                    ephemeral: true
                });
            }
        }
        else if (subcommand === 'reset_weekly') {
            await interaction.deferReply({ ephemeral: true });
            await factionService_1.factionService.resetWeeklyFP();
            await interaction.followUp({
                content: '✅ Tüm kullanıcıların haftalık FP\'si sıfırlandı!',
                ephemeral: true
            });
            logger_1.Logger.success('Haftalık FP sıfırlandı', { adminId: interaction.user.id });
        }
        else if (subcommand === 'reset_daily_voice') {
            const { voiceActivityService } = await Promise.resolve().then(() => __importStar(require('../services/voiceActivityService')));
            voiceActivityService.resetDailyFP();
            await interaction.reply({
                content: '✅ Günlük voice FP sıfırlandı!',
                ephemeral: true
            });
            logger_1.Logger.success('Günlük voice FP sıfırlandı', { adminId: interaction.user.id });
        }
    },
};
