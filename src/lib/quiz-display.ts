export interface LeaderboardEntry {
  userId: string;
  userName: string;
  correctGuesses: number;
  totalGuesses: number;
}

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

// Give each newly revealed medal group its own page, including tied winners.
export function presentationPages(
  entries: LeaderboardEntry[],
  revealedMedals: number,
  pageSize = 6,
) {
  const groups = [...buildLeaderboardGroups(entries)].reverse();
  const rows = (group: (typeof groups)[number]) =>
    group.entries.map((entry) => ({
      ...entry,
      rank: group.rank,
      shared: group.entries.length > 1,
    }));
  const chunk = (items: ReturnType<typeof rows>) => {
    const pages: (typeof items)[] = [];
    for (let i = 0; i < items.length; i += pageSize)
      pages.push(items.slice(i, i + pageSize));
    return pages;
  };
  return [
    ...chunk(groups.filter((g) => g.rank > 3).flatMap(rows)),
    ...groups
      .filter((g) => g.rank <= 3)
      .slice(0, revealedMedals)
      .flatMap((g) => chunk(rows(g))),
  ];
}
