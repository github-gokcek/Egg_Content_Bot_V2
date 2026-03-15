import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { inventoryService, MARKET_ITEMS } from '../services/inventoryService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Market sistemi')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Market ürünlerini listele')
    )
    .addSubcommand(sub =>
      sub.setName('buy')
        .setDescription('Eşya satın al')
        .addStringOption(opt => opt.setName('item').setDescription('Satın alınacak eşya').setRequired(true)
          .addChoices(
            { name: '👑 Custom Title - 5000 coin', value: 'custom_title' },
            { name: '⬇️ Derank - 1000 coin', value: 'derank' },
            { name: '⬆️ Uprank - 3000 coin', value: 'uprank' },
            { name: '📌 Pin - 500 coin', value: 'pin' },
            { name: '💬 Trashtalk - 100 coin', value: 'trashtalk' }
          ))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const player = await databaseService.getPlayer(interaction.user.id);
      const balance = player?.balance ?? 100;
      
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🛒 Market - Eşya Mağazası')
        .setDescription(`💳 **Bakiyeniz:** ${balance} 🪙\n\n🛍️ **Mevcut Ürünler:**`)
        .addFields(
          MARKET_ITEMS.map(item => ({
            name: `${item.emoji} ${item.name}`,
            value: `📝 ${item.description}\n💰 **Fiyat:** ${item.price} 🪙\n📊 **Durum:** ${balance >= item.price ? '✅ Satın Alabilirsiniz' : '❌ Yetersiz Bakiye'}`,
            inline: true
          }))
        )
        .setFooter({ text: '💡 Eşya satın almak için: /market buy item:[EşyaAdı]' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'buy') {
      const itemId = interaction.options.getString('item', true);
      const player = await databaseService.getPlayer(interaction.user.id);

      if (!player) {
        return interaction.reply({
          content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
          ephemeral: true
        });
      }

      const item = MARKET_ITEMS.find(i => i.id === itemId);
      if (!item) {
        return interaction.reply({
          content: '❌ Bu eşya markette satılmıyor!',
          ephemeral: true
        });
      }

      if (player.balance < item.price) {
        return interaction.reply({
          content: `❌ Bakiyeniz yetersiz! Gerekli: ${item.price} 🪙, Mevcut: ${player.balance} 🪙`,
          ephemeral: true
        });
      }

      // Bakiyeyi düş ve eşyayı envantere ekle
      player.balance -= item.price;
      await databaseService.updatePlayer(player);
      await inventoryService.addItem(interaction.user.id, itemId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Satın Alma Başarılı!')
        .setDescription(`${item.emoji} **${item.name}** başarıyla satın alındı!\n\n📦 Envanterinize eklendi!`)
        .addFields(
          { name: '💰 Ödenen Tutar', value: `${item.price} 🪙`, inline: true },
          { name: '💳 Kalan Bakiye', value: `${player.balance} 🪙`, inline: true },
          { name: '📦 Aldığınız Eşya', value: `${item.emoji} ${item.name}`, inline: true }
        )
        .setFooter({ text: 'Envanterinizi görmek için: /envanter' })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};