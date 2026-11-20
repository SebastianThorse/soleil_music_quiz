// One row per player per completed quiz.
export interface QuizScore {
  quizId: number;
  userId: string;
  userName: string;
  correctGuesses: number;
}

export interface PlayerStats {
  userId: string;
  userName: string;
  wins: number;
  correctGuesses: number;
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
      quizzes: 0,
    };
    player.correctGuesses += s.correctGuesses;
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

export const winsLabel = (wins: number) => `${wins} ${wins === 1 ? 'vinst' : 'vinster'}`;

export const playerUrl = (userId: string) => `/stats/${encodeURIComponent(userId)}`;
