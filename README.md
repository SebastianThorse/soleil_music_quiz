# 🧞 Commands

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
