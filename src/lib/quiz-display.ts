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
    const url = new URL(link);
    if (url.hostname !== 'open.spotify.com') return null;
    return (
      url.pathname.match(
        /^\/(?:intl-[a-z]+\/)?(?:embed\/)?track\/([a-zA-Z0-9]+)\/?$/,
      )?.[1] ?? null
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
