import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { db } from '../services/firebase';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';

// Blackjack handler
export async function handleBlackjackButtons(interaction: ButtonInteraction) {
  const gameDoc = await getDoc(doc(db, 'blackjackGames', interaction.user.id));
  
  if (!gameDoc.exists()) {
    return interaction.reply({
      content: '❌ Aktif bir Blackjack oyununuz yok!',
      ephemeral: true
    });
  }

  const game = gameDoc.data() as any;
  const player = await databaseService.getPlayer(interaction.user.id);
  
  if (!player) return;

  if (interaction.customId === 'blackjack_hit') {
    // Kart çek
    const newCard = drawCard();
    game.playerHand.push(newCard);
    game.playerValue = calculateValue(game.playerHand);

    if (game.playerValue > 21) {
      // Bust - bahis kaybedildi
      await deleteDoc(doc(db, 'blackjackGames', interaction.user.id));

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💥 BUST!')
        .addFields(
          { name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true },
          { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true },
          { name: '💸 Kayıp', value: `-${game.bet} 🪙`, inline: false },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false }
        )
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [] });
    }

    // Oyun devam ediyor
    await setDoc(doc(db, 'blackjackGames', interaction.user.id), game);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🎴 Blackjack')
      .addFields(
        { name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true },
        { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand, true)}\n**Değer: ?**`, inline: true },
        { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: false }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed] });
  }

  else if (interaction.customId === 'blackjack_stand') {
    // Krupiye oynar
    while (game.dealerValue < 17) {
      game.dealerHand.push(drawCard());
      game.dealerValue = calculateValue(game.dealerHand);
    }

    await deleteDoc(doc(db, 'blackjackGames', interaction.user.id));

    let result: string;
    let color: number;
    let winAmount = 0;

    if (game.dealerValue > 21 || game.playerValue > game.dealerValue) {
      result = '🎉 Kazandın!';
      color = 0x00ff00;
      // Ev avantajı: Kazanıldığında 1.8x ödeme (bahis + 0.8x kazanç)
      winAmount = Math.floor(game.bet * 1.8);
      player.balance += winAmount;
    } else if (game.playerValue === game.dealerValue) {
      result = '🤝 Berabere!';
      color = 0xffff00;
      // Berabere: Bahis iade
      winAmount = game.bet;
      player.balance += winAmount;
    } else {
      result = '💸 Kaybettin!';
      color = 0xff0000;
      // Kayıp: Bahis zaten çıkarılmış
    }

    await databaseService.updatePlayer(player);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(result)
      .addFields(
        { name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true },
        { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true },
        { name: '💰 Sonuç', value: winAmount > 0 ? `+${winAmount - game.bet} 🪙` : `-${game.bet} 🪙`, inline: false },
        { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }

  else if (interaction.customId === 'blackjack_double') {
    // Mevcut bakiyeyi yeniden kontrol et
    const currentPlayer = await databaseService.getPlayer(interaction.user.id);
    if (!currentPlayer || currentPlayer.balance < game.bet) {
      return interaction.reply({
        content: '❌ Double için yeterli bakiyeniz yok!',
        ephemeral: true
      });
    }

    // İkinci bahsi çıkar
    currentPlayer.balance -= game.bet;
    game.bet *= 2;

    // Tek kart çek
    const newCard = drawCard();
    game.playerHand.push(newCard);
    game.playerValue = calculateValue(game.playerHand);

    // Krupiye oynar
    while (game.dealerValue < 17) {
      game.dealerHand.push(drawCard());
      game.dealerValue = calculateValue(game.dealerHand);
    }

    await deleteDoc(doc(db, 'blackjackGames', interaction.user.id));

    let result: string;
    let color: number;
    let winAmount = 0;

    if (game.playerValue > 21) {
      result = '💥 BUST!';
      color = 0xff0000;
      // Kayıp: Bahis zaten çıkarılmış
    } else if (game.dealerValue > 21 || game.playerValue > game.dealerValue) {
      result = '🎉 Kazandın!';
      color = 0x00ff00;
      // Ev avantajı: Kazanıldığında 1.8x ödeme (bahis + 0.8x kazanç)
      winAmount = Math.floor(game.bet * 1.8);
      currentPlayer.balance += winAmount;
    } else if (game.playerValue === game.dealerValue) {
      result = '🤝 Berabere!';
      color = 0xffff00;
      // Berabere: Bahis iade
      winAmount = game.bet;
      currentPlayer.balance += winAmount;
    } else {
      result = '💸 Kaybettin!';
      color = 0xff0000;
      // Kayıp: Bahis zaten çıkarılmış
    }

    await databaseService.updatePlayer(currentPlayer);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${result} (Double)`)
      .addFields(
        { name: '🎴 Senin Elin', value: `${formatHand(game.playerHand)}\n**Değer: ${game.playerValue}**`, inline: true },
        { name: '🎴 Krupiye', value: `${formatHand(game.dealerHand)}\n**Değer: ${game.dealerValue}**`, inline: true },
        { name: '💰 Sonuç', value: winAmount > 0 ? `+${winAmount - game.bet} 🪙` : `-${game.bet} 🪙`, inline: false },
        { name: '💳 Yeni Bakiye', value: `${currentPlayer.balance} 🪙`, inline: false }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }
}

