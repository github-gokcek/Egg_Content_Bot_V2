import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { questService } from '../services/questService';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface MinesGame {
  userId: string;
  bet: number;
  grid: boolean[];
  revealed: boolean[];
  safeRevealed: number;
  totalMines: number;
  multiplier: number;
}

function generateGrid(totalMines: number = 5): boolean[] {
  const grid = new Array(20).fill(false);
  const minePositions = new Set<number>();
  
  while (minePositions.size < totalMines) {
    minePositions.add(Math.floor(Math.random() * 20));
  }
  
  minePositions.forEach(pos => grid[pos] = true);
  return grid;
}

function calculateMultiplier(safeRevealed: number, totalMines: number): number {
  const totalTiles = 20;
  const totalSafeTiles = totalTiles - totalMines;
  const remainingSafeTiles = totalSafeTiles - safeRevealed;
  
  if (remainingSafeTiles <= 0) return 1.0;
  
  const theoretical = totalTiles / remainingSafeTiles;
  const multiplier = theoretical * 0.90;
  
  return multiplier;
}

function createGridButtons(game: MinesGame, disabled: boolean = false): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  
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
        .setDisabled(disabled || game.revealed[index]);
      
      actionRow.addComponents(button);
    }
    
    rows.push(actionRow);
  }
  
  const cashoutRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('mines_cashout')
      .setLabel('💰 Cashout')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || game.safeRevealed === 0)
  );
  
  rows.push(cashoutRow);
  
  return rows;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mines')
    .setDescription('Mines oyunu oyna!')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10))
    .addIntegerOption(option =>
      option.setName('mayinlar')
        .setDescription('Mayın sayısı (3-10)')
        .setMinValue(3)
        .setMaxValue(10)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const amount = interaction.options.getInteger('miktar', true);
    const totalMines = interaction.options.getInteger('mayinlar') || 5;

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

    const existingGame = await getDoc(doc(db, 'minesGames', interaction.user.id));
    if (existingGame.exists()) {
      return interaction.editReply({
        content: '❌ Zaten aktif bir Mines oyununuz var!'
      });
    }

    const game: MinesGame = {
      userId: interaction.user.id,
      bet: amount,
      grid: generateGrid(totalMines),
      revealed: new Array(20).fill(false),
      safeRevealed: 0,
      totalMines,
      multiplier: 1.0
    };

    await setDoc(doc(db, 'minesGames', interaction.user.id), game);

    player.balance -= amount;
    await databaseService.updatePlayer(player);

    // Quest tracking - Non-blocking
    questService.trackCasinoSpent(interaction.user.id, amount).catch(() => {});

    const buttons = createGridButtons(game);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('💣 Mines Oyunu')
      .setDescription(`4x5 grid'de **${totalMines} mayın** var!\n\nMayına basmadan kareleri aç ve cashout yap!`)
      .addFields(
        { name: '💰 Bahis', value: `${amount} 🪙`, inline: true },
        { name: '💎 Açılan Kareler', value: '0', inline: true },
        { name: '📊 Çarpan', value: '1.00x', inline: true },
        { name: '💵 Potansiyel Kazanç', value: `${amount} 🪙`, inline: true }
      )
      .setFooter({ text: 'Karelere tıklayarak aç! Mayına basarsan kaybedersin!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: buttons });
  },
};
