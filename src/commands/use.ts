import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { inventoryService } from '../services/inventoryService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Envanterdeki bir eşyayı kullan')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Kullanılacak eşya')
        .setRequired(true)
        .addChoices(
          { name: '👑 Custom Title', value: 'custom_title' },
          { name: '⬇️ Derank', value: 'derank' },
          { name: '⬆️ Uprank', value: 'uprank' }
        ))
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Eşya ile ilgili mesaj (gerekirse)')
        .setRequired(true)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const itemType = interaction.options.getString('item', true);
    const message = interaction.options.getString('mesaj', true);

    // Eşya kontrolü
    const hasItem = await inventoryService.hasItem(interaction.user.id, itemType);
    if (!hasItem) {
      return interaction.reply({
        content: '❌ Bu eşya envanterinizde yok!',
        ephemeral: true
      });
    }

    // Eşyayı kullan
    const usedItem = await inventoryService.useItem(interaction.user.id, itemType, { message });
    if (!usedItem) {
      return interaction.reply({
        content: '❌ Eşya kullanılırken bir hata oluştu!',
        ephemeral: true
      });
    }

    const emoji = this.getItemEmoji(itemType);
    
    // Public announcement
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`${emoji} Eşya Kullanıldı!`)
      .setDescription(`<@${interaction.user.id}> **${usedItem.name}** eşyasını kullandı!`)
      .addFields({
        name: '💬 Mesaj',
        value: message,
        inline: false
      })
      .setFooter({ text: 'Adminler gerekli işlemi yapacaktır.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  getItemEmoji(type: string): string {
    const emojis: Record<string, string> = {
      'custom_title': '👑',
      'derank': '⬇️',
      'uprank': '⬆️',
      'pin': '📌',
      'trashtalk': '💬'
    };
    return emojis[type] || '📦';
  }
};
