import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { groupService } from '../services/groupService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grup')
    .setDescription('Grup yönetimi')
    .addSubcommand(sub =>
      sub.setName('olustur')
        .setDescription('Yeni grup oluştur')
        .addStringOption(opt => opt.setName('isim').setDescription('Grup ismi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('davet')
        .setDescription('Gruba oyuncu davet et')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Davet edilecek kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('cik')
        .setDescription('Gruptan ayrıl')
    )
    .addSubcommand(sub =>
      sub.setName('bilgi')
        .setDescription('Grup bilgilerini göster')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'olustur') {
      const name = interaction.options.getString('isim', true);
      
      try {
        const group = await groupService.createGroup(interaction.user.id, name);
        await interaction.reply({
          content: `✅ **${name}** grubu oluşturuldu!\n\`/grup davet\` komutu ile üye ekleyebilirsiniz.`,
          ephemeral: true
        });
      } catch (error: any) {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    }

    else if (subcommand === 'davet') {
      const user = interaction.options.getUser('kullanici', true);
      const group = await groupService.getUserGroup(interaction.user.id);

      if (!group) {
        return interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
      }

      if (user.id === interaction.user.id) {
        return interaction.reply({ content: '❌ Kendinizi davet edemezsiniz!', ephemeral: true });
      }

      if (await groupService.isInGroup(user.id)) {
        return interaction.reply({ content: '❌ Bu kullanıcı zaten bir grupta!', ephemeral: true });
      }

      if (group.members.length >= 5) {
        return interaction.reply({ content: '❌ Grup dolu! (Max 5 kişi)', ephemeral: true });
      }

      try {
        const { inviteService } = await import('../services/inviteService');
        const { botStatusService } = await import('../services/botStatusService');
        
        if (botStatusService.isDevMode()) {
          // Test modu - DM gönderme simülasyonu
          await botStatusService.sendToDevChannel(
            interaction.client, 
            interaction.guildId!, 
            `Grup daveti DM gönderildi: ${user.username} kullanıcısına **${group.name}** grubu için`
          );
          await interaction.reply({
            content: `🧪 ${botStatusService.getTestMessage('Grup daveti DM gönderme')} Kullanıcı: ${user.username}`,
            ephemeral: true
          });
          return;
        }
        
        const inviteId = await inviteService.createInvite(group.id, user.id, interaction.user.id);
        
        // DM gönder
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder: DiscordEmbedBuilder } = await import('discord.js');
        
        const embed = new DiscordEmbedBuilder()
          .setColor(0x3498db)
          .setTitle('👥 Grup Daveti')
          .setDescription(`<@${interaction.user.id}> sizi **${group.name}** grubuna davet etti!`)
          .addFields(
            { name: 'Grup Üyeleri', value: group.members.map(m => `<@${m}>`).join(', ') },
            { name: 'Üye Sayısı', value: `${group.members.length}/5` }
          )
          .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`group_accept_${inviteId}`)
            .setLabel('Kabul Et')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`group_decline_${inviteId}`)
            .setLabel('Reddet')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        await user.send({ embeds: [embed], components: [buttons] });
        
        await interaction.reply({
          content: `✅ ${user.username} kullanıcısına davet gönderildi!`,
          ephemeral: true
        });
        
        Logger.success('Grup daveti gönderildi', { groupId: group.id, invitedUser: user.id });
      } catch (error: any) {
        Logger.error('Davet gönderilemedi', error);
        await interaction.reply({ content: '❌ Kullanıcıya DM gönderilemedi! DM\'leri kapalı olabilir.', ephemeral: true });
      }
    }

    else if (subcommand === 'cik') {
      const left = await groupService.leaveGroup(interaction.user.id);
      if (left) {
        await interaction.reply({ content: '✅ Gruptan ayrıldınız!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
      }
    }

    else if (subcommand === 'bilgi') {
      const group = await groupService.getUserGroup(interaction.user.id);
      if (!group) {
        return interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`👥 ${group.name}`)
        .setDescription(`**Grup ID:** \`${group.id}\``)
        .addFields(
          { name: 'Üyeler', value: group.members.map((m, i) => `${i + 1}. <@${m}>`).join('\n') },
          { name: 'Üye Sayısı', value: `${group.members.length}/5`, inline: true }
        )
        .setTimestamp(group.createdAt instanceof Date ? group.createdAt : new Date(group.createdAt));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
