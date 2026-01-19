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
const faction_1 = require("../types/faction");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('faction')
        .setDescription('Faction sistemi komutları')
        .addSubcommand(subcommand => subcommand
        .setName('join')
        .setDescription('Bir faction\'a katıl (Tier 1)')
        .addStringOption(option => option.setName('faction')
        .setDescription('Katılmak istediğiniz faction')
        .setRequired(true)
        .addChoices({ name: '⚔️ Demacia', value: faction_1.FactionType.DEMACIA }, { name: '⚔️ Noxus', value: faction_1.FactionType.NOXUS }, { name: '🌸 Ionia', value: faction_1.FactionType.IONIA }, { name: '⚙️ Piltover', value: faction_1.FactionType.PILTOVER }, { name: '⚗️ Zaun', value: faction_1.FactionType.ZAUN }, { name: '❄️ Freljord', value: faction_1.FactionType.FRELJORD }, { name: '🏜️ Shurima', value: faction_1.FactionType.SHURIMA }, { name: '🏴☠️ Bilgewater', value: faction_1.FactionType.BILGEWATER })))
        .addSubcommand(subcommand => subcommand
        .setName('progress')
        .setDescription('Faction ilerlemenizi görüntüleyin'))
        .addSubcommand(subcommand => subcommand
        .setName('upgrade')
        .setDescription('Tier 2\'ye yükseltin (FP ile)'))
        .addSubcommand(subcommand => subcommand
        .setName('info')
        .setDescription('Faction sistemi hakkında bilgi')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'join') {
            const factionType = interaction.options.getString('faction', true);
            const { databaseService } = await Promise.resolve().then(() => __importStar(require('../services/databaseService')));
            const player = await databaseService.getPlayer(interaction.user.id);
            if (!player) {
                return interaction.reply({ content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!', ephemeral: true });
            }
            const tier1Price = 50;
            const result = await factionService_1.factionService.joinFaction(interaction.user.id, factionType, player.balance, tier1Price);
            if (result.success) {
                player.balance -= tier1Price;
                await databaseService.updatePlayer(player);
                if (interaction.guild) {
                    const roleNames = {
                        [faction_1.FactionType.DEMACIA]: '⚔️ Demacia T1',
                        [faction_1.FactionType.NOXUS]: '⚔️ Noxus T1',
                        [faction_1.FactionType.IONIA]: '🌸 Ionia T1',
                        [faction_1.FactionType.PILTOVER]: '⚙️ Piltover T1',
                        [faction_1.FactionType.ZAUN]: '⚗️ Zaun T1',
                        [faction_1.FactionType.FRELJORD]: '❄️ Freljord T1',
                        [faction_1.FactionType.SHURIMA]: '🏜️ Shurima T1',
                        [faction_1.FactionType.BILGEWATER]: '🏴☠️ Bilgewater T1',
                    };
                    const roleName = roleNames[factionType];
                    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                    if (role) {
                        const member = await interaction.guild.members.fetch(interaction.user.id);
                        await member.roles.add(role);
                    }
                }
                await interaction.reply({ content: `✅ ${result.message} (${tier1Price} 🪙 harcandı)`, ephemeral: false });
            }
            else {
                await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
            }
        }
        else if (subcommand === 'progress') {
            const progress = await factionService_1.factionService.getFactionProgress(interaction.user.id);
            if (!progress) {
                return interaction.reply({ content: '❌ Bir faction\'a üye değilsiniz! `/faction join` kullanın.', ephemeral: true });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`${progress.faction.toUpperCase()} - Tier ${progress.tier}`)
                .setDescription('Faction ilerlemeniz')
                .addFields({ name: '💎 Faction Points', value: `${progress.currentFP} FP`, inline: true }, { name: '🎯 Sonraki Tier', value: `${progress.nextTierFP} FP`, inline: true }, { name: '📊 İlerleme', value: `${progress.progress.toFixed(1)}%`, inline: true }, { name: '⚡ Aktif Boost', value: `+${progress.boost}% FP`, inline: true }, { name: '📅 Haftalık FP', value: `${progress.weeklyFP} FP`, inline: true })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else if (subcommand === 'upgrade') {
            const userFaction = await factionService_1.factionService.getUserFaction(interaction.user.id);
            const result = await factionService_1.factionService.upgradeTier(interaction.user.id);
            if (result.success && userFaction) {
                if (interaction.guild) {
                    const roleNames = {
                        [faction_1.FactionType.DEMACIA]: '⚔️ Demacia T2',
                        [faction_1.FactionType.NOXUS]: '⚔️ Noxus T2',
                        [faction_1.FactionType.IONIA]: '🌸 Ionia T2',
                        [faction_1.FactionType.PILTOVER]: '⚙️ Piltover T2',
                        [faction_1.FactionType.ZAUN]: '⚗️ Zaun T2',
                        [faction_1.FactionType.FRELJORD]: '❄️ Freljord T2',
                        [faction_1.FactionType.SHURIMA]: '🏜️ Shurima T2',
                        [faction_1.FactionType.BILGEWATER]: '🏴☠️ Bilgewater T2',
                    };
                    const roleName = roleNames[userFaction.factionType];
                    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                    if (role) {
                        const member = await interaction.guild.members.fetch(interaction.user.id);
                        await member.roles.add(role);
                    }
                }
                await interaction.reply({ content: `✅ ${result.message}`, ephemeral: false });
            }
            else {
                await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
            }
        }
        else if (subcommand === 'info') {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xf39c12)
                .setTitle('⚔️ Faction Sistemi')
                .setDescription('League of Legends evrenindeki bölgelere özel faction sistemi!')
                .addFields({ name: '🎯 Nasıl Çalışır?', value: 'Bir faction\'a katılın, aktivitelerle **Faction Points (FP)** kazanın ve tier\'ınızı yükseltin!', inline: false }, { name: '💰 Tier 1', value: 'Giriş seviyesi - Normal para ile satın alınır\nFP kazanmaya başlarsınız', inline: true }, { name: '⭐ Tier 2', value: 'Sadece FP ile alınır (500 FP)\nFaction maçlarına katılabilirsiniz', inline: true }, { name: '💎 FP Kazanma', value: '• Maç katılımı: 5 FP\n• Maç tamamlama: 10 FP\n• Maç kazanma: 15 FP\n• Event: 25 FP', inline: false }, { name: '⚡ Progress Boost', value: '• %33 ilerleme: +10% FP\n• %66 ilerleme: +20% FP', inline: false })
                .setFooter({ text: 'Faction vs Faction maçları yakında!' })
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
