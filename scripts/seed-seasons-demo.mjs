// Adds completed quizzes from earlier seasons to the local demo database, to review the season leaderboards.
// Only touches .astro/ui-demo.db, and can be run again: it replaces the quizzes it added before.
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';

const path = '.astro/ui-demo.db';
if (!existsSync(path)) throw new Error(`${path} is missing. Run npm run demo:seed first.`);
const db = new DatabaseSync(path);

// Correct guesses per guesser (demo-0 … demo-5) out of five songs.
// The first season (up to 2026) also holds the quizzes from demo:seed, and Örjan wins it.
// Spring 2027 (July included): Åsa and Björn tie. Autumn 2027: Åsa wins.
// Run the app with DEMO_TODAY=2028-02-01 to see 2027 as ended seasons.
const quizzes = [
  [101, 'Säsongsdemo – mars 2025', '2025-03-14', [3, 2, 5, 1, 0, 2]],
  [102, 'Säsongsdemo – maj 2026', '2026-05-22', [1, 3, 4, 2, 0, 1]],
  [103, 'Säsongsdemo – mars 2027', '2027-03-12', [4, 2, 0, 1, 0, 0]],
  [104, 'Säsongsdemo – juli 2027', '2027-07-09', [2, 4, 1, 3, 1, 0]],
  [105, 'Säsongsdemo – september 2027', '2027-09-10', [5, 1, 2, 4, 0, 1]],
  [106, 'Säsongsdemo – november 2027', '2027-11-19', [4, 0, 1, 2, 1, 3]],
];
const ids = [101, 102, 103, 104, 105, 106, 107].join(',');
const owners = [6, 7, 8, 9, 10];
const wrongGuess = 'demo-11';

db.exec('BEGIN');
for (const table of ['guesses', 'song_submissions', 'quiz_participants', 'quiz_admins'])
  db.exec(`DELETE FROM ${table} WHERE quiz_id IN (${ids})`);
db.exec(`DELETE FROM quizzes WHERE id IN (${ids})`);

for (const [id, name, day, scores] of quizzes) {
  const closedAt = Math.floor(new Date(`${day}T15:00:00Z`).getTime() / 1000);
  db.prepare(
    'INSERT INTO quizzes (id,name,description,created_by,status,created_at,closed_at) VALUES (?,?,?,?,?,?,?)',
  ).run(id, name, 'Fiktivt quiz för att granska säsonger.', 'demo-0', 'completed', closedAt, closedAt);
  db.prepare('INSERT INTO quiz_admins (quiz_id,user_id) VALUES (?,?)').run(id, 'demo-0');
  for (const user of [...scores.keys(), ...owners])
    db.prepare('INSERT INTO quiz_participants (quiz_id,user_id) VALUES (?,?)').run(id, `demo-${user}`);

  owners.forEach((owner, s) => {
    const songId = id * 100 + s;
    db.prepare(
      'INSERT INTO song_submissions (id,quiz_id,user_id,song_link,song_title,artist,submitted_at) VALUES (?,?,?,?,?,?,?)',
    ).run(songId, id, `demo-${owner}`, 'https://open.spotify.com/search/soleil', `Låt ${s + 1}`, 'Demo', closedAt);
    scores.forEach((correct, guesser) => {
      const isCorrect = s < correct;
      db.prepare(
        'INSERT INTO guesses (quiz_id,guesser_id,song_submission_id,guessed_user_id,is_correct,guessed_at) VALUES (?,?,?,?,?,?)',
      ).run(id, `demo-${guesser}`, songId, isCorrect ? `demo-${owner}` : wrongGuess, isCorrect ? 1 : 0, closedAt);
    });
  });
}
db.exec('COMMIT');
db.close();
console.log(`Added ${quizzes.length} completed quizzes from 2025 to 2027 to ${path}.`);
