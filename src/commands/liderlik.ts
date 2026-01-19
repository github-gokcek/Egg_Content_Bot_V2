import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { configService } from '../services/configService';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liderlik')
    .setDescription('Liderlik tablosunu göster')
    .addStringOption(option =>
      option.setName('kategori')
        .setDescription('Hangi kategoride liderlik tablosu?')
        .setRequired(true)
        .addChoices(
          { name: '🎮 LoL Kazanma', value: 'lol_wins' },
          { name: '♟️ TFT Puanı', value: 'tft_points' },
          { name: '💰 Bakiye', value: 'balance' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('kategori', true);
    
    await interaction.deferReply();

    try {
      let playersQuery;
      let title;
      let description;
      let valueField;

      switch (category) {
        case 'lol_wins':
          playersQuery = query(
            collection(db, 'players'),
            orderBy('lolWins', 'desc'),
            limit(10)
          );
          title = '🏆 LoL Liderlik Tablosu';
          description = 'En çok LoL maçı kazanan oyuncular';
          valueField = 'lolWins';
          break;
        case 'tft_points':
          playersQuery = query(
            collection(db, 'players'),
            orderBy('tftPoints', 'desc'),
            limit(10)
          );
          title = '♟️ TFT Liderlik Tablosu';
          description = 'En yüksek TFT puanına sahip oyuncular';
          valueField = 'tftPoints';
          break;
        case 'balance':
          playersQuery = query(
            collection(db, 'players'),
            orderBy('balance', 'desc'),
            limit(10)
          );
          title = '💰 Bakiye Liderlik Tablosu';
          description = 'En zengin oyuncular';
          valueField = 'balance';
          break;
        default:
          return interaction.editReply({ content: '❌ Geçersiz kategori!' });
      }

      const snapshot = await getDocs(playersQuery);
      
      if (snapshot.empty) {
        return interaction.editReply({ content: '❌ Henüz hiç oyuncu verisi yok!' });
      }

      const players = snapshot.docs.map(doc => doc.data());
      
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

      let leaderboardText = '';
      const medals = ['🥇', '🥈', '🥉'];

      players.forEach((player, index) => {
        const medal = index < 3 ? medals[index] : `${index + 1}.`;
        const value = player[valueField] || 0;
        const suffix = category === 'balance' ? ' 🪙' : category === 'tft_points' ? ' puan' : ' galibiyet';
        
        leaderboardText += `${medal} <@${player.discordId}> - **${value}${suffix}**\n`;
      });

      embed.addFields({
        name: '📊 Sıralama',
        value: leaderboardText,
        inline: false
      });

      // Liderlik kanalına gönder
      const leaderboardChannelId = await configService.getLeaderboardChannel(interaction.guildId!);
      if (leaderboardChannelId && leaderboardChannelId !== interaction.channelId) {
        const leaderboardChannel = await interaction.client.channels.fetch(leaderboardChannelId);
        if (leaderboardChannel?.isTextBased()) {
          await leaderboardChannel.send({ embeds: [embed] });
        }
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Liderlik tablosu hatası:', error);
      await interaction.editReply({ content: '❌ Liderlik tablosu alınırken hata oluştu!' });
    }
  },
};