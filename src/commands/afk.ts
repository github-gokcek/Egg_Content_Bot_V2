import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface AfkStatus {
  userId: string;
  message: string;
  setAt: string;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK durumu yönetimi')
    .addSubcommand(sub =>
      sub.setName('ayarla')
        .setDescription('AFK durumunu ayarla')
        .addStringOption(opt => opt.setName('mesaj').setDescription('AFK mesajı').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('kontrol')
        .setDescription('Bir kullanıcının AFK durumunu kontrol et')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Kontrol edilecek kullanıcı').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('kaldir')
        .setDescription('AFK durumunu kaldır')),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ayarla') {
      const message = interaction.options.getString('mesaj', true);
      
      const afkStatus: AfkStatus = {
        userId: interaction.user.id,
        message: message,
        setAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'afkStatuses', interaction.user.id), afkStatus);
        
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('💤 AFK Durumu Ayarlandı')
          .setDescription(`**Mesaj:** ${message}`)
          .setFooter({ text: 'AFK durumunu kaldırmak için: /afk kaldir' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        await interaction.reply({
          content: '❌ AFK durumu ayarlanırken bir hata oluştu!',
          ephemeral: true
        });
      }
    }

    else if (subcommand === 'kontrol') {
      const user = interaction.options.getUser('kullanici', true);

      try {
        const docSnap = await getDoc(doc(db, 'afkStatuses', user.id));

        if (!docSnap.exists()) {
          return interaction.reply({
            content: `ℹ️ ${user.username} şu anda AFK değil.`,
            ephemeral: true
          });
        }

        const afkData = docSnap.data() as AfkStatus;
        const setAt = new Date(afkData.setAt);
        const now = new Date();
        const duration = now.getTime() - setAt.getTime();
        
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeText = '';
        if (hours > 0) timeText += `${hours} saat `;
        if (minutes > 0) timeText += `${minutes} dakika`;
        if (!timeText) timeText = 'Az önce';

        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(`💤 ${user.username} AFK`)
          .addFields(
            { name: '📝 Mesaj', value: afkData.message },
            { name: '⏰ Süre', value: timeText }
          )
          .setThumbnail(user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        await interaction.reply({
          content: '❌ AFK durumu kontrol edilirken bir hata oluştu!',
          ephemeral: true
        });
      }
    }

    else if (subcommand === 'kaldir') {
      try {
        const docSnap = await getDoc(doc(db, 'afkStatuses', interaction.user.id));

        if (!docSnap.exists()) {
          return interaction.reply({
            content: '❌ Zaten AFK durumunuz yok!',
            ephemeral: true
          });
        }

        await deleteDoc(doc(db, 'afkStatuses', interaction.user.id));

        await interaction.reply({
          content: '✅ AFK durumunuz kaldırıldı!',
          ephemeral: true
        });
      } catch (error) {
        await interaction.reply({
          content: '❌ AFK durumu kaldırılırken bir hata oluştu!',
          ephemeral: true
        });
      }
    }
  },
};
