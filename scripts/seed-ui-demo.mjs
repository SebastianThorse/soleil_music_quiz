// Isolated, fictional data for visual review. Never connects to Turso or changes content.db.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { hashPassword } from 'better-auth/crypto';

await fs.mkdir('.astro', { recursive: true });
const path = '.astro/ui-demo.db';
if (existsSync(path))
  throw new Error(`${path} already exists. Use the existing demo database.`);
const db = new DatabaseSync(path);
for (const migration of ['001_better_auth_tables.sql', '002_quiz_tables.sql']) {
  db.exec(
    await fs.readFile(
      new URL(`../migrations/${migration}`, import.meta.url),
      'utf8',
    ),
  );
}
const now = Math.floor(Date.now() / 1000);
const names = [
  'Åsa Öberg',
  'Björn Åkesson',
  'Cecilia Sjöström',
  'David Berg',
  'Elin Nyström',
  'Filip Åström',
  'Gösta Lind',
  'Hanna Ek',
  'Iris Sandström',
  'Jörgen Persson',
  'Karin Lund',
  'Lars Holm',
  'Märta Östergård',
];
names.forEach((name, i) =>
  db
    .prepare(
      'INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
    )
    .run(`demo-${i}`, name, `demo${i}@example.com`, 1, now, now),
);
db.prepare(
  'INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
).run(
  'demo-account',
  'demo-0',
  'credential',
  'demo-0',
  await hashPassword('Fredagsdemo2026!'),
  now,
  now,
);
for (const [id, status] of [
  [42, 'completed'],
  [43, 'guessing'],
  [44, 'open'],
]) {
  db.prepare(
    'INSERT INTO quizzes (id,name,description,created_by,status,created_at,closed_at) VALUES (?,?,?,?,?,?,?)',
  ).run(
    id,
    'FredagslÃ¥ten – höst på Soleil 🎵',
    'Fiktivt exempel för granskning. Å, ä och ö ska visas rätt.',
    'demo-0',
    status,
    now,
    status === 'open' ? null : now,
  );
  db.prepare('INSERT INTO quiz_admins (quiz_id,user_id) VALUES (?,?)').run(
    id,
    'demo-0',
  );
  names.forEach((_, i) =>
    db
      .prepare('INSERT INTO quiz_participants (quiz_id,user_id) VALUES (?,?)')
      .run(id, `demo-${i}`),
  );
  const songs = [
    ['Vy från ett luftslott', 'kent'],
    ['Här kommer Bumbibjörnarna', 'Haakon Pedersen'],
    [
      'En mycket lång låttitel som fortfarande ska vara läsbar på storbild',
      'En artist med ett längre namn',
    ],
    [null, null],
    ['Piano Man', 'Billy Joel'],
    ['Sir Duke', 'Stevie Wonder'],
    ['Emerald', 'Thin Lizzy'],
    ['Skånegatan', 'Mauro Scocco'],
  ];
  songs.forEach(([title, artist], s) => {
    const songId = id * 100 + s;
    const owner = s === 0 ? 12 : s;
    db.prepare(
      'INSERT INTO song_submissions (id,quiz_id,user_id,song_link,song_title,artist,submitted_at) VALUES (?,?,?,?,?,?,?)',
    ).run(
      songId,
      id,
      `demo-${owner}`,
      s === 3
        ? 'https://open.spotify.com/search/soleil'
        : 'https://open.spotify.com/track/4g5JMsxxzvN3Yj2e6cECKw',
      title,
      artist,
      now,
    );
    if (status === 'open') return;
    names.forEach((_, i) => {
      const choice =
        s === 0 ? 1 + (i % 8) : i >= s ? owner : (owner + 1) % names.length;
      db.prepare(
        'INSERT INTO guesses (quiz_id,guesser_id,song_submission_id,guessed_user_id,is_correct,guessed_at) VALUES (?,?,?,?,?,?)',
      ).run(
        id,
        `demo-${i}`,
        songId,
        `demo-${choice}`,
        choice === owner ? 1 : 0,
        now,
      );
    });
  });
}
db.close();
console.log('Demo: TURSO_DATABASE_URL=file:.astro/ui-demo.db npm run dev');
console.log(
  'Login: demo0@example.com / Fredagsdemo2026! (fictional local account)',
);
