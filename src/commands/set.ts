import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { configService } from '../services/configService';
import { setAdChannel, setAdTimer } from '../services/botSettings';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Kanal ayarlarını yapılandır')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('game_channel')
        .setDescription('Oyun kanalını ayarla')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Kanal seç')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('oyun')
            .setDescription('Oyun türü')
            .setRequired(true)
            .addChoices(
              { name: 'LoL', value: 'lol' },
              { name: 'TFT', value: 'tft' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('winnerlog_channel')
        .setDescription('Sonuç kanalını ayarla')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Kanal seç')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('oyun')
            .setDescription('Oyun türü')
            .setRequired(true)
            .addChoices(
              { name: 'LoL', value: 'lol' },
              { name: 'TFT', value: 'tft' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Mevcut kanal ayarlarını göster')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('dev_channel')
        .setDescription('Test kanalını ayarla')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Test kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard_channel')
        .setDescription('Liderlik tablosu kanalını ayarla')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Liderlik kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reklam')
        .setDescription('Reklam kanalını ayarla')
        .addChannelOption(option =>
          option.setName('kanal')
            .setDescription('Reklam kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('timer')
        .setDescription('Reklam aralığını ayarla (dakika)')
        .addIntegerOption(option =>
          option.setName('dakika')
            .setDescription('Reklam aralığı (30-180 dakika)')
            .setMinValue(30)
            .setMaxValue(180)
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return interaction.reply({ content: '❌ Bu komut sadece sunucularda kullanılabilir!', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'info') {
      const config = await configService.getConfig(interaction.guildId);
      
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📊 Kanal Ayarları')
        .addFields(
          {
            name: '🎮 Oyun Kanalları',
            value: `**LoL:** ${config.gameChannels.lol ? `<#${config.gameChannels.lol}>` : '*Ayarlanmamış*'}\n**TFT:** ${config.gameChannels.tft ? `<#${config.gameChannels.tft}>` : '*Ayarlanmamış*'}`,
            inline: true
          },
          {
            name: '🏆 Sonuç Kanalları',
            value: `**LoL:** ${config.winnerLogChannels.lol ? `<#${config.winnerLogChannels.lol}>` : '*Ayarlanmamış*'}\n**TFT:** ${config.winnerLogChannels.tft ? `<#${config.winnerLogChannels.tft}>` : '*Ayarlanmamış*'}`,
            inline: true
          },
          {
            name: '🏆 Liderlik Kanalı',
            value: config.leaderboardChannel ? `<#${config.leaderboardChannel}>` : '*Ayarlanmamış*',
            inline: false
          }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (subcommand === 'leaderboard_channel') {
      const channel = interaction.options.getChannel('kanal', true);
      await configService.setLeaderboardChannel(interaction.guildId, channel.id);
      await interaction.reply({ 
        content: `✅ Liderlik tablosu kanalı <#${channel.id}> olarak ayarlandı!`,
        ephemeral: true 
      });
      return;
    }

    if (subcommand === 'reklam') {
      const channel = interaction.options.getChannel('kanal', true);
      await setAdChannel(channel.id);
      await interaction.reply({ 
        content: `✅ Reklam kanalı <#${channel.id}> olarak ayarlandı!`,
        ephemeral: true 
      });
      return;
    }

    if (subcommand === 'timer') {
      const minutes = interaction.options.getInteger('dakika', true);
      await setAdTimer(minutes);
      await interaction.reply({ 
        content: `✅ Reklam aralığı ${minutes} dakika olarak ayarlandı! Değişiklik bir sonraki reklamdan itibaren geçerli olacak.`,
        ephemeral: true 
      });
      return;
    }

    if (subcommand === 'dev_channel') {
      const channel = interaction.options.getChannel('kanal', true);
      await configService.setDevChannel(interaction.guildId, channel.id);
      await interaction.reply({ 
        content: `✅ Test kanalı <#${channel.id}> olarak ayarlandı!`,
        ephemeral: true 
      });
      return;
    }

    const channel = interaction.options.getChannel('kanal', true);
    const game = interaction.options.getString('oyun', true) as 'lol' | 'tft';

    if (subcommand === 'game_channel') {
      await configService.setGameChannel(interaction.guildId, game, channel.id);
      await interaction.reply({ 
        content: `✅ ${game.toUpperCase()} oyun kanalı <#${channel.id}> olarak ayarlandı!`,
        ephemeral: true 
      });
    } else if (subcommand === 'winnerlog_channel') {
      await configService.setWinnerLogChannel(interaction.guildId, game, channel.id);
      await interaction.reply({ 
        content: `✅ ${game.toUpperCase()} sonuç kanalı <#${channel.id}> olarak ayarlandı!`,
        ephemeral: true 
      });
    } else if (subcommand === 'info') {
      const config = await configService.getConfig(interaction.guildId);
      
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📊 Kanal Ayarları')
        .addFields(
          {
            name: '🎮 Oyun Kanalları',
            value: `**LoL:** ${config.gameChannels.lol ? `<#${config.gameChannels.lol}>` : '*Ayarlanmamış*'}\n**TFT:** ${config.gameChannels.tft ? `<#${config.gameChannels.tft}>` : '*Ayarlanmamış*'}`,
            inline: true
          },
          {
            name: '🏆 Sonuç Kanalları',
            value: `**LoL:** ${config.winnerLogChannels.lol ? `<#${config.winnerLogChannels.lol}>` : '*Ayarlanmamış*'}\n**TFT:** ${config.winnerLogChannels.tft ? `<#${config.winnerLogChannels.tft}>` : '*Ayarlanmamış*'}`,
            inline: true
          }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
