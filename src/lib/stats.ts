import { desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { guesses, quizzes, user } from './db/schema';
import { rankByWins } from './win-stats';

// Newest quiz first.
export async function getQuizScores() {
  const rows = await db
    .select({
      quizId: guesses.quizId,
      quizName: quizzes.name,
      closedAt: quizzes.closedAt,
      userId: user.id,
      userName: user.name,
      correctGuesses: sql<number>`count(*) filter (where ${guesses.isCorrect} = 1)`,
      totalGuesses: sql<number>`count(*)`,
    })
    .from(guesses)
    .innerJoin(quizzes, eq(guesses.quizId, quizzes.id))
    .innerJoin(user, eq(guesses.guesserId, user.id))
    .where(eq(quizzes.status, 'completed'))
    .groupBy(guesses.quizId, user.id)
    .orderBy(desc(quizzes.closedAt), desc(quizzes.id));

  return rows.map((r) => ({
    ...r,
    correctGuesses: Number(r.correctGuesses),
    totalGuesses: Number(r.totalGuesses),
  }));
}

export async function getWinStats() {
  return rankByWins(await getQuizScores());
}
