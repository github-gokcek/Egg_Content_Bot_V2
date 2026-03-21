import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { riotApiService } from '../services/riotApiService';
import { championDataService } from '../services/championDataService';
import { screenshotService } from '../services/screenshotService';
import { Logger } from '../utils/logger';

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn/14.24.1';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lol')
    .setDescription('League of Legends oyuncu bilgileri')
    .addSubcommand(subcommand =>
      subcommand
        .setName('profil')
        .setDescription('Oyuncu profilini görüntüle')
        .addStringOption(option =>
          option.setName('oyuncu')
            .setDescription('Oyuncu adı (Örnek: Elma#TR1)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('matchhistory')
        .setDescription('Son maçları görüntüle')
        .addStringOption(option =>
          option.setName('oyuncu')
            .setDescription('Oyuncu adı (Örnek: Elma#TR1)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('adet')
            .setDescription('Kaç maç gösterilsin? (1-10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('live')
        .setDescription('Şu anki maçı görüntüle')
        .addStringOption(option =>
          option.setName('oyuncu')
            .setDescription('Oyuncu adı (Örnek: Elma#TR1)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mastery')
        .setDescription('En çok oynanan şampiyonlar')
        .addStringOption(option =>
          option.setName('oyuncu')
            .setDescription('Oyuncu adı (Örnek: Elma#TR1)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('build')
        .setDescription('Şampiyon build önerisi')
        .addStringOption(option =>
          option.setName('sampiyon')
            .setDescription('Şampiyon adı (Örnek: Renekton)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('counter')
        .setDescription('Şampiyona karşı en iyi counterlar')
        .addStringOption(option =>
          option.setName('sampiyon')
            .setDescription('Şampiyon adı (Örnek: Renekton)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('matchup')
        .setDescription('İki şampiyon arasındaki matchup')
        .addStringOption(option =>
          option.setName('sampiyon1')
            .setDescription('İlk şampiyon (Örnek: Renekton)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('sampiyon2')
            .setDescription('İkinci şampiyon (Örnek: Akali)')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    try {
      if (['build', 'counter', 'matchup'].includes(subcommand)) {
        await championDataService.loadChampions();
      }

      if (subcommand === 'build') {
        const championName = interaction.options.getString('sampiyon', true);
        await handleBuild(interaction, championName);
        return;
      } else if (subcommand === 'counter') {
        const championName = interaction.options.getString('sampiyon', true);
        await handleCounter(interaction, championName);
        return;
      } else if (subcommand === 'matchup') {
        const champ1 = interaction.options.getString('sampiyon1', true);
        const champ2 = interaction.options.getString('sampiyon2', true);
        await handleMatchup(interaction, champ1, champ2);
        return;
      } else {
        const riotId = interaction.options.getString('oyuncu', true);
        const { gameName, tagLine } = riotApiService.parseRiotId(riotId);
        const account = await riotApiService.getAccountByRiotId(gameName, tagLine);
        const summoner = await riotApiService.getSummonerByPuuid(account.puuid);

        if (subcommand === 'profil') {
          await handleProfile(interaction, summoner, account);
        } else if (subcommand === 'matchhistory') {
          const count = interaction.options.getInteger('adet') || 5;
          await handleMatchHistory(interaction, account.puuid, summoner, count);
        } else if (subcommand === 'live') {
          await handleLiveGame(interaction, account.puuid, summoner);
        } else if (subcommand === 'mastery') {
          await handleMastery(interaction, account.puuid, summoner, account);
        }
      }
    } catch (error: any) {
      Logger.error('LoL komut hatası:', error);
      await interaction.editReply({ content: `❌ ${error.message || 'Bir hata oluştu!'}` });
    }
  },
};

async function handleProfile(interaction: ChatInputCommandInteraction, summoner: any, account: any) {
  try {
    // Ranked verilerini al
    let rankedData: any[] = [];
    try {
      rankedData = await riotApiService.getRankedData(summoner.id);
    } catch (error) {
      Logger.warn('Ranked data alınamadı, devam ediliyor...');
    }

    // Maç geçmişini al (son 20 maç)
    let recentMatches: any[] = [];
    let totalWins = 0;
    let totalGames = 0;
    
    try {
      const matchIds = await riotApiService.getMatchHistory(account.puuid, 20);
      const matches = await Promise.all(
        matchIds.slice(0, 20).map(id => riotApiService.getMatchDetails(id))
      );

      for (const match of matches) {
        const participant = match.info.participants.find(p => p.puuid === account.puuid);
        if (participant) {
          totalGames++;
          if (participant.win) totalWins++;
          recentMatches.push({
            champion: participant.championName,
            win: participant.win,
            kda: `${participant.kills}/${participant.deaths}/${participant.assists}`
          });
        }
      }
    } catch (error) {
      Logger.warn('Maç geçmişi alınamadı, devam ediliyor...');
    }

    // Champion mastery al
    let topChampions: any[] = [];
    try {
      const masteries = await riotApiService.getChampionMastery(account.puuid, 3);
      await championDataService.loadChampions();
      
      for (const mastery of masteries) {
        const championName = championDataService.getChampionById(mastery.championId);
        if (championName) {
          topChampions.push({
            name: championName,
            level: mastery.championLevel,
            points: mastery.championPoints
          });
        }
      }
    } catch (error) {
      Logger.warn('Champion mastery alınamadı, devam ediliyor...');
    }

    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor(0x0397ab)
      .setTitle(`📊 ${account.gameName}#${account.tagLine}`)
      .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${summoner.profileIconId}.png`)
      .addFields(
        { name: '🎯 Seviye', value: `${summoner.summonerLevel}`, inline: true }
      );

    // Ranked bilgileri ekle
    if (rankedData && rankedData.length > 0) {
      for (const ranked of rankedData) {
        const queueName = ranked.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex';
        const tier = `${ranked.tier} ${ranked.rank}`;
        const lp = `${ranked.leaguePoints} LP`;
        const winRate = ((ranked.wins / (ranked.wins + ranked.losses)) * 100).toFixed(1);
        const record = `${ranked.wins}W ${ranked.losses}L (${winRate}%)`;
        
        embed.addFields({
          name: `🏆 ${queueName}`,
          value: `**${tier}** - ${lp}\n${record}`,
          inline: true
        });
      }
    }

    // Genel win rate (son 20 maç)
    if (totalGames > 0) {
      const overallWinRate = ((totalWins / totalGames) * 100).toFixed(1);
      embed.addFields({
        name: '📊 Son 20 Maç',
        value: `${totalWins}W ${totalGames - totalWins}L - **${overallWinRate}%** Win Rate`,
        inline: false
      });
    }

    // En çok oynanan şampiyonlar
    if (topChampions.length > 0) {
      const championsText = topChampions
        .map(c => `**${c.name}** (M${c.level}) - ${(c.points / 1000).toFixed(0)}k`)
        .join('\n');
      
      embed.addFields({
        name: '🎮 En Çok Oynanan Şampiyonlar',
        value: championsText,
        inline: false
      });
    }

    // Son maçlar (ilk 5)
    if (recentMatches.length > 0) {
      const matchesText = recentMatches
        .slice(0, 5)
        .map(m => `${m.win ? '✅' : '❌'} ${m.champion} (${m.kda})`)
        .join('\n');
      
      embed.addFields({
        name: '📜 Son Maçlar',
        value: matchesText,
        inline: false
      });
    }

    embed.setTimestamp();
    await interaction.editReply({ embeds: [embed] });

  } catch (error: any) {
    Logger.error('Profil verisi alınırken hata:', error);
    await interaction.editReply({ content: `❌ Profil bilgileri alınamadı: ${error.message}` });
  }
}

async function handleMatchHistory(interaction: ChatInputCommandInteraction, puuid: string, summoner: any, count: number) {
  const matchIds = await riotApiService.getMatchHistory(puuid, count);
  
  if (matchIds.length === 0) {
    await interaction.editReply({ content: '❌ Maç geçmişi bulunamadı!' });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x0397ab)
    .setTitle(`📜 Son ${matchIds.length} Maç - ${summoner.name}`)
    .setDescription('Maç detayları yükleniyor...');

  await interaction.editReply({ embeds: [embed] });

  const matches = await Promise.all(
    matchIds.slice(0, 5).map(id => riotApiService.getMatchDetails(id))
  );

  let description = '';
  for (const match of matches) {
    const participant = match.info.participants.find(p => p.puuid === puuid);
    if (!participant) continue;

    const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
    const result = participant.win ? '✅ Zafer' : '❌ Mağlubiyet';
    const duration = Math.floor(match.info.gameDuration / 60);
    
    description += `**${result}** - ${participant.championName}\n`;
    description += `KDA: ${kda} | ${duration} dakika | ${participant.totalMinionsKilled} CS\n\n`;
  }

  embed.setDescription(description || 'Maç detayları yüklenemedi.');
  await interaction.editReply({ embeds: [embed] });
}

async function handleLiveGame(interaction: ChatInputCommandInteraction, puuid: string, summoner: any) {
  try {
    const liveGame = await riotApiService.getCurrentGame(puuid);
    
    const participant = liveGame.participants.find((p: any) => p.puuid === puuid);
    const gameDuration = Math.floor((Date.now() - liveGame.gameStartTime) / 1000 / 60);

    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle(`🔴 Canlı Maç - ${summoner.name}`)
      .addFields(
        { name: '🎮 Oyun Modu', value: liveGame.gameMode, inline: true },
        { name: '⏱️ Süre', value: `${gameDuration} dakika`, inline: true },
        { name: '🦸 Şampiyon', value: participant?.championId ? `Champion ID: ${participant.championId}` : 'Bilinmiyor', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    if (error.message.includes('bulunamadı')) {
      await interaction.editReply({ content: '❌ Oyuncu şu anda oyunda değil!' });
    } else {
      throw error;
    }
  }
}

async function handleMastery(interaction: ChatInputCommandInteraction, puuid: string, summoner: any, account: any) {
  const masteries = await riotApiService.getChampionMastery(puuid, 5);
  
  if (masteries.length === 0) {
    await interaction.editReply({ content: '❌ Şampiyon mastery verisi bulunamadı!' });
    return;
  }

  // Şampiyon isimlerini yükle
  await championDataService.loadChampions();

  let description = '';
  for (let i = 0; i < masteries.length; i++) {
    const mastery = masteries[i];
    const championName = championDataService.getChampionById(mastery.championId) || `Champion ${mastery.championId}`;
    description += `**${i + 1}.** ${championName}\n`;
    description += `Seviye: ${mastery.championLevel} | ${mastery.championPoints.toLocaleString()} puan\n\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`🏅 En İyi Şampiyonlar - ${account.gameName}#${account.tagLine}`)
    .setDescription(description)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleBuild(interaction: ChatInputCommandInteraction, championName: string) {
  try {
    const champion = championDataService.findChampion(championName);
    
    if (!champion) {
      await interaction.editReply({ content: `❌ Şampiyon bulunamadı: ${championName}` });
      return;
    }

    const championId = champion.id.toLowerCase();
    const uggUrl = `https://u.gg/lol/champions/${championId}/build`;

    // Önce hızlıca loading mesajı gönder
    const loadingEmbed = new EmbedBuilder()
      .setColor(0x00d4aa)
      .setTitle('📸 Build Bilgileri Yükleniyor...')
      .setDescription('U.GG sayfasından build bilgileri alınıyor, lütfen bekleyin...\n\n⏱️ Bu işlem 10-30 saniye sürebilir.');
    
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Ekran görüntüsü çek
    try {
      const screenshotPath = await screenshotService.captureBuildPage(championId);
      
      if (screenshotPath) {
        const attachment = new AttachmentBuilder(screenshotPath);
        const embed = new EmbedBuilder()
          .setColor(0x00d4aa)
          .setTitle(`🛠️ ${champion.name} Build (Patch 14.24)`)
          .setDescription(`🔗 [Detaylı Build Analizi için U.GG'ye Git](${uggUrl})`)
          .setImage(`attachment://${championId}_build.png`)
          .setFooter({ text: 'U.GG - Platinum+ Verileri' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        return;
      }
    } catch (screenshotError) {
      Logger.error('Screenshot hatası:', screenshotError);
    }

    // Screenshot başarısız olursa sadece linki göster
    const embed = new EmbedBuilder()
      .setColor(0x00d4aa)
      .setTitle(`🛠️ ${champion.name} Build`)
      .setThumbnail(`${DDRAGON_BASE}/img/champion/${champion.id}.png`)
      .setDescription(
        `**${champion.name}** için build bilgilerini görmek için:\n\n` +
        `🔗 [U.GG Build Sayfası](${uggUrl})\n\n` +
        `⚠️ Ekran görüntüsü alınamadı.`
      )
      .setFooter({ text: 'U.GG - Platinum+ Verileri' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    Logger.error('Build komut hatası:', error);
    try {
      await interaction.editReply({ content: `❌ ${error.message}` });
    } catch (e) {
      Logger.error('Hata mesajı gönderilemedi:', e);
    }
  }
}

async function handleCounter(interaction: ChatInputCommandInteraction, championName: string) {
  try {
    const champion = championDataService.findChampion(championName);
    
    if (!champion) {
      await interaction.editReply({ content: `❌ Şampiyon bulunamadı: ${championName}` });
      return;
    }

    const championId = champion.id.toLowerCase();
    const uggUrl = `https://u.gg/lol/champions/${championId}/counter`;

    // Önce hızlıca loading mesajı gönder
    const loadingEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📸 Counter Bilgileri Yükleniyor...')
      .setDescription('U.GG sayfasından counter bilgileri alınıyor, lütfen bekleyin...\n\n⏱️ Bu işlem 10-30 saniye sürebilir.');
    
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Ekran görüntüsü çek
    try {
      const screenshotPath = await screenshotService.captureCounterPage(championId);
      
      if (screenshotPath) {
        const attachment = new AttachmentBuilder(screenshotPath);
        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle(`⚔️ ${champion.name} Counterları`)
          .setDescription(`🔗 [Detaylı Analiz için U.GG'ye Git](${uggUrl})`)
          .setImage(`attachment://${championId}_counter.png`)
          .setFooter({ text: 'U.GG - Platinum+ Verileri' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        return;
      }
    } catch (screenshotError) {
      Logger.error('Screenshot hatası:', screenshotError);
    }

    // Screenshot başarısız olursa sadece linki göster
    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle(`⚔️ ${champion.name} Counterları`)
      .setThumbnail(`${DDRAGON_BASE}/img/champion/${champion.id}.png`)
      .setDescription(
        `**${champion.name}** için counter bilgilerini görmek için:\n\n` +
        `🔗 [U.GG Counter Sayfası](${uggUrl})\n\n` +
        `⚠️ Ekran görüntüsü alınamadı.`
      )
      .setFooter({ text: 'U.GG - Platinum+ Verileri' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    Logger.error('Counter komut hatası:', error);
    try {
      await interaction.editReply({ content: `❌ ${error.message}` });
    } catch (e) {
      Logger.error('Hata mesajı gönderilemedi:', e);
    }
  }
}

async function handleMatchup(interaction: ChatInputCommandInteraction, champ1Name: string, champ2Name: string) {
  try {
    const champion1 = championDataService.findChampion(champ1Name);
    const champion2 = championDataService.findChampion(champ2Name);

    if (!champion1) {
      await interaction.editReply({ content: `❌ Şampiyon bulunamadı: ${champ1Name}` });
      return;
    }

    if (!champion2) {
      await interaction.editReply({ content: `❌ Şampiyon bulunamadı: ${champ2Name}` });
      return;
    }

    const championId1 = champion1.id.toLowerCase();
    const championId2 = champion2.id.toLowerCase();
    const uggUrl = `https://u.gg/lol/champions/${championId1}/build?opp=${championId2}`;

    // Önce hızlıca loading mesajı gönder
    const loadingEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📸 Matchup Bilgileri Yükleniyor...')
      .setDescription('U.GG sayfasından matchup bilgileri alınıyor, lütfen bekleyin...\n\n⏱️ Bu işlem 10-30 saniye sürebilir.');
    
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Ekran görüntüsü çek (async olarak)
    try {
      const screenshotPath = await screenshotService.captureMatchupPage(championId1, championId2);
      
      if (screenshotPath) {
        const attachment = new AttachmentBuilder(screenshotPath);
        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle(`⚔️ ${champion1.name} vs ${champion2.name}`)
          .setDescription(`🔗 [Detaylı Matchup Analizi için U.GG'ye Git](${uggUrl})`)
          .setImage(`attachment://${championId1}_vs_${championId2}_matchup.png`)
          .setFooter({ text: 'U.GG - Platinum+ Verileri' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
        return;
      }
    } catch (screenshotError) {
      Logger.error('Screenshot hatası:', screenshotError);
    }

    // Screenshot başarısız olursa kendi veritabanımızdan dene
    const matchup = await championDataService.getMatchup(champ1Name, champ2Name);

    if (matchup.games === 0) {
      // Veri yoksa sadece U.GG linkini göster
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(`⚔️ ${champion1.name} vs ${champion2.name}`)
        .setDescription(
          `Bu matchup için detaylı bilgi almak için:\n\n` +
          `🔗 [U.GG Matchup Sayfası](${uggUrl})\n\n` +
          `⚠️ Ekran görüntüsü alınamadı.`
        )
        .setFooter({ text: 'U.GG - Platinum+ Verileri' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const winRate = (matchup.winRate * 100).toFixed(1);
    const loseRate = (100 - parseFloat(winRate)).toFixed(1);

    let verdict = '';
    if (parseFloat(winRate) > 52) {
      verdict = `✅ **${matchup.champion1}** bu matchup'ta avantajlı!`;
    } else if (parseFloat(winRate) < 48) {
      verdict = `❌ **${matchup.champion2}** bu matchup'ta avantajlı!`;
    } else {
      verdict = `⚖️ Bu matchup dengeli!`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`⚔️ ${matchup.champion1} vs ${matchup.champion2}`)
      .setDescription(
        `**${matchup.champion1}** win rate: **${winRate}%**\n` +
        `**${matchup.champion2}** win rate: **${loseRate}%**\n\n` +
        `${verdict}\n\n` +
        `📊 Analiz: ${matchup.analysis}\n\n` +
        `🔗 [Detaylı Matchup Analizi için U.GG'ye Git](${uggUrl})`
      )
      .setFooter({ text: 'Veri: Meta Analizi' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    Logger.error('Matchup komut hatası:', error);
    try {
      await interaction.editReply({ content: `❌ ${error.message}` });
    } catch (e) {
      Logger.error('Hata mesajı gönderilemedi:', e);
    }
  }
}
