import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { questService } from '../services/questService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Yazı tura oyna ve coin kazan!')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10))
    .addStringOption(option =>
      option.setName('tahmin')
        .setDescription('Tahminin (opsiyonel)')
        .addChoices(
          { name: '🪙 Yazı', value: 'heads' },
          { name: '🪙 Tura', value: 'tails' }
        ))
    .addUserOption(option =>
      option.setName('rakip')
        .setDescription('PvP için rakip (opsiyonel)')),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const amount = interaction.options.getInteger('miktar', true);
    const guess = interaction.options.getString('tahmin');
    const opponent = interaction.options.getUser('rakip');

    const player = await databaseService.getPlayer(interaction.user.id);
    if (!player) {
      return interaction.editReply({
        content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!'
      });
    }

    if (player.balance < amount) {
      return interaction.editReply({
        content: `❌ Yetersiz bakiye! Mevcut: ${player.balance} 🪙`
      });
    }

    // Bahsi çıkar
    player.balance -= amount;
    await databaseService.updatePlayer(player);

    // Quest tracking - Non-blocking
    questService.trackCoinflipPlay(interaction.user.id).catch(() => {});
    questService.trackCasinoSpent(interaction.user.id, amount).catch(() => {});

    // PvP Mode
    if (opponent) {
      if (opponent.id === interaction.user.id) {
        return interaction.editReply({
          content: '❌ Kendinizle oynayamazsınız!'
        });
      }

      if (opponent.bot) {
        return interaction.editReply({
          content: '❌ Botlarla oynayamazsınız!'
        });
      }

      const opponentPlayer = await databaseService.getPlayer(opponent.id);
      if (!opponentPlayer) {
        player.balance += amount;
        await databaseService.updatePlayer(player);
        return interaction.editReply({
          content: `❌ ${opponent.username} henüz kayıt olmamış!`
        });
      }

      if (opponentPlayer.balance < amount) {
        player.balance += amount;
        await databaseService.updatePlayer(player);
        return interaction.editReply({
          content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz!`
        });
      }

      opponentPlayer.balance -= amount;
      await databaseService.updatePlayer(opponentPlayer);

      // Quest tracking for opponent - Non-blocking
      questService.trackCoinflipPlay(opponent.id).catch(() => {});
      questService.trackCasinoSpent(opponent.id, amount).catch(() => {});

      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
      
      const winner = Math.random() < 0.5 ? interaction.user : opponent;
      const loser = winner.id === interaction.user.id ? opponent : interaction.user;

      const winnerPlayer = winner.id === interaction.user.id ? player : opponentPlayer;
      const loserPlayer = winner.id === interaction.user.id ? opponentPlayer : player;

      winnerPlayer.balance += amount * 2;

      await databaseService.updatePlayer(winnerPlayer);
      await databaseService.updatePlayer(loserPlayer);

      // Quest tracking - Non-blocking
      questService.trackCasinoWin(winner.id, amount, true).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🪙 PvP Coinflip')
        .setDescription(`**Sonuç:** ${resultText}`)
        .addFields(
          { name: '🏆 Kazanan', value: `<@${winner.id}>`, inline: true },
          { name: '💸 Kaybeden', value: `<@${loser.id}>`, inline: true },
          { name: '💰 Miktar', value: `${amount} 🪙`, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Solo Mode
    if (!guess) {
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`coinflip_heads_${amount}`)
          .setLabel('🪙 Yazı')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`coinflip_tails_${amount}`)
          .setLabel('🪙 Tura')
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.editReply({
        content: `🪙 **${amount} 🪙** bahis ile Coinflip!\n\nTahmininizi seçin:`,
        components: [buttons]
      });
    }

    const playerGuess = guess;
    const houseWins = Math.random() < 0.60;
    let result: string;
    
    if (houseWins) {
      result = playerGuess === 'heads' ? 'tails' : 'heads';
    } else {
      result = playerGuess;
    }

    const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
    const won = result === playerGuess;

    if (won) {
      player.balance += amount * 2;
      await databaseService.updatePlayer(player);

      // Quest tracking - Non-blocking
      questService.trackCasinoWin(interaction.user.id, amount, true).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Coinflip - Kazandın!')
        .setDescription(`**Sonuç:** ${resultText}`)
        .addFields(
          { name: '💰 Kazanç', value: `+${amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💸 Coinflip - Kaybettin!')
        .setDescription(`**Sonuç:** ${resultText}`)
        .addFields(
          { name: '💸 Kayıp', value: `-${amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
