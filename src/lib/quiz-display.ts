export interface LeaderboardEntry {
  userId: string;
  userName: string;
  correctGuesses: number;
  totalGuesses: number;
}

export const PRESENTATION_PAGE_SIZE = 15;

export function buildLeaderboardGroups(entries: LeaderboardEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => b.correctGuesses - a.correctGuesses,
  );
  const groups: { rank: number; entries: LeaderboardEntry[] }[] = [];
  sorted.forEach((entry, index) => {
    const previous = groups[groups.length - 1];
    if (previous?.entries[0].correctGuesses === entry.correctGuesses)
      previous.entries.push(entry);
    else groups.push({ rank: index + 1, entries: [entry] });
  });
  return groups;
}

export function getSpotifyTrackId(link: string): string | null {
  try {
    const uri = /^spotify:track:([a-zA-Z0-9]+)$/;
    const trimmed = link.trim();
    const fromUri = trimmed.match(uri)?.[1];
    if (fromUri) return fromUri;
    const url = new URL(trimmed);
    if (!['open.spotify.com', 'play.spotify.com'].includes(url.hostname))
      return null;
    // Album links can point at one track: /album/…?highlight=spotify:track:ID
    const highlighted = url.searchParams.get('highlight')?.match(uri)?.[1];
    return (
      url.pathname.match(
        /^\/(?:intl-[a-z]+(?:-[a-z]+)*\/)?(?:embed\/)?track\/([a-zA-Z0-9]+)\/?$/i,
      )?.[1] ??
      highlighted ??
      null
    );
  } catch {
    return null;
  }
}

function hash32(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

// Song ids grow in submission order, so the order must not follow them (it
// would tell whoever saw the submissions who picked which song). Seeded by the
// quiz so reloads keep the same order.
export function quizOrder<T extends { id: number }>(items: T[], quizId: number): T[] {
  const key = (id: number) => hash32(`${quizId}:${id}`);
  return [...items].sort((a, b) => key(a.id) - key(b.id) || a.id - b.id);
}

// Best placement first. Medal groups stay hidden until revealed, third place
// first; pagination is applied separately.
export function presentationEntries(
  entries: LeaderboardEntry[],
  revealedMedals: number,
) {
  const groups = buildLeaderboardGroups(entries);
  const revealed = groups
    .filter((g) => g.rank <= 3)
    .reverse()
    .slice(0, revealedMedals);
  return groups
    .filter((g) => g.rank > 3 || revealed.includes(g))
    .flatMap((group) =>
      group.entries.map((entry) => ({
        ...entry,
        rank: group.rank,
        shared: group.entries.length > 1,
      })),
    );
}

// Paging is a fallback only: normal quizzes remain on one full-HD screen.
export function presentationPages(
  entries: LeaderboardEntry[],
  revealedMedals: number,
) {
  const visible = presentationEntries(entries, revealedMedals);
  const pages: (typeof visible)[] = [];
  for (let i = 0; i < visible.length; i += PRESENTATION_PAGE_SIZE) {
    pages.push(visible.slice(i, i + PRESENTATION_PAGE_SIZE));
  }
  return pages;
}

// One track link per line: pasting that into a playlist in the Spotify desktop app adds the tracks.
export function playlistLinks<T extends { songLink: string }>(songs: T[]) {
  const links: string[] = [];
  const skipped: T[] = [];
  for (const song of songs) {
    const id = getSpotifyTrackId(song.songLink);
    if (id) links.push(`https://open.spotify.com/track/${id}`);
    else skipped.push(song);
  }
  return { links, skipped };
}
