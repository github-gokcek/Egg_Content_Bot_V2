import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { marketService } from '../services/marketService';
import { databaseService } from '../services/databaseService';

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
        .setDescription('Rol satın al')
        .addRoleOption(opt => opt.setName('rol').setDescription('Satın alınacak rol').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('admin')
        .setDescription('Admin komutları')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Yapılacak işlem')
            .setRequired(true)
            .addChoices(
              { name: 'Ürün Ekle', value: 'add' },
              { name: 'Ürün Sil', value: 'remove' },
              { name: 'Fiyat Güncelle', value: 'update_price' }
            )
        )
        .addRoleOption(opt => opt.setName('rol').setDescription('İşlem yapılacak rol').setRequired(true))
        .addIntegerOption(opt => opt.setName('fiyat').setDescription('Fiyat (sadece ekle/güncelle için)').setRequired(false))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const player = await databaseService.getPlayer(interaction.user.id);
      const balance = player?.balance ?? 100; // Bakiye yoksa 100 olarak varsay
      
      const items = await marketService.getItems(interaction.guildId!);
      
      if (items.length === 0) {
        return interaction.reply({
          content: '🛒 Market şu anda boş! Adminler `/market admin add` ile ürün ekleyebilir.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🛒 Market - Rol Mağazası')
        .setDescription(`💳 **Bakiyeniz:** ${balance} 🪙\n\n🛍️ **Mevcut Ürünler:**`)
        .addFields(
          items.map(item => {
            // Rol rengini al (hex formatında)
            const role = interaction.guild?.roles.cache.get(item.roleId);
            const roleColor = role?.color || 0x99aab5; // Varsayılan Discord gri rengi
            
            return {
              name: `🎭 ${item.roleName}`,
              value: `💰 **Fiyat:** ${item.price} 🪙\n🎨 **Renk:** <@&${item.roleId}>\n📊 **Durum:** ${balance >= item.price ? '✅ Satın Alabilirsiniz' : '❌ Yetersiz Bakiye'}`,
              inline: true
            };
          })
        )
        .setFooter({ text: '💡 Rol satın almak için: /market buy rol:@RolAdı' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'buy') {
      const role = interaction.options.getRole('rol', true);
      const player = await databaseService.getPlayer(interaction.user.id);

      if (!player) {
        return interaction.reply({
          content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
          ephemeral: true
        });
      }

      const item = await marketService.getItem(interaction.guildId!, role.id);
      if (!item) {
        return interaction.reply({
          content: '❌ Bu rol markette satılmıyor!',
          ephemeral: true
        });
      }

      if (player.balance < item.price) {
        return interaction.reply({
          content: `❌ Bakiyeniz yetersiz! Gerekli: ${item.price} 🪙, Mevcut: ${player.balance} 🪙`,
          ephemeral: true
        });
      }

      // Kullanıcının zaten bu rolü var mı?
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: '❌ Bu role zaten sahipsiniz!',
          ephemeral: true
        });
      }

      // Bakiyeyi düş ve rolü ver
      player.balance -= item.price;
      await databaseService.updatePlayer(player);
      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setColor(role.color || 0x00ff00)
        .setTitle('🎉 Satın Alma Başarılı!')
        .setDescription(`🎭 **${role.name}** rolü başarıyla satın alındı!\n\n🎨 Yeni rolünüz aktif edildi!`)
        .addFields(
          { name: '💰 Ödenen Tutar', value: `${item.price} 🪙`, inline: true },
          { name: '💳 Kalan Bakiye', value: `${player.balance} 🪙`, inline: true },
          { name: '🎭 Aldığınız Rol', value: `<@&${role.id}>`, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    else if (subcommand === 'admin') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
          ephemeral: true
        });
      }

      const action = interaction.options.getString('action', true);
      const role = interaction.options.getRole('rol', true);
      const price = interaction.options.getInteger('fiyat');

      if (action === 'add') {
        if (!price || price <= 0) {
          return interaction.reply({
            content: '❌ Geçerli bir fiyat belirtmelisiniz!',
            ephemeral: true
          });
        }

        await marketService.addItem(interaction.guildId!, role.id, role.name, price, interaction.user.id);
        await interaction.reply({
          content: `✅ **${role.name}** rolü ${price} 🪙 fiyatıyla markete eklendi!`,
          ephemeral: true
        });
      }

      else if (action === 'remove') {
        const removed = await marketService.removeItem(interaction.guildId!, role.id);
        if (removed) {
          await interaction.reply({
            content: `✅ **${role.name}** rolü marketten kaldırıldı!`,
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: `❌ **${role.name}** rolü markette bulunamadı!`,
            ephemeral: true
          });
        }
      }

      else if (action === 'update_price') {
        if (!price || price <= 0) {
          return interaction.reply({
            content: '❌ Geçerli bir fiyat belirtmelisiniz!',
            ephemeral: true
          });
        }

        const updated = await marketService.updatePrice(interaction.guildId!, role.id, price);
        if (updated) {
          await interaction.reply({
            content: `✅ **${role.name}** rolünün fiyatı ${price} 🪙 olarak güncellendi!`,
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: `❌ **${role.name}** rolü markette bulunamadı!`,
            ephemeral: true
          });
        }
      }
    }
  },
};