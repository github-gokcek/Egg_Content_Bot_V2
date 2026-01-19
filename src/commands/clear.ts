import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Mesajları sil (Admin)')
    .addIntegerOption(option =>
      option.setName('sayi')
        .setDescription('Silinecek mesaj sayısı (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('sayi', true);
    
    if (!interaction.channel?.isTextBased()) {
      return interaction.reply({ content: '❌ Bu komut sadece metin kanallarında kullanılabilir!', ephemeral: true });
    }

    try {
      const messages = await interaction.channel.bulkDelete(amount, true);
      
      await interaction.reply({ 
        content: `✅ **${messages.size}** mesaj silindi!`, 
        ephemeral: true 
      });
      
      Logger.success('Mesajlar silindi', { 
        amount: messages.size, 
        channelId: interaction.channelId,
        adminId: interaction.user.id 
      });
      
    } catch (error) {
      Logger.error('Mesaj silme hatası', error);
      await interaction.reply({ 
        content: '❌ Mesajlar silinirken hata oluştu! (14 günden eski mesajlar silinemez)', 
        ephemeral: true 
      });
    }
  },
};