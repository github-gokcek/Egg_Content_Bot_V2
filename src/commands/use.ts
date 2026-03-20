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
          { name: '🎭 Sticker Ekleme', value: 'sticker_add' }
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
    
    // Sticker ekleme için özel mesaj
    if (itemType === 'sticker_add') {
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🎭 Sticker Ekleme İsteği')
        .setDescription(
          `<@${interaction.user.id}> **sticker ekleme** isteği oluşturdu!\n\n` +
          `💬 **Mesaj:** ${message}\n\n` +
          `*En kısa sürede bir admin sizinle ilgilenecektir.*`
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Adminler sticker’ı manuel olarak ekleyecektir.' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
    
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
      'sticker_add': '🎭',
      'pin': '📌',
      'trashtalk': '💬'
    };
    return emojis[type] || '📦';
  }
};
