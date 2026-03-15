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

    // Bahsi çıkar
    player.balance -= amount;
    await databaseService.updatePlayer(player);

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
        // Bahsi geri ver
        player.balance += amount;
        await databaseService.updatePlayer(player);
        return interaction.reply({
          content: `❌ ${opponent.username} henüz kayıt olmamış!`,
          ephemeral: true
        });
      }

      if (opponentPlayer.balance < amount) {
        // Bahsi geri ver
        player.balance += amount;
        await databaseService.updatePlayer(player);
        return interaction.reply({
          content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz!`,
          ephemeral: true
        });
      }

      // Rakibin bahsini çıkar
      opponentPlayer.balance -= amount;
      await databaseService.updatePlayer(opponentPlayer);

      // PvP Coinflip
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
      
      const winner = Math.random() < 0.5 ? interaction.user : opponent;
      const loser = winner.id === interaction.user.id ? opponent : interaction.user;

      const winnerPlayer = winner.id === interaction.user.id ? player : opponentPlayer;
      const loserPlayer = winner.id === interaction.user.id ? opponentPlayer : player;

      // Kazanana 2x bahis ver (kendi bahsi + rakibin bahsi)
      winnerPlayer.balance += amount * 2;

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

    // Solo Mode - Ev avantajı %60 (Önceki: %52)
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

    // Ev avantajı: %60 bot kazanır (Önceki: %52)
    const houseWins = Math.random() < 0.60;
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
      // Kazanç ver: 2x bahis (kendi bahsi + kazanç)
      player.balance += amount * 2;
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
      // Kaybetti (bahis zaten çıkarıldı)
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
