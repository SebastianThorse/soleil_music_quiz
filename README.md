## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 What you need to do?

# For local development .env

ASTRO_DB_REMOTE_URL=your-database-url-here
ASTRO_DB_APP_TOKEN=your-app-token-here
TURSO_DATABASE_URL=bla
TURSO_AUTH_TOKEN=bla..
BETTER_AUTH_URL=http://localhost:4321

# Get URL

turso db show soleil-music-quiz --url

# Get token

turso db tokens create soleil-music-quiz
