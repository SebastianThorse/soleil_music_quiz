# 🧞 Commands

## UI review

The interface uses a shared Swedish/UTF-8 document shell and shared styles in
`src/styles`. The presentation screen has a separate dark theme for the room display.
Existing mojibake is repaired for display only. No stored quiz data is rewritten.

During the presentation, the song and neutral guess cards appear first. Hover or
keyboard-focus a card to see who guessed, or use **Visa vem som gissade** to keep
those names visible. Only **Vem valde låten?** reveals the submitter and marks the
correct card. Global Space/Enter shortcuts do not reveal an unanswered song.
After the reveal, use the next button, Space or the right arrow to continue.
The left arrow goes back. A previously revealed song stays revealed when revisited.
Up to 15 guess cards or revealed leaderboard entries appear together without page controls.
Pagination appears only when more than 15 people need to be displayed.
The layout targets a full-HD (1920×1080) room display with up to 15 participants;
smaller screens can scroll rather than hiding entries.
Medal placements are revealed from the bottom up; tied players keep a shared rank.

### Local visual fixture (Node 22.18+)

```sh
npm ci
npm run demo:seed
TURSO_DATABASE_URL=file:.astro/ui-demo.db BETTER_AUTH_URL=http://localhost:4321 PUBLIC_APP_URL=http://localhost:4321 npm run dev
```

Sign in at `http://localhost:4321/login` with `demo0@example.com` and
`Fredagsdemo2026!`. These are fictional local demo credentials. The seed command
creates only `.astro/ui-demo.db` and refuses to overwrite an existing file.
It does not connect to Turso or use the normal `.astro/content.db` database.

The home page includes open, guessing and completed quizzes. The demo covers
Swedish text and emoji, an existing broken quiz name, a long title, missing song
metadata, a Spotify search link, all guess cards on one screen, an unguessed submitter
and tied winners. Quiz 46 ("Storbild – 15 bidrag") contains 15 songs and 15
fictional participants for a full-HD single-screen review. Review at 1920×1080
and a narrow mobile viewport.

```sh
npm test
npm run build
```

The tests cover mixed Unicode repairs, shared placements, complete presentation rankings
and supported Spotify URLs. For a manual regression check, confirm that hovering,
showing guesser names and pressing Space on the page do not reveal an answer.
Then activate the reveal button, navigate backwards and through the final leaderboard.
Check a new submission containing `Å, ä och ö 🎵` and save a changed guess on mobile.


All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Local development

Local development is performed against an SQLite local file database and with a local development
server giving the web interface at [http://localhost:4321](http://localhost:4321).

1. Create file .env with the following content
    ```
    PUBLIC_APP_URL=http://localhost:4321
    TURSO_DATABASE_URL=file:.astro/content.db
    BETTER_AUTH_URL=http://localhost:4321
    ```
1. First time setup the database in the SQLite local database file by executing\
  `> npm run db:push`
1. Start the development environment by executing\
  `> npm run dev`

## Development test against real database

It is also possible to test development against real data in the real database.

1. Create file .env with the following content
    ```
    ASTRO_DB_REMOTE_URL=your-database-url-here
    ASTRO_DB_APP_TOKEN=your-app-token-here
    TURSO_DATABASE_URL=bla
    TURSO_AUTH_TOKEN=bla..
    BETTER_AUTH_URL=http://localhost:4321
    ```
1. Start the development environment by executing\
  `> npm run dev`

But you need to know the real world parameters to the database, which you could ask Sebastian Thorsen about.

# Get URL

turso db show soleil-music-quiz --url

# Get token

turso db tokens create soleil-music-quiz
