import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface CrashGame {
  userId: string;
  bet: number;
  crashPoint: number;
  startTime: number;
}

// Ev avantajı için crash point hesaplama
function generateCrashPoint(): number {
  // %55 şans 1.5x altında crash
  // %30 şans 1.5x-3x arası
  // %12 şans 3x-5x arası
  // %3 şans 5x+ 
  
  const random = Math.random();
  
  if (random < 0.55) {
    // 1.0x - 1.5x
    return 1.0 + Math.random() * 0.5;
  } else if (random < 0.85) {
    // 1.5x - 3.0x
    return 1.5 + Math.random() * 1.5;
  } else if (random < 0.97) {
    // 3.0x - 5.0x
    return 3.0 + Math.random() * 2.0;
  } else {
    // 5.0x - 10.0x
    return 5.0 + Math.random() * 5.0;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('Crash oyunu oyna!')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('miktar', true);

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

    // Aktif oyun kontrolü
    const existingGame = await getDoc(doc(db, 'crashGames', interaction.user.id));
    if (existingGame.exists()) {
      return interaction.reply({
        content: '❌ Zaten aktif bir Crash oyununuz var!',
        ephemeral: true
      });
    }

    const crashPoint = generateCrashPoint();
    
    const game: CrashGame = {
      userId: interaction.user.id,
      bet: amount,
      crashPoint,
      startTime: Date.now()
    };

    await setDoc(doc(db, 'crashGames', interaction.user.id), game);

    // Bahsi düş
    player.balance -= amount;
    await databaseService.updatePlayer(player);

    const cashoutButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('crash_cashout')
        .setLabel('💰 Cashout')
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🚀 Crash Oyunu Başladı!')
      .setDescription('Multiplier artıyor... Crash olmadan önce cashout yap!')
      .addFields(
        { name: '💰 Bahis', value: `${amount} 🪙`, inline: true },
        { name: '📊 Mevcut Çarpan', value: '1.00x', inline: true },
        { name: '💵 Potansiyel Kazanç', value: `${amount} 🪙`, inline: true }
      )
      .setFooter({ text: 'Cashout butonuna basarak kazancını al!' })
      .setTimestamp();

    const reply = await interaction.reply({ embeds: [embed], components: [cashoutButton], fetchReply: true });

    // Anlık çarpan güncellemesi (her 1 saniyede)
    let currentMultiplier = 1.0;
    let crashIntervalId: NodeJS.Timeout | null = null;
    let crashTimeoutId: NodeJS.Timeout | null = null;
    
    crashIntervalId = setInterval(async () => {
      const gameDoc = await getDoc(doc(db, 'crashGames', interaction.user.id));
      if (!gameDoc.exists()) {
        if (crashIntervalId) clearInterval(crashIntervalId);
        return;
      }

      // Çarpanı artır (crash point'e doğru)
      currentMultiplier += 0.1;

      if (currentMultiplier >= crashPoint) {
        if (crashIntervalId) clearInterval(crashIntervalId);
        return;
      }

      const potentialWin = Math.floor(amount * currentMultiplier);

      const updatedEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🚀 Crash Oyunu Başladı!')
        .setDescription('Multiplier artıyor... Crash olmadan önce cashout yap!')
        .addFields(
          { name: '💰 Bahis', value: `${amount} 🪙`, inline: true },
          { name: '📊 Mevcut Çarpan', value: `${currentMultiplier.toFixed(2)}x`, inline: true },
          { name: '💵 Potansiyel Kazanç', value: `${potentialWin} 🪙`, inline: true }
        )
        .setFooter({ text: 'Cashout butonuna basarak kazancını al!' })
        .setTimestamp();

      try {
        await interaction.editReply({ embeds: [updatedEmbed], components: [cashoutButton] });
      } catch (error) {
        if (crashIntervalId) clearInterval(crashIntervalId);
      }
    }, 1000);

    // Otomatik crash (30 saniye sonra)
    crashTimeoutId = setTimeout(async () => {
      if (crashIntervalId) clearInterval(crashIntervalId);
      
      const gameDoc = await getDoc(doc(db, 'crashGames', interaction.user.id));
      if (gameDoc.exists()) {
        // Oyuncu cashout yapmadı, crash oldu
        await deleteDoc(doc(db, 'crashGames', interaction.user.id));

        // Mesajı sil
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error('Crash mesajı silinemedi:', error);
        }
      }
    }, 30000);
    
    // Timeout ID'yi oyuna kaydet (cashout'ta temizlemek için)
    await setDoc(doc(db, 'crashGames', interaction.user.id), {
      ...game,
      crashTimeoutId: crashTimeoutId[Symbol.toPrimitive]?.() || Date.now()
    });
  },
};
