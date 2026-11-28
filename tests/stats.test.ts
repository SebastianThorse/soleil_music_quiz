import assert from 'node:assert/strict';
import test from 'node:test';
import {
  correctPercent,
  podium,
  rankByWins,
  winsFor,
  wrongGuesses,
  type QuizScore,
} from '../src/lib/win-stats.ts';

const score = (
  quizId: number,
  userId: string,
  correctGuesses: number,
): QuizScore => ({
  quizId,
  userId,
  userName: userId.toUpperCase(),
  correctGuesses,
  totalGuesses: 8,
});

const summary = (rows: QuizScore[]) =>
  rankByWins(rows).map(({ userId, rank, wins, correctGuesses, shared }) => ({
    userId,
    rank,
    wins,
    correctGuesses,
    shared,
  }));

test('gives everyone tied for first in a quiz a win', () => {
  const ranked = rankByWins([score(1, 'anna', 5), score(1, 'erik', 5), score(1, 'sara', 3)]);
  assert.deepEqual(
    ranked.map((p) => [p.userId, p.wins]),
    [
      ['anna', 1],
      ['erik', 1],
      ['sara', 0],
    ],
  );
});

test('a quiz where nobody guessed right has no winner', () => {
  const ranked = rankByWins([score(1, 'anna', 0), score(1, 'erik', 0), score(1, 'sara', 0)]);
  assert.ok(ranked.every((p) => p.wins === 0));
  assert.equal(ranked.length, 3);
});

// 'zed' scores 0 in every quiz so each quiz has the three guessers needed to count.
test('sums wins and correct guesses across quizzes', () => {
  assert.deepEqual(
    summary([
      score(1, 'anna', 4),
      score(1, 'erik', 2),
      score(1, 'zed', 0),
      score(2, 'anna', 1),
      score(2, 'erik', 6),
      score(2, 'zed', 0),
      score(3, 'anna', 3),
      score(3, 'erik', 1),
      score(3, 'zed', 0),
    ]),
    [
      { userId: 'anna', rank: 1, wins: 2, correctGuesses: 8, shared: false },
      { userId: 'erik', rank: 2, wins: 1, correctGuesses: 9, shared: false },
      { userId: 'zed', rank: 3, wins: 0, correctGuesses: 0, shared: false },
    ],
  );
});

test('breaks equal wins by total correct guesses', () => {
  const ranked = summary([
    score(1, 'anna', 3),
    score(1, 'erik', 1),
    score(1, 'zed', 0),
    score(2, 'anna', 1),
    score(2, 'erik', 7),
    score(2, 'zed', 0),
  ]);
  assert.deepEqual(
    ranked.map((p) => [p.userId, p.rank]),
    [
      ['erik', 1],
      ['anna', 2],
      ['zed', 3],
    ],
  );
});

test('shares a rank only when wins and correct guesses are both equal', () => {
  const ranked = summary([
    score(1, 'anna', 4),
    score(1, 'erik', 4),
    score(1, 'sara', 2),
    score(2, 'olle', 1),
    score(2, 'sara', 0),
    score(2, 'zed', 0),
  ]);
  assert.deepEqual(
    ranked.map((p) => [p.userId, p.rank, p.shared]),
    [
      ['anna', 1, true],
      ['erik', 1, true],
      ['olle', 3, false],
      ['sara', 4, false],
      ['zed', 5, false],
    ],
  );
});

test('the podium holds ranks 1–3 and only players with a win', () => {
  const ranked = rankByWins([
    score(1, 'anna', 4),
    score(1, 'erik', 2),
    score(1, 'zed', 0),
    score(2, 'sara', 3),
    score(2, 'olle', 1),
    score(2, 'zed', 0),
  ]);
  assert.deepEqual(
    podium(ranked).map((p) => p.userId),
    ['anna', 'sara'],
  );
});

test('ignores quizzes with fewer than three guessers', () => {
  const ranked = summary([
    score(1, 'anna', 1),
    score(2, 'erik', 2),
    score(2, 'anna', 2),
    score(3, 'erik', 3),
    score(3, 'anna', 1),
    score(3, 'sara', 0),
  ]);
  assert.deepEqual(ranked, [
    { userId: 'erik', rank: 1, wins: 1, correctGuesses: 3, shared: false },
    { userId: 'anna', rank: 2, wins: 0, correctGuesses: 1, shared: false },
    { userId: 'sara', rank: 3, wins: 0, correctGuesses: 0, shared: false },
  ]);
});

test('counts the quizzes each player took part in, excluding small ones', () => {
  const ranked = rankByWins([
    score(1, 'anna', 2),
    score(1, 'erik', 1),
    score(1, 'sara', 0),
    score(2, 'anna', 3),
    score(2, 'erik', 1),
  ]);
  assert.deepEqual(
    ranked.map((p) => [p.userId, p.quizzes]),
    [
      ['anna', 1],
      ['erik', 1],
      ['sara', 1],
    ],
  );
});

test('lists a player’s wins in input order with who shared them', () => {
  const scores = [
    score(3, 'anna', 5),
    score(3, 'erik', 5),
    score(3, 'sara', 5),
    score(2, 'anna', 1),
    score(2, 'erik', 4),
    score(2, 'sara', 0),
    score(1, 'anna', 6),
    score(1, 'erik', 2),
    score(1, 'sara', 2),
  ];
  assert.deepEqual(
    winsFor('anna', scores).map((w) => [w.score.quizId, w.sharedWith]),
    [
      [3, ['ERIK', 'SARA']],
      [1, []],
    ],
  );
  assert.deepEqual(winsFor('sara', scores).map((w) => w.score.quizId), [3]);
});

test('a player’s wins skip small quizzes and quizzes nobody scored in', () => {
  const scores = [
    score(1, 'anna', 3),
    score(1, 'erik', 1),
    score(2, 'anna', 0),
    score(2, 'erik', 0),
    score(2, 'sara', 0),
  ];
  assert.deepEqual(winsFor('anna', scores), []);
  assert.deepEqual(winsFor('nobody', scores), []);
});

test('sums all guesses and works out wrong guesses and the share correct', () => {
  const [anna] = rankByWins([
    { quizId: 1, userId: 'anna', userName: 'ANNA', correctGuesses: 3, totalGuesses: 8 },
    { quizId: 1, userId: 'erik', userName: 'ERIK', correctGuesses: 1, totalGuesses: 8 },
    { quizId: 1, userId: 'zed', userName: 'ZED', correctGuesses: 0, totalGuesses: 8 },
    { quizId: 2, userId: 'anna', userName: 'ANNA', correctGuesses: 2, totalGuesses: 4 },
    { quizId: 2, userId: 'erik', userName: 'ERIK', correctGuesses: 1, totalGuesses: 4 },
    { quizId: 2, userId: 'zed', userName: 'ZED', correctGuesses: 0, totalGuesses: 4 },
  ]);
  assert.equal(anna.totalGuesses, 12);
  assert.equal(wrongGuesses(anna), 7);
  assert.equal(correctPercent(anna), '42 %');
  assert.equal(correctPercent({ correctGuesses: 0, totalGuesses: 0 }), '–');
});
