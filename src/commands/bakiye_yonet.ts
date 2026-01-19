import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bakiye_yonet')
    .setDescription('Kullanıcı bakiyesini yönet (Admin)')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Bakiyesi değiştirilecek kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('islem')
        .setDescription('Yapılacak işlem')
        .setRequired(true)
        .addChoices(
          { name: '➕ Bakiye Ekle', value: 'add' },
          { name: '➖ Bakiye Çıkar', value: 'remove' },
          { name: '🔄 Bakiye Ayarla', value: 'set' }
        )
    )
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Coin miktarı')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // Admin kontrolü
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!',
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('kullanici', true);
    const operation = interaction.options.getString('islem', true);
    const amount = interaction.options.getInteger('miktar', true);

    // Hedef kullanıcının kayıtlı olup olmadığını kontrol et
    let player = await databaseService.getPlayer(targetUser.id);
    if (!player) {
      return interaction.reply({
        content: `❌ ${targetUser.username} henüz kayıt olmamış!`,
        ephemeral: true
      });
    }

    const oldBalance = player.balance;
    let newBalance = oldBalance;

    switch (operation) {
      case 'add':
        newBalance = oldBalance + amount;
        break;
      case 'remove':
        newBalance = Math.max(0, oldBalance - amount); // Negatif bakiye olmasın
        break;
      case 'set':
        newBalance = amount;
        break;
    }

    // Bakiyeyi güncelle
    player.balance = newBalance;
    await databaseService.updatePlayer(player);

    // İşlem türüne göre emoji ve metin
    const operationText = {
      'add': '➕ Eklendi',
      'remove': '➖ Çıkarıldı', 
      'set': '🔄 Ayarlandı'
    };

    const operationColor = {
      'add': 0x00ff00,
      'remove': 0xff6b6b,
      'set': 0x3498db
    };

    const embed = new EmbedBuilder()
      .setColor(operationColor[operation as keyof typeof operationColor])
      .setTitle('💰 Bakiye Yönetimi')
      .setDescription(`**${targetUser.username}** kullanıcısının bakiyesi güncellendi!`)
      .addFields(
        { name: '👤 Kullanıcı', value: `<@${targetUser.id}>`, inline: true },
        { name: '⚙️ İşlem', value: operationText[operation as keyof typeof operationText], inline: true },
        { name: '💎 Miktar', value: `${amount} 🪙`, inline: true },
        { name: '📊 Eski Bakiye', value: `${oldBalance} 🪙`, inline: true },
        { name: '📈 Yeni Bakiye', value: `${newBalance} 🪙`, inline: true },
        { name: '📝 Değişim', value: `${newBalance - oldBalance > 0 ? '+' : ''}${newBalance - oldBalance} 🪙`, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: `İşlemi yapan: ${interaction.user.username}` })
      .setTimestamp();

    Logger.info('Bakiye yönetimi', {
      admin: interaction.user.id,
      target: targetUser.id,
      operation,
      amount,
      oldBalance,
      newBalance
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};