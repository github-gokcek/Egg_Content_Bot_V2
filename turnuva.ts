/**
 * Double Elimination Tournament System
 * Supports: 4, 8, 12, 16, 20, 24, 28, 32 players
 */

export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  roundNumber: number;
  bracketType: 'winners' | 'losers';
  isCompleted: boolean;
}

export interface TournamentBracket {
  players: Player[];
  totalPlayers: number;
  winnersBracket: Match[][];
  losersBracket: Match[][];
  finalMatch: Match | null;
  winner: Player | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export function validatePlayerCount(count: number): boolean {
  const validCounts = [4, 8, 12, 16, 20, 24, 28, 32];
  return validCounts.includes(count);
}

export function createTournamentBracket(players: Player[]): TournamentBracket {
  if (!validatePlayerCount(players.length)) {
    throw new Error(`Oyuncu sayısı desteklenmiyor. Desteklenen: 4, 8, 12, 16, 20, 24, 28, 32`);
  }

  const totalPlayers = players.length;
  const winnersBracket: Match[][] = [];
  const losersBracket: Match[][] = [];

  // Winners Bracket oluştur
  createWinnersBracket(players, winnersBracket, totalPlayers);

  // Losers Bracket yapısını hazırla (rakip sayısı winners bracket'tan gelecek)
  initializeLosersBracket(losersBracket, winnersBracket, totalPlayers);

  return {
    players,
    totalPlayers,
    winnersBracket,
    losersBracket,
    finalMatch: null,
    winner: null,
    status: 'pending',
  };
}

function createWinnersBracket(
  players: Player[],
  bracket: Match[][],
  totalPlayers: number
): void {
  // İlk roundu oluştur
  const firstRoundMatches: Match[] = [];
  const byeCount = getByeCount(totalPlayers);

  // Byes'ı hesapla (oyuncu sayısı 2'nin üssü değilse)
  const playersWithBye = byeCount * 2;
  const playersWithMatches = totalPlayers - playersWithBye;

  // Maçı olmayan oyuncular (byes)
  for (let i = 0; i < byeCount; i++) {
    const match: Match = {
      id: `winners-1-${i + 1}`,
      player1: players[playersWithMatches + i * 2],
      player2: players[playersWithMatches + i * 2 + 1],
      winner: null,
      roundNumber: 1,
      bracketType: 'winners',
      isCompleted: false,
    };
    firstRoundMatches.push(match);
  }

  // Diğer oyuncular için maçlar
  for (let i = byeCount; i < totalPlayers / 2; i++) {
    const match: Match = {
      id: `winners-1-bye-${i + 1}`,
      player1: players[i * 2 - playersWithMatches],
      player2: null, // Bye
      winner: null,
      roundNumber: 1,
      bracketType: 'winners',
      isCompleted: false,
    };
    firstRoundMatches.push(match);
  }

  bracket.push(firstRoundMatches);

  // Sonraki roundları oluştur
  let currentRound = firstRoundMatches;
  let roundNumber = 2;

  while (currentRound.length > 1) {
    const nextRound: Match[] = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      const match: Match = {
        id: `winners-${roundNumber}-${i / 2 + 1}`,
        player1: null, // Winners bracket'tan gelecek
        player2: null,
        winner: null,
        roundNumber,
        bracketType: 'winners',
        isCompleted: false,
      };
      nextRound.push(match);
    }
    bracket.push(nextRound);
    currentRound = nextRound;
    roundNumber++;
  }
}

function initializeLosersBracket(
  bracket: Match[][],
  winnersBracket: Match[][],
  totalPlayers: number
): void {
  // Losers bracket round sayısını hesapla
  const losersBracketRounds = Math.floor(Math.log2(totalPlayers)) + 1;

  for (let round = 1; round <= losersBracketRounds; round++) {
    const roundMatches: Match[] = [];

    // Her round'da kaç maç olacak?
    const matchesInRound = Math.pow(2, losersBracketRounds - round);

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        id: `losers-${round}-${i + 1}`,
        player1: null,
        player2: null,
        winner: null,
        roundNumber: round,
        bracketType: 'losers',
        isCompleted: false,
      };
      roundMatches.push(match);
    }

    bracket.push(roundMatches);
  }
}

function getByeCount(totalPlayers: number): number {
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
  return (nextPowerOfTwo - totalPlayers) / 2;
}

