// One row per player per completed quiz.
export interface QuizScore {
  quizId: number;
  userId: string;
  userName: string;
  correctGuesses: number;
  totalGuesses: number;
}

export interface PlayerStats {
  userId: string;
  userName: string;
  wins: number;
  correctGuesses: number;
  totalGuesses: number;
  quizzes: number;
  rank: number;
  shared: boolean;
}

export interface Win<T extends QuizScore> {
  score: T;
  sharedWith: string[];
}

// Filters out test quizzes, which typically have one or two guessers.
export const MIN_GUESSERS = 3;

function countedScores<T extends QuizScore>(allScores: T[]) {
  const guessersByQuiz = new Map<number, number>();
  for (const s of allScores) {
    guessersByQuiz.set(s.quizId, (guessersByQuiz.get(s.quizId) ?? 0) + 1);
  }
  const scores = allScores.filter((s) => guessersByQuiz.get(s.quizId)! >= MIN_GUESSERS);

  const bestByQuiz = new Map<number, number>();
  for (const s of scores) {
    bestByQuiz.set(s.quizId, Math.max(bestByQuiz.get(s.quizId) ?? 0, s.correctGuesses));
  }
  // A quiz where the best score is 0 has no winner.
  const isWin = (s: QuizScore) =>
    s.correctGuesses > 0 && s.correctGuesses === bestByQuiz.get(s.quizId);

  return { scores, isWin };
}

export function rankByWins(allScores: QuizScore[]): PlayerStats[] {
  const { scores, isWin } = countedScores(allScores);

  const players = new Map<string, Omit<PlayerStats, 'rank' | 'shared'>>();
  for (const s of scores) {
    const player = players.get(s.userId) ?? {
      userId: s.userId,
      userName: s.userName,
      wins: 0,
      correctGuesses: 0,
      totalGuesses: 0,
      quizzes: 0,
    };
    player.correctGuesses += s.correctGuesses;
    player.totalGuesses += s.totalGuesses;
    player.quizzes += 1;
    if (isWin(s)) player.wins += 1;
    players.set(s.userId, player);
  }

  const sameScore = (a: { wins: number; correctGuesses: number }, b: typeof a) =>
    a.wins === b.wins && a.correctGuesses === b.correctGuesses;

  const sorted = [...players.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.correctGuesses - a.correctGuesses ||
      a.userName.localeCompare(b.userName, 'sv'),
  );

  const ranks: number[] = [];
  sorted.forEach((player, i) => {
    ranks[i] = i > 0 && sameScore(sorted[i - 1], player) ? ranks[i - 1] : i + 1;
  });

  return sorted.map((player, i) => ({
    ...player,
    rank: ranks[i],
    shared:
      (i > 0 && sameScore(sorted[i - 1], player)) ||
      (i < sorted.length - 1 && sameScore(sorted[i + 1], player)),
  }));
}

// Keeps the order of the input scores.
export function winsFor<T extends QuizScore>(userId: string, allScores: T[]): Win<T>[] {
  const { scores, isWin } = countedScores(allScores);
  const winners = scores.filter(isWin);
  return winners
    .filter((s) => s.userId === userId)
    .map((score) => ({
      score,
      sharedWith: winners
        .filter((w) => w.quizId === score.quizId && w.userId !== userId)
        .map((w) => w.userName),
    }));
}

// Players without a win stay off the podium even when few have won so far.
export const podium = (players: PlayerStats[]) =>
  players.filter((p) => p.rank <= 3 && p.wins > 0);

export const medalFor = (rank: number) => ['🥇', '🥈', '🥉'][rank - 1] ?? `#${rank}`;

export const wrongGuesses = (p: { correctGuesses: number; totalGuesses: number }) =>
  p.totalGuesses - p.correctGuesses;

export const correctPercent = (p: { correctGuesses: number; totalGuesses: number }) =>
  p.totalGuesses === 0 ? '–' : `${Math.round((100 * p.correctGuesses) / p.totalGuesses)}\u00a0%`;

export const winsLabel = (wins: number) => `${wins} ${wins === 1 ? 'vinst' : 'vinster'}`;

export const playerUrl = (userId: string) => `/stats/${encodeURIComponent(userId)}`;

// A season is a half year: 1 = January–July (July is usually the last quiz before the summer
// break), 2 = August–December.
export interface Season {
  id: string;
  name: string;
}

// Quizzes before seasons were introduced stay together in one season that ends with 2026.
const FIRST_SEASON_YEAR = 2026;
const FIRST_SEASON: Season = { id: `${FIRST_SEASON_YEAR}-2`, name: 'Första säsongen' };

const stockholmMonthYear = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  year: 'numeric',
  month: 'numeric',
});

export function seasonOf(date: Date): Season {
  const parts = stockholmMonthYear.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);
  if (year <= FIRST_SEASON_YEAR) return FIRST_SEASON;
  return halfYear(year, month <= 7 ? 1 : 2);
}

const halfYear = (year: number, half: number): Season => ({
  id: `${year}-${half}`,
  name: `${half === 1 ? 'Våren' : 'Hösten'} ${year}`,
});

export function nextSeason(season: Season): Season & { starts: string } {
  const [year, half] = season.id.split('-').map(Number);
  return half === 1
    ? { ...halfYear(year, 2), starts: `augusti ${year}` }
    : { ...halfYear(year + 1, 1), starts: `januari ${year + 1}` };
}

// The current season first, then the ended ones, newest first.
export function seasonsFor(scores: { closedAt: Date | null }[], now = new Date()): Season[] {
  const current = seasonOf(now);
  const seasons = new Map<string, Season>([[current.id, current]]);
  for (const { closedAt } of scores) {
    if (!closedAt) continue;
    const season = seasonOf(closedAt);
    // Ids are "YYYY-H", so string order is chronological.
    if (season.id < current.id) seasons.set(season.id, season);
  }
  return [...seasons.values()].sort((a, b) => b.id.localeCompare(a.id));
}

export const inSeason = <T extends { closedAt: Date | null }>(scores: T[], seasonId: string) =>
  scores.filter((s) => s.closedAt && seasonOf(s.closedAt).id === seasonId);

// Only seasons that have ended have a winner: everyone sharing first place with at least one win.
export function seasonWinsByPlayer(
  scores: (QuizScore & { closedAt: Date | null })[],
  now = new Date(),
): Map<string, number> {
  const current = seasonOf(now).id;
  const wins = new Map<string, number>();
  for (const season of seasonsFor(scores, now)) {
    if (season.id >= current) continue;
    for (const player of podium(rankByWins(inSeason(scores, season.id)))) {
      if (player.rank === 1) wins.set(player.userId, (wins.get(player.userId) ?? 0) + 1);
    }
  }
  return wins;
}

export const seasonWinsLabel = (wins: number) =>
  `${wins} ${wins === 1 ? 'säsongsvinst' : 'säsongsvinster'}`;
