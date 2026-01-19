import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { FactionType } from '../types/faction';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faction_leaderboard')
    .setDescription('Faction sıralaması')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Sıralama türü')
        .setRequired(false)
        .addChoices(
          { name: '💎 En Çok FP', value: 'fp' },
          { name: '⚔️ Demacia', value: FactionType.DEMACIA },
          { name: '🏴☠️ Bilgewater', value: FactionType.BILGEWATER }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type') || 'fp';

    await interaction.deferReply();

    try {
      let q;
      
      if (type === 'fp') {
        // Tüm factionlar, FP'ye göre sırala
        q = query(
          collection(db, 'userFactions'),
          orderBy('totalFPEarned', 'desc'),
          limit(10)
        );
      } else {
        // Belirli faction, FP'ye göre sırala
        q = query(
          collection(db, 'userFactions'),
          where('factionType', '==', type),
          orderBy('totalFPEarned', 'desc'),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => doc.data());

      if (users.length === 0) {
        return interaction.followUp({ content: '❌ Henüz kimse faction\'a katılmamış!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
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
        } catch (error) {
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
    } catch (error) {
      console.error('Leaderboard hatası:', error);
      await interaction.followUp({ content: '❌ Sıralama yüklenirken hata oluştu!', ephemeral: true });
    }
  },
};
