import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ses')
    .setDescription('Bugünkü ses kanalı aktivitesini gösterir'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const snapshot = await getDocs(collection(db, 'voiceSessions'));
      const now = new Date();
      const activities: { userId: string; duration: number }[] = [];

      for (const docSnap of snapshot.docs) {
        const session = docSnap.data();
        
        // joinedAt'i Date objesine çevir
        let joinedAt: Date;
        if (session.joinedAt instanceof Date) {
          joinedAt = session.joinedAt;
        } else if (session.joinedAt?.toDate) {
          // Firestore Timestamp
          joinedAt = session.joinedAt.toDate();
        } else if (typeof session.joinedAt === 'string') {
          joinedAt = new Date(session.joinedAt);
        } else {
          // Geçersiz tarih, atla
          continue;
        }
        
        const duration = now.getTime() - joinedAt.getTime();
        
        // Negatif veya çok büyük değerleri filtrele
        if (duration > 0 && duration < 24 * 60 * 60 * 1000) { // Max 24 saat
          activities.push({
            userId: session.userId,
            duration: duration
          });
        }
      }

      activities.sort((a, b) => b.duration - a.duration);

      if (activities.length === 0) {
        return interaction.editReply({
          content: '🔇 Şu anda ses kanalında kimse yok!'
        });
      }

      const formatDuration = (ms: number): string => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      };

      const activityText = activities
        .slice(0, 10)
        .map(a => `<@${a.userId}> — ${formatDuration(a.duration)}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎤 Today Voice Activity')
        .setDescription(activityText)
        .setFooter({ text: `Toplam ${activities.length} kullanıcı` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Ses aktivitesi hatası:', error);
      await interaction.editReply({
        content: '❌ Ses aktivitesi alınırken bir hata oluştu!'
      });
    }
  },
};