// Crash handler
export async function handleCrashCashout(interaction: ButtonInteraction) {
  const gameDoc = await getDoc(doc(db, 'crashGames', interaction.user.id));
  
  if (!gameDoc.exists()) {
    return interaction.reply({
      content: '❌ Aktif bir Crash oyununuz yok!',
      ephemeral: true
    });
  }

  const game = gameDoc.data() as any;
  const player = await databaseService.getPlayer(interaction.user.id);
  
  if (!player) return;

  // Crash oldu mu kontrol et
  if (game.crashed) {
    return interaction.reply({
      content: '❌ Oyun zaten crash oldu! Kaybettiniz.',
      ephemeral: true
    });
  }

  // Mevcut çarpanı hesapla (başlangıçtan itibaren geçen zaman)
  const elapsedMs = Date.now() - game.startTime;
  const elapsedSeconds = elapsedMs / 1000;
  const currentMultiplier = Math.min(1.0 + (elapsedSeconds * 0.01), game.crashPoint);

  // Crash point'e ulaştı mı?
  if (currentMultiplier >= game.crashPoint) {
    await setDoc(doc(db, 'crashGames', interaction.user.id), {
      ...game,
      crashed: true
    });

    return interaction.reply({
      content: '❌ Crash oldu! Kaybettiniz.',
      ephemeral: true
    });
  }

  // Cashout başarılı
  await deleteDoc(doc(db, 'crashGames', interaction.user.id));

  const winAmount = Math.floor(game.bet * currentMultiplier);
  player.balance += winAmount;
  await databaseService.updatePlayer(player);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('🎉 Cashout Başarılı!')
    .setDescription(`${currentMultiplier.toFixed(2)}x'de cashout yaptın!`)
    .addFields(
      { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true },
      { name: '📊 Çarpan', value: `${currentMultiplier.toFixed(2)}x`, inline: true },
      { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true },
      { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false }
    )
    .setFooter({ text: `Crash point: ${game.crashPoint.toFixed(2)}x` })
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: [] });
}

