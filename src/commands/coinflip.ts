import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';

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
    const amount = interaction.options.getInteger('miktar', true);
    const guess = interaction.options.getString('tahmin');
    const opponent = interaction.options.getUser('rakip');

    const player = await databaseService.getPlayer(interaction.user.id);
    if (!player) {
      return interaction.reply({
        content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
        ephemeral: true
      });
    }

    if (player.balance < amount) {
      return interaction.reply({
        content: `❌ Yetersiz bakiye! Mevcut: ${player.balance} 🪙`,
        ephemeral: true
      });
    }

    // PvP Mode
    if (opponent) {
      if (opponent.id === interaction.user.id) {
        return interaction.reply({
          content: '❌ Kendinizle oynayamazsınız!',
          ephemeral: true
        });
      }

      if (opponent.bot) {
        return interaction.reply({
          content: '❌ Botlarla oynayamazsınız!',
          ephemeral: true
        });
      }

      const opponentPlayer = await databaseService.getPlayer(opponent.id);
      if (!opponentPlayer) {
        return interaction.reply({
          content: `❌ ${opponent.username} henüz kayıt olmamış!`,
          ephemeral: true
        });
      }

      if (opponentPlayer.balance < amount) {
        return interaction.reply({
          content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz!`,
          ephemeral: true
        });
      }

      // PvP Coinflip
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
      
      const winner = Math.random() < 0.5 ? interaction.user : opponent;
      const loser = winner.id === interaction.user.id ? opponent : interaction.user;

      const winnerPlayer = winner.id === interaction.user.id ? player : opponentPlayer;
      const loserPlayer = winner.id === interaction.user.id ? opponentPlayer : player;

      winnerPlayer.balance += amount;
      loserPlayer.balance -= amount;

      await databaseService.updatePlayer(winnerPlayer);
      await databaseService.updatePlayer(loserPlayer);

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

      return interaction.reply({ embeds: [embed] });
    }

    // Solo Mode - Ev avantajı %52 (oyuncu %48 kazanma şansı)
    let playerGuess: string;
    
    if (!guess) {
      // Tahmin yoksa butonlarla sor
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

      return interaction.reply({
        content: `🪙 **${amount} 🪙** bahis ile Coinflip!\n\nTahmininizi seçin:`,
        components: [buttons],
        ephemeral: true
      });
    }

    playerGuess = guess;

    // Ev avantajı: %52 bot kazanır
    const houseWins = Math.random() < 0.52;
    let result: string;
    
    if (houseWins) {
      // Bot kazanır - oyuncunun tahmininin tersi
      result = playerGuess === 'heads' ? 'tails' : 'heads';
    } else {
      // Oyuncu kazanır
      result = playerGuess;
    }

    const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
    const won = result === playerGuess;

    if (won) {
      player.balance += amount;
      await databaseService.updatePlayer(player);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Coinflip - Kazandın!')
        .setDescription(`**Sonuç:** ${resultText}`)
        .addFields(
          { name: '💰 Kazanç', value: `+${amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      player.balance -= amount;
      await databaseService.updatePlayer(player);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💸 Coinflip - Kaybettin!')
        .setDescription(`**Sonuç:** ${resultText}`)
        .addFields(
          { name: '💸 Kayıp', value: `-${amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
