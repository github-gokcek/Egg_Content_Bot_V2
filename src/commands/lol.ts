import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { riotApiService } from '../services/riotApiService';
import { championDataService } from '../services/championDataService';
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
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'profil') {
        const riotId = interaction.options.getString('oyuncu', true);
        const { gameName, tagLine } = riotApiService.parseRiotId(riotId);
        const account = await riotApiService.getAccountByRiotId(gameName, tagLine);
        const summoner = await riotApiService.getSummonerByPuuid(account.puuid);
        await handleProfile(interaction, summoner, account);
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