// Mines handler
export async function handleMinesButtons(interaction: ButtonInteraction) {
  if (interaction.customId === 'mines_cashout') {
    const gameDoc = await getDoc(doc(db, 'minesGames', interaction.user.id));
    
    if (!gameDoc.exists()) {
      return interaction.reply({
        content: '❌ Aktif bir Mines oyununuz yok!',
        ephemeral: true
      });
    }

    const game = gameDoc.data() as any;
    const player = await databaseService.getPlayer(interaction.user.id);
    
    if (!player) return;

    await deleteDoc(doc(db, 'minesGames', interaction.user.id));

    const winAmount = Math.floor(game.bet * game.multiplier);
    player.balance += winAmount;
    await databaseService.updatePlayer(player);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('💰 Cashout Başarılı!')
      .addFields(
        { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true },
        { name: '💎 Açılan Kareler', value: `${game.safeRevealed}`, inline: true },
        { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true },
        { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true },
        { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }

  // Mine tile click
  const index = parseInt(interaction.customId.split('_')[1]);
  const gameDoc = await getDoc(doc(db, 'minesGames', interaction.user.id));
  
  if (!gameDoc.exists()) {
    return interaction.reply({
      content: '❌ Aktif bir Mines oyununuz yok!',
      ephemeral: true
    });
  }

  const game = gameDoc.data() as any;
  const player = await databaseService.getPlayer(interaction.user.id);
  
  if (!player) return;

  game.revealed[index] = true;

  if (game.grid[index]) {
    // Mine hit! - Bahis kaybedildi
    await deleteDoc(doc(db, 'minesGames', interaction.user.id));

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('💣 BOOM!')
      .setDescription('Mayına bastın!')
      .addFields(
        { name: '💸 Kayıp', value: `-${game.bet} 🪙`, inline: true },
        { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }

  // Safe tile
  game.safeRevealed++;
  game.multiplier = calculateMultiplier(game.safeRevealed, game.totalMines);

  // Tüm güvenli kareler açıldı mı?
  const totalSafeTiles = 20 - game.totalMines;
  if (game.safeRevealed >= totalSafeTiles) {
    // Otomatik cashout
    await deleteDoc(doc(db, 'minesGames', interaction.user.id));

    const winAmount = Math.floor(game.bet * game.multiplier);
    player.balance += winAmount;
    await databaseService.updatePlayer(player);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Mükemmel Oyun!')
      .setDescription('Tüm güvenli kareleri açtın! Otomatik cashout yapıldı.')
      .addFields(
        { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true },
        { name: '💎 Açılan Kareler', value: `${game.safeRevealed}/${totalSafeTiles}`, inline: true },
        { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true },
        { name: '💵 Kazanç', value: `+${winAmount - game.bet} 🪙`, inline: true },
        { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
      )
      .setTimestamp();

    return interaction.update({ embeds: [embed], components: [] });
  }

  await setDoc(doc(db, 'minesGames', interaction.user.id), game);

  const buttons = createGridButtons(game);
  const potentialWin = Math.floor(game.bet * game.multiplier);

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('💣 Mines Oyunu')
    .setDescription(`4x5 grid'de **${game.totalMines} mayın** var!`)
    .addFields(
      { name: '💰 Bahis', value: `${game.bet} 🪙`, inline: true },
      { name: '💎 Açılan Kareler', value: `${game.safeRevealed}`, inline: true },
      { name: '📊 Çarpan', value: `${game.multiplier.toFixed(2)}x`, inline: true },
      { name: '💵 Potansiyel Kazanç', value: `${potentialWin} 🪙`, inline: true }
    )
    .setTimestamp();

  return interaction.update({ embeds: [embed], components: buttons });
}

// Helper functions
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

function calculateMultiplier(safeRevealed: number, totalMines: number): number {
  // Basit ve doğru formül
  // Teorik: multiplier = total_tiles / remaining_safe_tiles
  // %10 house edge: multiplier = theoretical * 0.90
  
  const totalTiles = 20; // 4x5 grid
  const totalSafeTiles = totalTiles - totalMines;
  const remainingSafeTiles = totalSafeTiles - safeRevealed;
  
  if (remainingSafeTiles <= 0) return 1.0;
  
  // Teorik multiplier
  const theoretical = totalTiles / remainingSafeTiles;
  
  // %10 house edge uygula
  const multiplier = theoretical * 0.90;
  
  return multiplier;
}

function createGridButtons(game: any): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  
  // 4 satır x 5 sütun = 20 kare
  for (let row = 0; row < 4; row++) {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      let emoji = '⬜';
      let style = ButtonStyle.Secondary;
      
      if (game.revealed[index]) {
        if (game.grid[index]) {
          emoji = '💣';
          style = ButtonStyle.Danger;
        } else {
          emoji = '💎';
          style = ButtonStyle.Success;
        }
      }
      
      const button = new ButtonBuilder()
        .setCustomId(`mines_${index}`)
        .setEmoji(emoji)
        .setStyle(style)
        .setDisabled(game.revealed[index]);
      
      actionRow.addComponents(button);
    }
    
    rows.push(actionRow);
  }
  
  // 5. satır: Cashout butonu
  const cashoutRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('mines_cashout')
      .setLabel('💰 Cashout')
      .setStyle(ButtonStyle.Success)
      .setDisabled(game.safeRevealed === 0)
  );
  
  rows.push(cashoutRow);
  
  return rows;
}
