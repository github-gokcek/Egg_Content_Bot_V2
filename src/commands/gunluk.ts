import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { questService } from '../services/questService';

interface DailyReward {
  userId: string;
  lastClaim: string; // ISO date
}

const DAILY_REWARD = 100;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('günlük')
    .setDescription('Günlük 100 coin ödülünü topla!'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const player = await databaseService.getPlayer(interaction.user.id);
    if (!player) {
      return interaction.reply({
        content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
        ephemeral: true
      });
    }

    // Son claim zamanını kontrol et
    const dailyDoc = await getDoc(doc(db, 'dailyRewards', interaction.user.id));
    
    if (dailyDoc.exists()) {
      const data = dailyDoc.data() as DailyReward;
      const lastClaim = new Date(data.lastClaim);
      const now = new Date();
      
      // Aynı gün mü kontrol et
      if (lastClaim.getDate() === now.getDate() && 
          lastClaim.getMonth() === now.getMonth() && 
          lastClaim.getFullYear() === now.getFullYear()) {
        
        // Bir sonraki claim zamanını hesapla
        const nextClaim = new Date(lastClaim);
        nextClaim.setDate(nextClaim.getDate() + 1);
        nextClaim.setHours(0, 0, 0, 0);
        
        const timeLeft = nextClaim.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return interaction.reply({
          content: `⏰ Günlük ödülünü zaten topladın! Bir sonraki ödül için **${hoursLeft} saat ${minutesLeft} dakika** beklemen gerekiyor.`,
          ephemeral: true
        });
      }
    }

    // Ödülü ver
    player.balance += DAILY_REWARD;
    await databaseService.updatePlayer(player);

    // Son claim zamanını kaydet
    await setDoc(doc(db, 'dailyRewards', interaction.user.id), {
      userId: interaction.user.id,
      lastClaim: new Date().toISOString()
    });

    // Quest tracking
    await questService.trackDailyCommand(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎁 Günlük Ödül Toplandı!')
      .setDescription(`Günlük ödülünü başarıyla topladın!`)
      .addFields(
        { name: '💰 Kazanç', value: `+${DAILY_REWARD} 🪙`, inline: true },
        { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
      )
      .setFooter({ text: 'Her gün tekrar gelebilirsin!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
