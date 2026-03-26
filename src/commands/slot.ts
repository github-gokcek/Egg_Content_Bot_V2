import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { questService } from '../services/questService';
import { autoDeleteMessage } from '../utils/messageCleanup';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
const WEIGHTS = [40, 30, 15, 10, 4, 1]; // Toplam 100 - ev avantajı artırıldı (Önceki: 30, 25, 20, 15, 8, 2)

// Multiplier'lar (ev avantajı için düşük tutuldu)
const MULTIPLIERS: Record<string, number> = {
  '🍒': 1.5,  // Önceki: 2
  '🍋': 2,    // Önceki: 3
  '🍊': 2.5,  // Önceki: 4
  '🍇': 3,    // Önceki: 5
  '💎': 5,    // Önceki: 10
  '7️⃣': 10   // Önceki: 20
};

function spinSlot(): string {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (let i = 0; i < SYMBOLS.length; i++) {
    cumulative += WEIGHTS[i];
    if (random < cumulative) {
      return SYMBOLS[i];
    }
  }
  
  return SYMBOLS[0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slot')
    .setDescription('Slot machine oyna!')
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

    // Bahsi çıkar
    player.balance -= amount;
    await databaseService.updatePlayer(player);

    // Quest tracking - Non-blocking
    questService.trackSlotPlay(interaction.user.id).catch(() => {});
    questService.trackCasinoSpent(interaction.user.id, amount).catch(() => {});

    // Spin
    const slot1 = spinSlot();
    const slot2 = spinSlot();
    const slot3 = spinSlot();

    const slotDisplay = `🎰 ${slot1} ${slot2} ${slot3} 🎰`;

    // Kazanma kontrolü
    let won = false;
    let multiplier = 0;
    let winAmount = 0;

    if (slot1 === slot2 && slot2 === slot3) {
      // 3 aynı
      won = true;
      multiplier = MULTIPLIERS[slot1];
      winAmount = amount * multiplier;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      // 2 aynı - küçük kazanç (ev avantajı için düşük)
      won = true;
      multiplier = 1.2;
      winAmount = Math.floor(amount * multiplier);
    }

    if (won) {
      // Kazanç ver (bahis zaten çıkarıldı)
      player.balance += winAmount;
      await databaseService.updatePlayer(player);

      // Quest tracking - Non-blocking
      const netWin = winAmount - amount;
      if (netWin > 0) {
        questService.trackCasinoWin(interaction.user.id, netWin, true).catch(() => {});
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Slot Machine - Kazandın!')
        .setDescription(slotDisplay)
        .addFields(
          { name: '🎯 Sonuç', value: slot1 === slot2 && slot2 === slot3 ? `3x ${slot1}` : '2x Eşleşme', inline: true },
          { name: '📊 Çarpan', value: `x${multiplier}`, inline: true },
          { name: '💰 Kazanç', value: `+${winAmount - amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      // Kaybetti (bahis zaten çıkarıldı)
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💸 Slot Machine - Kaybettin!')
        .setDescription(slotDisplay)
        .addFields(
          { name: '💸 Kayıp', value: `-${amount} 🪙`, inline: true },
          { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true }
        )
        .setFooter({ text: 'Şansını tekrar dene!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
