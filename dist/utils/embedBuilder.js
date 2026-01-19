"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedBuilder = void 0;
const discord_js_1 = require("discord.js");
const types_1 = require("../types");
class EmbedBuilder {
    static createLolMatchEmbed(match) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(match.status === 'waiting' ? 0x3498db : match.status === 'active' ? 0x2ecc71 : 0x95a5a6)
            .setTitle(`🎮 ${match.mode === types_1.LolMode.SUMMONERS_RIFT ? 'Sihirdar Vadisi' : 'ARAM'} Maçı`)
            .setDescription(`**Maç ID:** \`${match.id}\`\n**Durum:** ${this.getStatusEmoji(match.status)} ${this.getStatusText(match.status)}`)
            .setTimestamp(match.createdAt);
        const blueTeamText = this.formatLolTeam(match.blueTeam, match.mode);
        const redTeamText = this.formatLolTeam(match.redTeam, match.mode);
        embed.addFields({ name: '🔵 Mavi Takım', value: blueTeamText || '*Boş*', inline: true }, { name: '🔴 Kırmızı Takım', value: redTeamText || '*Boş*', inline: true });
        if (match.status === 'completed' && match.winner) {
            embed.addFields({
                name: '🏆 Kazanan',
                value: match.winner === types_1.Team.BLUE ? '🔵 Mavi Takım' : '🔴 Kırmızı Takım',
                inline: false
            });
        }
        return embed;
    }
    static createTftMatchEmbed(match) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(match.status === 'waiting' ? 0xe67e22 : match.status === 'active' ? 0x2ecc71 : 0x95a5a6)
            .setTitle(`♟️ TFT ${match.mode === types_1.TftMode.SOLO ? 'Solo' : 'Double Up'} Maçı`)
            .setDescription(`**Maç ID:** \`${match.id}\`\n**Durum:** ${this.getStatusEmoji(match.status)} ${this.getStatusText(match.status)}`)
            .setTimestamp(match.createdAt);
        if (match.mode === types_1.TftMode.DOUBLE && match.teams) {
            // Double Up - Takımları göster
            const team1Text = match.teams.team1 ? match.teams.team1.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team2Text = match.teams.team2 ? match.teams.team2.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team3Text = match.teams.team3 ? match.teams.team3.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team4Text = match.teams.team4 ? match.teams.team4.map(p => `<@${p}>`).join(', ') : '*Boş*';
            embed.addFields({ name: '🥇 1. Takım', value: team1Text, inline: true }, { name: '🥈 2. Takım', value: team2Text, inline: true }, { name: '🥉 3. Takım', value: team3Text, inline: true }, { name: '🏅 4. Takım', value: team4Text, inline: true });
        }
        else {
            // Solo - Oyuncuları göster
            const playersText = match.players.length > 0
                ? match.players.map((p, i) => `${i + 1}. <@${p}>`).join('\n')
                : '*Boş*';
            const reservesText = match.reserves.length > 0
                ? match.reserves.map(p => `<@${p}>`).join(', ')
                : '*Yok*';
            embed.addFields({ name: `🎮 Oyuncular (${match.players.length}/8)`, value: playersText, inline: false }, { name: '🔄 Yedekler', value: reservesText, inline: false });
        }
        if (match.status === 'completed' && match.rankings) {
            const rankingsText = match.rankings.map((p, i) => {
                const points = this.getTftPoints(i + 1);
                return `${i + 1}. <@${p}> (${points > 0 ? '+' : ''}${points} puan)`;
            }).join('\n');
            embed.addFields({
                name: '🏆 Sıralama',
                value: rankingsText,
                inline: false
            });
        }
        return embed;
    }
    static formatLolTeam(team, mode) {
        if (mode === types_1.LolMode.ARAM) {
            const players = Object.values(team).filter(Boolean);
            return players.length > 0 ? players.map((p, i) => `${i + 1}. <@${p}>`).join('\n') : '';
        }
        const roles = [types_1.LolRole.TOP, types_1.LolRole.JUNGLE, types_1.LolRole.MID, types_1.LolRole.ADC, types_1.LolRole.SUPPORT];
        const roleEmojis = { top: '⬆️', jungle: '🌲', mid: '⭐', adc: '🎯', support: '🛡️' };
        return roles
            .map(role => {
            const player = team[role];
            return `${roleEmojis[role]} **${role.toUpperCase()}**: ${player ? `<@${player}>` : '*Boş*'}`;
        })
            .join('\n');
    }
    static getStatusEmoji(status) {
        switch (status) {
            case 'waiting': return '⏳';
            case 'active': return '🎮';
            case 'completed': return '✅';
            default: return '❓';
        }
    }
    static getStatusText(status) {
        switch (status) {
            case 'waiting': return 'Oyuncular Bekleniyor';
            case 'active': return 'Maç Devam Ediyor';
            case 'completed': return 'Maç Tamamlandı';
            default: return 'Bilinmiyor';
        }
    }
    static createMatchStartedEmbed(match) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(`🎮 ${match.mode === types_1.LolMode.SUMMONERS_RIFT ? 'Sihirdar Vadisi' : 'ARAM'} Maçı Başladı!`)
            .setDescription(`**Maç ID:** \`${match.id}\`\n**Durum:** 🎮 Maç Devam Ediyor`)
            .setTimestamp();
        const blueTeamText = this.formatLolTeam(match.blueTeam, match.mode);
        const redTeamText = this.formatLolTeam(match.redTeam, match.mode);
        embed.addFields({ name: '🔵 Mavi Takım', value: blueTeamText || '*Boş*', inline: true }, { name: '🔴 Kırmızı Takım', value: redTeamText || '*Boş*', inline: true }, { name: '👁️ İzleme', value: 'Aşağıdaki butonlarla takımları izleyebilirsiniz!', inline: false });
        return embed;
    }
    static createTftMatchStartedEmbed(match) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(`♟️ TFT ${match.mode === types_1.TftMode.SOLO ? 'Solo' : 'Double Up'} Maçı Başladı!`)
            .setDescription(`**Maç ID:** \`${match.id}\`\n**Durum:** 🎮 Maç Devam Ediyor`)
            .setTimestamp();
        if (match.mode === types_1.TftMode.DOUBLE && match.teams) {
            const team1Text = match.teams.team1 ? match.teams.team1.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team2Text = match.teams.team2 ? match.teams.team2.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team3Text = match.teams.team3 ? match.teams.team3.map(p => `<@${p}>`).join(', ') : '*Boş*';
            const team4Text = match.teams.team4 ? match.teams.team4.map(p => `<@${p}>`).join(', ') : '*Boş*';
            embed.addFields({ name: '🥇 1. Takım', value: team1Text, inline: true }, { name: '🥈 2. Takım', value: team2Text, inline: true }, { name: '🥉 3. Takım', value: team3Text, inline: true }, { name: '🏅 4. Takım', value: team4Text, inline: true });
        }
        else {
            embed.addFields({ name: `🎮 Oyuncular (${match.players.length})`, value: playersText, inline: false });
        }
        return embed;
    }
    static getTftPoints(rank) {
        const points = [5, 3, 2, 1, -1, -2, -3, -5];
        return points[rank - 1] || 0;
    }
}
exports.EmbedBuilder = EmbedBuilder;
