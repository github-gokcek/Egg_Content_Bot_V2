import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Belirli bir role sahip herkese DM gönder')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option
        .setName('rol')
        .setDescription('Mesaj gönderilecek rol')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mesaj')
        .setDescription('Gönderilecek mesaj')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    console.log('[DUYURU] Komut başlatıldı');
    
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
    }

    const role = interaction.options.getRole('rol', true);
    const message = interaction.options.getString('mesaj', true);

    console.log('[DUYURU] Rol:', role.name, 'Mesaj:', message);

    await interaction.reply({ 
      content: `📤 Duyuru gönderiliyor... **${role.name}** rolüne sahip üyelere mesaj gönderiliyor.`, 
      ephemeral: true 
    });

    try {
      console.log('[DUYURU] Üyeler fetch ediliyor...');
      
      // Sadece roldeki üyeleri fetch et
      const allMembers = await interaction.guild.members.fetch({ force: false });
      
      const members = allMembers.filter(member => 
        member.roles.cache.has(role.id) && !member.user.bot
      );

      console.log('[DUYURU] Bulunan üye sayısı:', members.size);

      if (members.size === 0) {
        return interaction.editReply({ content: `❌ **${role.name}** rolüne sahip kimse bulunamadı!` });
      }

      let successCount = 0;
      let failCount = 0;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📢 Sunucu Duyurusu')
        .setDescription(message)
        .addFields({
          name: '📍 Sunucu',
          value: interaction.guild.name,
          inline: true
        }, {
          name: '🎭 Rol',
          value: role.name,
          inline: true
        })
        .setFooter({ text: `Gönderen: ${interaction.user.username}` })
        .setTimestamp();

      console.log('[DUYURU] DM gönderme başlıyor...');

      for (const [, member] of members) {
        try {
          await member.send({ embeds: [embed] });
          successCount++;
          console.log('[DUYURU] DM gönderildi:', member.user.username);
        } catch (error: any) {
          failCount++;
          console.log('[DUYURU] DM gönderilemedi:', member.user.username, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('[DUYURU] Tamamlandı. Başarılı:', successCount, 'Başarısız:', failCount);

      await interaction.editReply({
        content: `✅ **Duyuru Gönderildi!**\n\n` +
          `📊 **İstatistikler:**\n` +
          `• Toplam: ${members.size} kişi\n` +
          `• Başarılı: ${successCount} kişi\n` +
          `• Başarısız: ${failCount} kişi (DM kapalı)\n\n` +
          `🎭 **Rol:** ${role.name}`
      });

    } catch (error: any) {
      console.error('[DUYURU] HATA:', error);
      await interaction.editReply({ content: `❌ Hata: ${error.message}` }).catch(() => {});
    }
  },
};
