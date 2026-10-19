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

// Medal groups stay hidden until revealed; pagination is applied separately.
export function presentationEntries(
  entries: LeaderboardEntry[],
  revealedMedals: number,
) {
  const groups = [...buildLeaderboardGroups(entries)].reverse();
  return [
    ...groups.filter((g) => g.rank > 3),
    ...groups.filter((g) => g.rank <= 3).slice(0, revealedMedals),
  ].flatMap((group) =>
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
