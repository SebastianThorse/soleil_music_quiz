import assert from 'node:assert/strict';
import test from 'node:test';
import { displayText } from '../src/lib/display-text.ts';
import {
  buildLeaderboardGroups,
  getSpotifyTrackId,
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

test('presentation pages keep tied medal groups together and retain every player', () => {
  const entries = Array.from({ length: 13 }, (_, i) => ({
    userId: String(i),
    userName: 'Spelare ' + i,
    correctGuesses: Math.min(i, 7),
    totalGuesses: 8,
  }));
  assert.deepEqual(
    presentationPages(entries, 0).map((p) => p.length),
    [6, 1],
  );
  const pages = presentationPages(entries, 1);
  assert.deepEqual(
    pages.map((p) => p.length),
    [6, 1, 6],
  );
  assert.ok(pages[2].every((p) => p.rank === 1 && p.shared));
  assert.equal(new Set(pages.flat().map((p) => p.userId)).size, entries.length);
  const ties = entries.map((e) => ({ ...e, correctGuesses: 0 }));
  assert.deepEqual(presentationPages(ties, 0), []);
  assert.deepEqual(
    presentationPages(ties, 1).map((p) => p.length),
    [6, 6, 1],
  );
  assert.deepEqual(presentationPages([], 1), []);
});
