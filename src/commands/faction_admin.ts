import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { factionService } from '../services/factionService';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faction_admin')
    .setDescription('Faction yönetimi (Admin)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('award_fp')
        .setDescription('Bir kullanıcıya FP ver')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Kullanıcı')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('FP miktarı')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Sebep')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset_weekly')
        .setDescription('Haftalık FP sıfırla (tüm kullanıcılar)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset_daily_voice')
        .setDescription('Günlük voice FP sıfırla')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'award_fp') {
      const user = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const reason = interaction.options.getString('reason') || 'Admin tarafından verildi';

      const success = await factionService.awardFP(user.id, amount, 'event', { reason, adminId: interaction.user.id });

      if (success) {
        await interaction.reply({ 
          content: `✅ ${user.username} kullanıcısına **${amount} FP** verildi!\nSebep: ${reason}`, 
          ephemeral: false 
        });
        Logger.success('Admin FP verdi', { userId: user.id, amount, adminId: interaction.user.id });
      } else {
        await interaction.reply({ 
          content: `❌ ${user.username} bir faction'a üye değil!`, 
          ephemeral: true 
        });
      }
    }

    else if (subcommand === 'reset_weekly') {
      await interaction.deferReply({ ephemeral: true });
      
      await factionService.resetWeeklyFP();
      
      await interaction.followUp({ 
        content: '✅ Tüm kullanıcıların haftalık FP\'si sıfırlandı!', 
        ephemeral: true 
      });
      Logger.success('Haftalık FP sıfırlandı', { adminId: interaction.user.id });
    }

    else if (subcommand === 'reset_daily_voice') {
      const { voiceActivityService } = await import('../services/voiceActivityService');
      voiceActivityService.resetDailyFP();
      
      await interaction.reply({ 
        content: '✅ Günlük voice FP sıfırlandı!', 
        ephemeral: true 
      });
      Logger.success('Günlük voice FP sıfırlandı', { adminId: interaction.user.id });
    }
  },
};