export function updateMatchResult(
  bracket: TournamentBracket,
  matchId: string,
  winner: Player
): void {
  let match: Match | undefined;
  let matchList: Match[] | undefined;

  // Match'i bul
  for (const round of bracket.winnersBracket) {
    match = round.find((m) => m.id === matchId);
    if (match) {
      matchList = round;
      break;
    }
  }

  if (!match) {
    for (const round of bracket.losersBracket) {
      match = round.find((m) => m.id === matchId);
      if (match) {
        matchList = round;
        break;
      }
    }
  }

  if (!match || !matchList) {
    throw new Error(`Maç bulunamadı: ${matchId}`);
  }

  // Kaybedeni belirle
  const loser =
    match.player1?.id === winner.id
      ? match.player2
      : match.player1;

  // Match'i güncelle
  match.winner = winner;
  match.isCompleted = true;

  // Winneri sonraki round'a gönder
  progressPlayerToNextRound(bracket, match, 'winners', winner);

  // Loseri losers bracket'a gönder (eğer ilk round kaybederse)
  if (match.roundNumber === 1 && loser) {
    progressPlayerToLosers(bracket, match.roundNumber, loser);
  } else if (loser) {
    // Losers bracket içinde ilerle
    progressPlayerToNextRound(bracket, match, 'losers', loser);
  }

  // Turnuva durumunu güncelle
  bracket.status = 'in_progress';
  checkTournamentCompletion(bracket);
}

function progressPlayerToNextRound(
  bracket: TournamentBracket,
  currentMatch: Match,
  bracketType: 'winners' | 'losers',
  player: Player
): void {
  const roundIndex = currentMatch.roundNumber;
  const targetBracket =
    bracketType === 'winners' ? bracket.winnersBracket : bracket.losersBracket;

  if (roundIndex >= targetBracket.length) {
    // Final match'e git
    if (!bracket.finalMatch) {
      bracket.finalMatch = {
        id: 'final',
        player1: bracketType === 'winners' ? player : null,
        player2: bracketType === 'losers' ? player : null,
        winner: null,
        roundNumber: -1,
        bracketType: 'winners',
        isCompleted: false,
      };
    } else {
      if (bracketType === 'winners') {
        bracket.finalMatch.player1 = player;
      } else {
        bracket.finalMatch.player2 = player;
      }
    }
    return;
  }

  const nextRound = targetBracket[roundIndex];
  const matchIndexInCurrentRound = currentMatch.id.split('-').pop();
  const nextMatchIndex = Math.floor(
    (parseInt(matchIndexInCurrentRound || '0') - 1) / 2
  );

  const nextMatch = nextRound[nextMatchIndex];

  if (!nextMatch) return;

  // Oyuncuyu sonraki maça ekle
  if (!nextMatch.player1) {
    nextMatch.player1 = player;
  } else if (!nextMatch.player2) {
    nextMatch.player2 = player;
  }
}

function progressPlayerToLosers(
  bracket: TournamentBracket,
  winnersBracketRound: number,
  player: Player
): void {
  const losersBracket = bracket.losersBracket;

  // Losers bracket'ın ilk round'una ekle
  if (losersBracket.length === 0) return;

  const firstRound = losersBracket[0];

  // Uygun match'i bul
  for (const match of firstRound) {
    if (!match.player1) {
      match.player1 = player;
      return;
    } else if (!match.player2) {
      match.player2 = player;
      return;
    }
  }
}

function checkTournamentCompletion(bracket: TournamentBracket): void {
  if (
    bracket.finalMatch &&
    bracket.finalMatch.player1 &&
    bracket.finalMatch.player2 &&
    bracket.finalMatch.isCompleted
  ) {
    bracket.winner = bracket.finalMatch.winner;
    bracket.status = 'completed';
  }
}

export function getTournamentStats(bracket: TournamentBracket): {
  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;
  stage: string;
} {
  let totalMatches = 0;
  let completedMatches = 0;

  // Winners bracket
  for (const round of bracket.winnersBracket) {
    totalMatches += round.length;
    completedMatches += round.filter((m) => m.isCompleted).length;
  }

  // Losers bracket
  for (const round of bracket.losersBracket) {
    totalMatches += round.length;
    completedMatches += round.filter((m) => m.isCompleted).length;
  }

  // Final
  if (bracket.finalMatch) {
    totalMatches += 1;
    if (bracket.finalMatch.isCompleted) {
      completedMatches += 1;
    }
  }

  const remainingMatches = totalMatches - completedMatches;

  let stage = 'Başlamadı';
  if (bracket.status === 'in_progress') {
    if (remainingMatches <= bracket.totalPlayers / 2) {
      stage = 'Losers Bracket';
    } else {
      stage = 'Winners Bracket';
    }
  } else if (bracket.status === 'completed') {
    stage = 'Tamamlandı';
  }

  return {
    totalMatches,
    completedMatches,
    remainingMatches,
    stage,
  };
}

