"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const faction_1 = require("../types/faction");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('faction_leaderboard')
        .setDescription('Faction sıralaması')
        .addStringOption(option => option.setName('type')
        .setDescription('Sıralama türü')
        .setRequired(false)
        .addChoices({ name: '💎 En Çok FP', value: 'fp' }, { name: '⚔️ Demacia', value: faction_1.FactionType.DEMACIA }, { name: '🏴☠️ Bilgewater', value: faction_1.FactionType.BILGEWATER })),
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'fp';
        await interaction.deferReply();
        try {
            let q;
            if (type === 'fp') {
                // Tüm factionlar, FP'ye göre sırala
                q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'userFactions'), (0, firestore_1.orderBy)('totalFPEarned', 'desc'), (0, firestore_1.limit)(10));
            }
            else {
                // Belirli faction, FP'ye göre sırala
                q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'userFactions'), (0, firestore_1.where)('factionType', '==', type), (0, firestore_1.orderBy)('totalFPEarned', 'desc'), (0, firestore_1.limit)(10));
            }
            const snapshot = await (0, firestore_1.getDocs)(q);
            const users = snapshot.docs.map(doc => doc.data());
            if (users.length === 0) {
                return interaction.followUp({ content: '❌ Henüz kimse faction\'a katılmamış!', ephemeral: true });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xf39c12)
                .setTitle(type === 'fp' ? '🏆 Faction Leaderboard' : `🏆 ${type.toUpperCase()} Leaderboard`)
                .setDescription('En çok FP kazanan oyuncular')
                .setTimestamp();
            let leaderboard = '';
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                try {
                    const discordUser = await interaction.client.users.fetch(user.userId);
                    leaderboard += `${medal} **${discordUser.username}**\n`;
                    leaderboard += `├ Faction: ${user.factionType.toUpperCase()} T${user.tier}\n`;
                    leaderboard += `├ FP: ${user.factionPoints}\n`;
                    leaderboard += `└ Toplam: ${user.totalFPEarned} FP\n\n`;
                }
                catch (error) {
                    leaderboard += `${medal} Bilinmeyen Kullanıcı\n`;
                    leaderboard += `└ Toplam: ${user.totalFPEarned} FP\n\n`;
                }
            }
            embed.addFields({
                name: '📊 Sıralama',
                value: leaderboard,
                inline: false
            });
            await interaction.followUp({ embeds: [embed] });
        }
        catch (error) {
            console.error('Leaderboard hatası:', error);
            await interaction.followUp({ content: '❌ Sıralama yüklenirken hata oluştu!', ephemeral: true });
        }
    },
};
