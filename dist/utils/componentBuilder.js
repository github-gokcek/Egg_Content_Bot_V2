"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentBuilder = void 0;
const discord_js_1 = require("discord.js");
const types_1 = require("../types");
class ComponentBuilder {
    static createGameModeSelect() {
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('select_game_mode')
            .setPlaceholder('Oyun modu seçin')
            .addOptions([
            {
                label: 'LoL - Sihirdar Vadisi',
                description: '5v5 Klasik mod',
                value: 'lol_summoners_rift',
                emoji: '⚔️'
            },
            {
                label: 'LoL - ARAM',
                description: '5v5 Tek koridor',
                value: 'lol_aram',
                emoji: '🎲'
            },
            {
                label: 'TFT - Solo',
                description: '8 kişilik solo oyun',
                value: 'tft_solo',
                emoji: '♟️'
            },
            {
                label: 'TFT - Double Up',
                description: '4 takım 2\'şer kişi',
                value: 'tft_double',
                emoji: '👥'
            }
        ]);
        return new discord_js_1.ActionRowBuilder().addComponents(select);
    }
    static createLolTeamButtons(mode) {
        if (mode === types_1.LolMode.ARAM) {
            return [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('join_blue')
                    .setLabel('Mavi Takım')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('🔵'), new discord_js_1.ButtonBuilder()
                    .setCustomId('join_red')
                    .setLabel('Kırmızı Takım')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setEmoji('🔴'), new discord_js_1.ButtonBuilder()
                    .setCustomId('leave_match')
                    .setLabel('Ayrıl')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('❌'), new discord_js_1.ButtonBuilder()
                    .setCustomId('lol_force_start')
                    .setLabel('Maçı Başlat (Admin)')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('⚡'))
            ];
        }
        // Sihirdar Vadisi - Mavi Takım
        const blueRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`join_blue_${types_1.LolRole.TOP}`)
            .setLabel('Üst')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('⬆️'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_blue_${types_1.LolRole.JUNGLE}`)
            .setLabel('Orman')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🌲'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_blue_${types_1.LolRole.MID}`)
            .setLabel('Orta')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('⭐'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_blue_${types_1.LolRole.ADC}`)
            .setLabel('ADC')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🎯'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_blue_${types_1.LolRole.SUPPORT}`)
            .setLabel('Destek')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🛡️'));
        // Kırmızı Takım
        const redRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`join_red_${types_1.LolRole.TOP}`)
            .setLabel('Üst')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('⬆️'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_red_${types_1.LolRole.JUNGLE}`)
            .setLabel('Orman')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('🌲'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_red_${types_1.LolRole.MID}`)
            .setLabel('Orta')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('⭐'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_red_${types_1.LolRole.ADC}`)
            .setLabel('ADC')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('🎯'), new discord_js_1.ButtonBuilder()
            .setCustomId(`join_red_${types_1.LolRole.SUPPORT}`)
            .setLabel('Destek')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('🛡️'));
        // Ayrıl butonu
        const leaveRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('leave_match')
            .setLabel('Maçtan Ayrıl')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setEmoji('❌'), new discord_js_1.ButtonBuilder()
            .setCustomId('lol_force_start')
            .setLabel('Maçı Başlat (Admin)')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('⚡'));
        return [blueRow, redRow, leaveRow];
    }
    static createTftButtons(mode) {
        if (mode === 'double') {
            // Double Up - Takım butonları
            return [
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_join_team1')
                    .setLabel('1. Takım')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('🥇'), new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_join_team2')
                    .setLabel('2. Takım')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('🥈'), new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_join_team3')
                    .setLabel('3. Takım')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('🥉'), new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_join_team4')
                    .setLabel('4. Takım')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('🏅')),
                new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_leave')
                    .setLabel('Ayrıl')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setEmoji('❌'), new discord_js_1.ButtonBuilder()
                    .setCustomId('tft_force_start')
                    .setLabel('Maçı Başlat (Admin)')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('⚡'))
            ];
        }
        // Solo
        return [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('tft_join')
                .setLabel('Oyuna Katıl')
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setEmoji('🎮'), new discord_js_1.ButtonBuilder()
                .setCustomId('tft_join_reserve')
                .setLabel('Yedek Olarak Katıl')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji('🔄'), new discord_js_1.ButtonBuilder()
                .setCustomId('tft_leave')
                .setLabel('Ayrıl')
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setEmoji('❌'), new discord_js_1.ButtonBuilder()
                .setCustomId('tft_force_start')
                .setLabel('Maçı Başlat (Admin)')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji('⚡'))
        ];
    }
    static createWatchButtons(matchId) {
        return [
            new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`watch_blue_${matchId}`)
                .setLabel('Mavi Takımı İzle')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji('🔵'), new discord_js_1.ButtonBuilder()
                .setCustomId(`watch_red_${matchId}`)
                .setLabel('Kırmızı Takımı İzle')
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setEmoji('🔴'))
        ];
    }
}
exports.ComponentBuilder = ComponentBuilder;