export function getNextMatches(bracket: TournamentBracket): Match[] {
  const nextMatches: Match[] = [];

  // Winners bracket'tan oynabilecek maçları bul
  for (const round of bracket.winnersBracket) {
    for (const match of round) {
      if (
        !match.isCompleted &&
        match.player1 &&
        match.player2
      ) {
        nextMatches.push(match);
      }
    }
  }

  // Losers bracket'tan oynabilecek maçları bul
  for (const round of bracket.losersBracket) {
    for (const match of round) {
      if (
        !match.isCompleted &&
        match.player1 &&
        match.player2
      ) {
        nextMatches.push(match);
      }
    }
  }

  // Final match
  if (
    bracket.finalMatch &&
    !bracket.finalMatch.isCompleted &&
    bracket.finalMatch.player1 &&
    bracket.finalMatch.player2
  ) {
    nextMatches.push(bracket.finalMatch);
  }

  return nextMatches;
}

export function createBracketVisualization(bracket: TournamentBracket): string {
  let visualization = '';

  visualization += '\n═══════════════════════════════════════\n';
  visualization += '       🏆 TURNUVA DURUMU 🏆\n';
  visualization += '═══════════════════════════════════════\n\n';

  const stats = getTournamentStats(bracket);
  visualization += `📊 Aşama: ${stats.stage}\n`;
  visualization += `✅ Tamamlanan: ${stats.completedMatches}/${stats.totalMatches}\n`;
  visualization += `⏳ Kalan: ${stats.remainingMatches}\n\n`;

  visualization += '👑 WINNERS BRACKET 👑\n';
  visualization += '─────────────────────\n';
  for (let i = 0; i < bracket.winnersBracket.length; i++) {
    const round = bracket.winnersBracket[i];
    visualization += `\nRound ${i + 1}:\n`;
    for (const match of round) {
      visualization += formatMatch(match);
    }
  }

  visualization += '\n\n💀 LOSERS BRACKET 💀\n';
  visualization += '─────────────────────\n';
  for (let i = 0; i < bracket.losersBracket.length; i++) {
    const round = bracket.losersBracket[i];
    visualization += `\nRound ${i + 1}:\n`;
    for (const match of round) {
      visualization += formatMatch(match);
    }
  }

  if (bracket.finalMatch) {
    visualization += '\n\n🥇 FINAL 🥇\n';
    visualization += '─────────────────────\n';
    visualization += formatMatch(bracket.finalMatch);
  }

  if (bracket.winner) {
    visualization += `\n\n🎉 ŞAMPIYON: ${bracket.winner.name} 🎉\n`;
  }

  visualization += '\n═══════════════════════════════════════\n';

  return visualization;
}

function formatMatch(match: Match): string {
  let result = `[${match.id}] `;

  if (match.player1) {
    result += `${match.player1.name}`;
    if (match.winner?.id === match.player1.id) {
      result += ' ✅';
    }
  } else {
    result += 'TBD';
  }

  result += ' vs ';

  if (match.player2) {
    result += `${match.player2.name}`;
    if (match.winner?.id === match.player2.id) {
      result += ' ✅';
    }
  } else {
    result += 'BYE';
  }

  if (match.isCompleted) {
    result += ` → ${match.winner?.name}`;
  }

  result += '\n';
  return result;
}

// Test function
export function testTournament(): void {
  const testPlayers: Player[] = [
    { id: '1', name: 'Oyuncu 1' },
    { id: '2', name: 'Oyuncu 2' },
    { id: '3', name: 'Oyuncu 3' },
    { id: '4', name: 'Oyuncu 4' },
    { id: '5', name: 'Oyuncu 5' },
    { id: '6', name: 'Oyuncu 6' },
    { id: '7', name: 'Oyuncu 7' },
    { id: '8', name: 'Oyuncu 8' },
  ];

  const bracket = createTournamentBracket(testPlayers);
  console.log(createBracketVisualization(bracket));

  // Örnek match sonuçları
  const nextMatches = getNextMatches(bracket);
  if (nextMatches.length > 0) {
    updateMatchResult(bracket, nextMatches[0].id, nextMatches[0].player1!);
    console.log(createBracketVisualization(bracket));
  }
}
