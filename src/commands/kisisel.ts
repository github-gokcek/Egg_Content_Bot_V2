import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { inventoryService } from '../services/inventoryService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kisisel')
    .setDescription('Özel ses odası aç')
    .addStringOption(option =>
      option
        .setName('odaismi')
        .setDescription('Oda ismi')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('kullanici1')
        .setDescription('1. kullanıcı')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('kullanici2')
        .setDescription('2. kullanıcı')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('kullanici3')
        .setDescription('3. kullanıcı')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('kullanici4')
        .setDescription('4. kullanıcı')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Bu komut sadece sunucularda kullanılabilir!',
        ephemeral: true
      });
    }

    // Envanterde özel oda var mı kontrol et
    const hasPrivateRoom = await inventoryService.hasItem(interaction.user.id, 'private_room');
    if (!hasPrivateRoom) {
      return interaction.reply({
        content: '❌ Özel oda açmak için marketten "Özel Oda" satın almalısınız! (`/market buy item:private_room`)',
        ephemeral: true
      });
    }

    const roomName = interaction.options.getString('odaismi', true);
    const user1 = interaction.options.getUser('kullanici1', true);
    const user2 = interaction.options.getUser('kullanici2', true);
    const user3 = interaction.options.getUser('kullanici3', true);
    const user4 = interaction.options.getUser('kullanici4', true);

    // Aynı kullanıcı kontrolü
    const users = [user1.id, user2.id, user3.id, user4.id];
    const uniqueUsers = new Set(users);
    if (uniqueUsers.size !== 4) {
      return interaction.reply({
        content: '❌ Aynı kullanıcıyı birden fazla kez ekleyemezsiniz!',
        ephemeral: true
      });
    }

    // Kendini ekleme kontrolü
    if (users.includes(interaction.user.id)) {
      return interaction.reply({
        content: '❌ Kendinizi listeye eklemenize gerek yok, otomatik olarak ekleneceksiniz!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      // Özel oda kategorisi var mı kontrol et, yoksa oluştur
      let category = interaction.guild.channels.cache.find(
        c => c.name === '🔒 Özel Odalar' && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        category = await interaction.guild.channels.create({
          name: '🔒 Özel Odalar',
          type: ChannelType.GuildCategory,
        });
      }

      // İzin listesi: Sadece oda sahibi ve seçilen 4 kişi
      const allowedUsers = [interaction.user.id, ...users];

      // Ses kanalı oluştur
      const voiceChannel = await interaction.guild.channels.create({
        name: `🔒 ${roomName}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        userLimit: 5,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel]
          },
          ...allowedUsers.map(userId => ({
            id: userId,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak]
          }))
        ]
      });

      // Item'i kullan
      await inventoryService.useItem(interaction.user.id, 'private_room', {
        channelId: voiceChannel.id,
        channelName: roomName,
        allowedUsers: allowedUsers,
        createdAt: new Date().toISOString()
      });

      Logger.success('Private room created', {
        userId: interaction.user.id,
        channelId: voiceChannel.id,
        roomName
      });

      await interaction.editReply({
        content: 
          `✅ **Özel odanız oluşturuldu!**\n\n` +
          `🔒 **Oda:** ${voiceChannel}\n` +
          `👥 **İzinli Kullanıcılar:**\n` +
          `• <@${interaction.user.id}> (Oda Sahibi)\n` +
          `• <@${user1.id}>\n` +
          `• <@${user2.id}>\n` +
          `• <@${user3.id}>\n` +
          `• <@${user4.id}>\n\n` +
          `*Sadece bu 5 kişi odaya girebilir.*`
      });

    } catch (error) {
      Logger.error('Private room creation error', error);
      await interaction.editReply({
        content: '❌ Özel oda oluşturulurken bir hata oluştu! Botun gerekli izinlere sahip olduğundan emin olun.'
      });
    }
  },
};
