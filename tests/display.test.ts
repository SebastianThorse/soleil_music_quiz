import assert from 'node:assert/strict';
import test from 'node:test';
import { displayText } from '../src/lib/display-text.ts';
import {
  buildLeaderboardGroups,
  getSpotifyTrackId,
  presentationEntries,
  presentationPages,
} from '../src/lib/quiz-display.ts';

test('repairs Swedish mojibake without damaging existing Unicode or mixed text', () => {
  assert.equal(
    displayText('FredagslÃ¥ten · BjÃ¶rn Ã–berg'),
    'Fredagslåten · Björn Öberg',
  );
  assert.equal(
    displayText('Åsa: FredagslÃ¥ten 🎵 日本語'),
    'Åsa: Fredagslåten 🎵 日本語',
  );
  assert.equal(displayText('ÅÄÖ åäö · 🎵 · 日本語'), 'ÅÄÖ åäö · 🎵 · 日本語');
  assert.equal(displayText('Ã…sa'), 'Åsa');
  assert.equal(displayText('ÃƒÂ¶'), 'ö');
  assert.equal(displayText('ðŸŽµ'), '🎵');
  assert.equal(displayText('Ãx â text �'), 'Ãx â text �');
  assert.equal(displayText(null), '');
});

test('ranking uses shared competition placements and never changes source order', () => {
  const entries = [3, 9, 5, 9, 0].map((correctGuesses, i) => ({
    userId: String(i),
    userName: 'Spelare ' + i,
    correctGuesses,
    totalGuesses: 10,
  }));
  const original = structuredClone(entries);
  const groups = buildLeaderboardGroups(entries);
  assert.deepEqual(
    groups.map((g) => g.rank),
    [1, 3, 4, 5],
  );
  assert.equal(groups[0].entries.length, 2);
  assert.deepEqual(entries, original);
  assert.deepEqual(buildLeaderboardGroups([]), []);
  assert.equal(
    buildLeaderboardGroups(entries.map((e) => ({ ...e, correctGuesses: 0 })))[0]
      .entries.length,
    5,
  );
});

test('Spotify embeds accept track links and fall back for search, short and other links', () => {
  assert.equal(
    getSpotifyTrackId('https://open.spotify.com/track/abc123?si=test'),
    'abc123',
  );
  assert.equal(
    getSpotifyTrackId('https://open.spotify.com/intl-sv/track/abc123'),
    'abc123',
  );
  assert.equal(
    getSpotifyTrackId('https://open.spotify.com/search/queen'),
    null,
  );
  assert.equal(getSpotifyTrackId('https://open.spotify.com/s/example'), null);
  assert.equal(getSpotifyTrackId('https://example.com/track/abc123'), null);
  assert.equal(getSpotifyTrackId('invalid'), null);
});

test('15 players share one screen; only larger results paginate, including shared medals', () => {
  const entries = Array.from({ length: 15 }, (_, i) => ({
    userId: String(i),
    userName: 'Spelare ' + i,
    correctGuesses: Math.min(i, 13),
    totalGuesses: 15,
  }));
  const before = presentationEntries(entries, 0);
  assert.equal(before.length, 12);
  assert.ok(before.every((e) => e.rank > 3));
  const bronze = presentationEntries(entries, 1);
  assert.equal(bronze.length, 13);
  assert.equal(bronze.at(-1)?.rank, 3);
  const all = presentationEntries(entries, 2);
  assert.equal(all.length, 15);
  assert.equal(new Set(all.map((e) => e.userId)).size, 15);
  assert.ok(all.slice(-2).every((e) => e.rank === 1 && e.shared));
  const ties = entries.map((e) => ({ ...e, correctGuesses: 0 }));
  assert.deepEqual(presentationEntries(ties, 0), []);
  assert.equal(presentationEntries(ties, 1).length, 15);
  assert.deepEqual(presentationEntries([], 1), []);
  assert.equal(presentationPages(entries, 2).length, 1);
  const sixteen = [...entries, { ...entries[0], userId: 'extra' }];
  const fallback = presentationPages(sixteen, 3);
  assert.deepEqual(
    fallback.map((page) => page.length),
    [15, 1],
  );
  assert.equal(new Set(fallback.flat().map((entry) => entry.userId)).size, 16);
  assert.deepEqual(presentationPages([], 0), []);
});
