import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { inventoryService } from '../services/inventoryService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trashtalk')
    .setDescription('Birine trashtalk at (Trashtalk eşyası gerektirir)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Trashtalk atılacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Trashtalk mesajı')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('target', true);
    const message = interaction.options.getString('mesaj', true);

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Kendine trashtalk atamazsın!',
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return interaction.reply({
        content: '❌ Botlara trashtalk atamazsın!',
        ephemeral: true
      });
    }

    // Trashtalk eşyası kontrolü
    const hasTrashtalk = await inventoryService.hasItem(interaction.user.id, 'trashtalk');
    if (!hasTrashtalk) {
      return interaction.reply({
        content: '❌ Trashtalk eşyanız yok! Marketten satın alabilirsiniz: `/market buy item:trashtalk`',
        ephemeral: true
      });
    }

    // Trashtalk eşyasını kullan
    const usedItem = await inventoryService.useItem(interaction.user.id, 'trashtalk', { 
      target: targetUser.id, 
      message 
    });
    
    if (!usedItem) {
      return interaction.reply({
        content: '❌ Trashtalk eşyası kullanılırken bir hata oluştu!',
        ephemeral: true
      });
    }

    // Trashtalk mesajını gönder
    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle('💬 TRASHTALK!')
      .setDescription(`**${interaction.user.username}** → **${targetUser.username}**`)
      .addFields({
        name: '🔥 Mesaj',
        value: message,
        inline: false
      })
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: `${interaction.user.username} tarafından gönderildi` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
