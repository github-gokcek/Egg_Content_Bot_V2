import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { questService } from '../services/questService';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface BlackjackGame {
  userId: string;
  bet: number;
  playerHand: string[];
  dealerHand: string[];
  playerValue: number;
  dealerValue: number;
  doubled: boolean;
}

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠️', '♥️', '♦️', '♣️'];

function drawCard(): string {
  const card = CARDS[Math.floor(Math.random() * CARDS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return `${card}${suit}`;
}

function calculateValue(hand: string[]): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    const rank = card.slice(0, -2);
    if (rank === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(rank)) {
      value += 10;
    } else {
      value += parseInt(rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

function formatHand(hand: string[], hideFirst: boolean = false): string {
  if (hideFirst) {
    return `🂠 ${hand.slice(1).join(' ')}`;
  }
  return hand.join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Blackjack oyna!')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const amount = interaction.options.getInteger('miktar', true);

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

    player.balance -= amount;
    await databaseService.updatePlayer(player);

    // Quest tracking - Non-blocking
    questService.trackBlackjackPlay(interaction.user.id).catch(() => {});
    questService.trackCasinoSpent(interaction.user.id, amount).catch(() => {});

    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    
    const playerValue = calculateValue(playerHand);
    const dealerValue = calculateValue(dealerHand);

    const game: BlackjackGame = {
      userId: interaction.user.id,
      bet: amount,
      playerHand,
      dealerHand,
      playerValue,
      dealerValue,
      doubled: false
    };

    await setDoc(doc(db, 'blackjackGames', interaction.user.id), game);

    if (playerValue === 21) {
      await deleteDoc(doc(db, 'blackjackGames', interaction.user.id));
      
      const winAmount = Math.floor(amount * 2.5);
      player.balance += winAmount;
      await databaseService.updatePlayer(player);

      // Quest tracking - Non-blocking
      questService.trackBlackjackPlay(interaction.user.id, true).catch(() => {});
      const netWin = winAmount - amount;
      questService.trackCasinoWin(interaction.user.id, netWin, true).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🎉 BLACKJACK!')
        .addFields(
          { name: '🎴 Senin Elin', value: `${formatHand(playerHand)}\n**Değer: ${playerValue}**`, inline: true },
          { name: '🎴 Krupiye', value: `${formatHand(dealerHand)}\n**Değer: ${dealerValue}**`, inline: true },
          { name: '💰 Kazanç', value: `+${winAmount - amount} 🪙 (1.5x)`, inline: false },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎴'),
      new ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋'),
      new ButtonBuilder()
        .setCustomId('blackjack_double')
        .setLabel('Double')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💰')
        .setDisabled(player.balance < amount * 2)
    );

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🎴 Blackjack')
      .addFields(
        { name: '🎴 Senin Elin', value: `${formatHand(playerHand)}\n**Değer: ${playerValue}**`, inline: true },
        { name: '🎴 Krupiye', value: `${formatHand(dealerHand, true)}\n**Değer: ?**`, inline: true },
        { name: '💰 Bahis', value: `${amount} 🪙`, inline: false }
      )
      .setFooter({ text: 'Hit: Kart çek | Stand: Dur | Double: Bahsi ikiye katla' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: [buttons] });
  },
};
