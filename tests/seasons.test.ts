import assert from 'node:assert/strict';
import test from 'node:test';
import { inSeason, nextSeason, seasonOf, seasonsFor, seasonWinsByPlayer } from '../src/lib/win-stats.ts';

const at = (iso: string) => new Date(iso);
const score = (quizId: number, userId: string, correctGuesses: number, closedAt: string) => ({
  quizId,
  userId,
  userName: userId.toUpperCase(),
  correctGuesses,
  closedAt: at(closedAt),
});

test('splits a year into spring (January–July) and autumn (August–December)', () => {
  assert.deepEqual(seasonOf(at('2027-01-04T12:00:00Z')), { id: '2027-1', name: 'Våren 2027' });
  assert.deepEqual(seasonOf(at('2027-07-30T12:00:00Z')), { id: '2027-1', name: 'Våren 2027' });
  assert.deepEqual(seasonOf(at('2027-08-02T12:00:00Z')), { id: '2027-2', name: 'Hösten 2027' });
  assert.deepEqual(seasonOf(at('2027-12-31T12:00:00Z')), { id: '2027-2', name: 'Hösten 2027' });
});

test('keeps everything up to the end of 2026 in the first season', () => {
  const first = { id: '2026-2', name: 'Första säsongen' };
  assert.deepEqual(seasonOf(at('2024-02-01T12:00:00Z')), first);
  assert.deepEqual(seasonOf(at('2026-03-01T12:00:00Z')), first);
  assert.deepEqual(seasonOf(at('2026-12-18T12:00:00Z')), first);
});

test('uses Swedish time at the season boundary', () => {
  // 22:30 UTC on 31 July is 00:30 on 1 August in Stockholm.
  assert.equal(seasonOf(at('2027-07-31T22:30:00Z')).id, '2027-2');
  // 23:30 UTC on 31 December 2026 is already 2027 in Stockholm.
  assert.equal(seasonOf(at('2026-12-31T23:30:00Z')).id, '2027-1');
});

test('lists the current season first, then ended ones, and leaves out later ones', () => {
  const scores = [
    score(1, 'anna', 1, '2025-03-01T12:00:00Z'),
    score(2, 'anna', 1, '2027-03-01T12:00:00Z'),
    score(3, 'anna', 1, '2027-10-01T12:00:00Z'),
  ];
  assert.deepEqual(
    seasonsFor(scores, at('2028-02-01T12:00:00Z')).map((s) => s.id),
    ['2028-1', '2027-2', '2027-1', '2026-2'],
  );
  assert.deepEqual(
    seasonsFor(scores, at('2027-05-01T12:00:00Z')).map((s) => s.id),
    ['2027-1', '2026-2'],
  );
});

test('the next season follows spring with autumn and autumn with the next spring', () => {
  assert.deepEqual(nextSeason(seasonOf(at('2026-11-27T12:00:00Z'))), {
    id: '2027-1',
    name: 'Våren 2027',
    starts: 'januari 2027',
  });
  assert.deepEqual(nextSeason(seasonOf(at('2027-03-01T12:00:00Z'))), {
    id: '2027-2',
    name: 'Hösten 2027',
    starts: 'augusti 2027',
  });
});

test('filters scores to one season', () => {
  const scores = [
    score(1, 'anna', 1, '2027-03-01T12:00:00Z'),
    score(2, 'anna', 1, '2027-09-01T12:00:00Z'),
  ];
  assert.deepEqual(inSeason(scores, '2027-2').map((s) => s.quizId), [2]);
});

test('gives a season win to everyone ranked first in an ended season', () => {
  const now = at('2027-11-26T12:00:00Z');
  const scores = [
    // First season (2025–2026): anna wins outright.
    score(1, 'anna', 4, '2025-03-01T12:00:00Z'),
    score(1, 'erik', 2, '2025-03-01T12:00:00Z'),
    score(1, 'zed', 0, '2025-03-01T12:00:00Z'),
    // Spring 2027: anna and erik tie on wins and correct guesses.
    score(2, 'anna', 3, '2027-03-01T12:00:00Z'),
    score(2, 'erik', 3, '2027-03-01T12:00:00Z'),
    score(2, 'zed', 0, '2027-03-01T12:00:00Z'),
    // Autumn 2027 is still going on, so erik's lead there doesn't count yet.
    score(3, 'anna', 1, '2027-09-01T12:00:00Z'),
    score(3, 'erik', 5, '2027-09-01T12:00:00Z'),
    score(3, 'zed', 0, '2027-09-01T12:00:00Z'),
  ];
  assert.deepEqual(
    [...seasonWinsByPlayer(scores, now)].sort(),
    [
      ['anna', 2],
      ['erik', 1],
    ],
  );
});

test('the first season has no winner until 2027', () => {
  const scores = [
    score(1, 'anna', 4, '2026-03-01T12:00:00Z'),
    score(1, 'erik', 2, '2026-03-01T12:00:00Z'),
    score(1, 'zed', 0, '2026-03-01T12:00:00Z'),
  ];
  assert.equal(seasonWinsByPlayer(scores, at('2026-12-31T12:00:00Z')).size, 0);
  assert.deepEqual([...seasonWinsByPlayer(scores, at('2027-01-08T12:00:00Z'))], [['anna', 1]]);
});

test('a season where nobody won a quiz has no season winner', () => {
  const scores = [
    score(1, 'anna', 0, '2027-03-01T12:00:00Z'),
    score(1, 'erik', 0, '2027-03-01T12:00:00Z'),
    score(1, 'zed', 0, '2027-03-01T12:00:00Z'),
  ];
  assert.equal(seasonWinsByPlayer(scores, at('2027-11-26T12:00:00Z')).size, 0);
});
