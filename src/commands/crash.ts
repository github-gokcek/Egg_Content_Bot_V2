import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { databaseService } from '../services/databaseService';
import { questService } from '../services/questService';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Logger } from '../utils/logger';

interface CrashGame {
  userId: string;
  bet: number;
  crashPoint: number;
  startTime: number;
  crashed: boolean;
  messageId?: string;
}

function generateCrashPoint(): number {
  const r = Math.random();

  if (r < 0.50) {
    return random(1.00, 1.15);
  } 
  else if (r < 0.75) {
    return random(1.15, 1.40);
  } 
  else if (r < 0.88) {
    return random(1.40, 1.80);
  } 
  else if (r < 0.95) {
    return random(1.80, 2.50);
  } 
  else if (r < 0.98) {
    return random(2.50, 4.00);
  } 
  else if (r < 0.995) {
    return random(4.00, 7.00);
  } 
  else {
    return random(7.00, 15.00);
  }
}

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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

    const existingGame = await getDoc(doc(db, 'crashGames', interaction.user.id));
    if (existingGame.exists()) {
      return interaction.editReply({
        content: '❌ Zaten aktif bir Crash oyununuz var!'
      });
    }

    const crashPoint = generateCrashPoint();
    
    player.balance -= amount;
    await databaseService.updatePlayer(player);

    // Quest tracking - Non-blocking
    questService.trackCasinoSpent(interaction.user.id, amount).catch(() => {});

    const game: CrashGame = {
      userId: interaction.user.id,
      bet: amount,
      crashPoint,
      startTime: Date.now(),
      crashed: false
    };

    await setDoc(doc(db, 'crashGames', interaction.user.id), game);

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

    const reply = await interaction.editReply({ embeds: [embed], components: [cashoutButton] });
    
    game.messageId = reply.id;
    await setDoc(doc(db, 'crashGames', interaction.user.id), game);

    let currentMultiplier = 1.0;
    const updateInterval = 100;
    const incrementPerUpdate = 0.01;
    
    const crashInterval = setInterval(async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'crashGames', interaction.user.id));
        
        if (!gameDoc.exists()) {
          clearInterval(crashInterval);
          return;
        }

        const gameData = gameDoc.data() as CrashGame;

        if (gameData.crashed) {
          clearInterval(crashInterval);
          return;
        }

        currentMultiplier += incrementPerUpdate;

        if (currentMultiplier >= gameData.crashPoint) {
          currentMultiplier = gameData.crashPoint;
          
          await setDoc(doc(db, 'crashGames', interaction.user.id), {
            ...gameData,
            crashed: true
          });

          clearInterval(crashInterval);

          const crashEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`💥 ${gameData.crashPoint.toFixed(2)}x'de CRASH OLDU!`)
            .setDescription('😢 Maalesef kaybettiniz!')
            .addFields(
              { name: '💰 Bahis', value: `${gameData.bet} 🪙`, inline: true },
              { name: '📊 Crash Noktası', value: `${gameData.crashPoint.toFixed(2)}x`, inline: true },
              { name: '💸 Kayıp', value: `-${gameData.bet} 🪙`, inline: true }
            )
            .setTimestamp();

          try {
            await interaction.editReply({ embeds: [crashEmbed], components: [] });
          } catch (error) {
            Logger.error('Crash mesajı güncellenemedi', error);
          }

          await deleteDoc(doc(db, 'crashGames', interaction.user.id));
          return;
        }

        if (Math.floor(currentMultiplier * 100) % 5 === 0) {
          const potentialWin = Math.floor(amount * currentMultiplier);

          const updatedEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('🚀 Crash Oyunu Devam Ediyor!')
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
            Logger.error('Embed güncellenemedi', error);
          }
        }
      } catch (error) {
        Logger.error('Crash interval hatası', error);
        clearInterval(crashInterval);
      }
    }, updateInterval);

    setTimeout(async () => {
      clearInterval(crashInterval);
      
      const gameDoc = await getDoc(doc(db, 'crashGames', interaction.user.id));
      if (gameDoc.exists() && !gameDoc.data().crashed) {
        await setDoc(doc(db, 'crashGames', interaction.user.id), {
          ...gameDoc.data(),
          crashed: true
        });

        try {
          await interaction.deleteReply();
        } catch (error) {
          Logger.error('Crash mesajı silinemedi', error);
        }

        await deleteDoc(doc(db, 'crashGames', interaction.user.id));
      }
    }, 60000);
  },
};
