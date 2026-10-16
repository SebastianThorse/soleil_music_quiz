import { useEffect, useState } from 'react';
import { displayText } from '../lib/display-text';
import {
  buildLeaderboardGroups,
  getSpotifyTrackId,
  presentationPages,
  PRESENTATION_PAGE_SIZE,
  type LeaderboardEntry,
} from '../lib/quiz-display';

interface Participant {
  participantId: string;
  participantName: string;
  guessCount: number;
  guessers: string[];
  isCorrect: boolean;
}
interface Submission {
  id: number;
  songLink: string;
  songTitle: string | null;
  artist: string | null;
  userId: string;
  userName: string;
  guessDistribution: Participant[];
}
interface Props {
  quizId: number;
  quizName: string;
  submissions: Submission[];
  leaderboard: LeaderboardEntry[];
}

function Pagination({
  page,
  pages,
  label,
  onChange,
}: {
  page: number;
  pages: number;
  label: string;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="p-pagination" aria-label={label}>
      <button
        className="p-quiet"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        ← Föregående
      </button>
      <span>
        Sida {page + 1} av {pages}
      </span>
      <button
        className="p-quiet"
        disabled={page + 1 >= pages}
        onClick={() => onChange(page + 1)}
      >
        Nästa sida →
      </button>
    </nav>
  );
}

export default function QuizPresentation({
  quizId,
  quizName,
  submissions,
  leaderboard,
}: Props) {
  const [screen, setScreen] = useState<'start' | 'song' | 'results'>('start');
  const [songIndex, setSongIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [guessPage, setGuessPage] = useState(0);
  const [resultPage, setResultPage] = useState(0);
  const [medalCount, setMedalCount] = useState(0);
  const [showGuessers, setShowGuessers] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState('');
  const current = submissions[songIndex];
  const isRevealed = current ? revealed.has(current.id) : false;
  const spotifyId = current ? getSpotifyTrackId(current.songLink) : null;
  const guesses = current
    ? [...current.guessDistribution]
        .filter((g) => g.guessCount > 0 || (g.isCorrect && isRevealed))
        .sort(
          (a, b) =>
            b.guessCount - a.guessCount ||
            a.participantName.localeCompare(b.participantName, 'sv'),
        )
    : [];
  const groups = [...buildLeaderboardGroups(leaderboard)].reverse();
  const medals = groups.filter((g) => g.rank <= 3);
  const resultSheets = presentationPages(leaderboard, medalCount);
  const guessPages = Math.ceil(guesses.length / PRESENTATION_PAGE_SIZE);
  const allMedals = medalCount >= medals.length;
  const latestMedal = medals[medalCount - 1];
  const winners = groups.find((group) => group.rank === 1);

  const moveSong = (index: number) => {
    setSongIndex(index);
    setGuessPage(0);
    setShowGuessers(false);
    setScreen('song');
  };
  const previous = () => {
    if (screen === 'results' && submissions.length)
      moveSong(submissions.length - 1);
    else if (screen === 'song' && songIndex > 0) moveSong(songIndex - 1);
    else setScreen('start');
  };
  const advance = () => {
    if (screen === 'start') {
      if (submissions.length) moveSong(0);
      else setScreen('results');
    } else if (screen === 'song' && current) {
      if (!isRevealed) setRevealed((prev) => new Set(prev).add(current.id));
      else if (songIndex < submissions.length - 1) moveSong(songIndex + 1);
      else {
        setResultPage(0);
        setScreen('results');
      }
    } else if (screen === 'results' && !allMedals) {
      const visibleCount = resultSheets.flat().length;
      setResultPage(Math.floor(visibleCount / PRESENTATION_PAGE_SIZE));
      setMedalCount((count) => count + 1);
    }
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setNotice('');
    } catch {
      setNotice(
        'Helskärm kunde inte startas. Du kan använda webbläsarens helskärmsläge.',
      );
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, songIndex, resultPage]);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat)
        return;
      const target = event.target as HTMLElement;
      if (target?.closest('input, select, textarea, [contenteditable="true"]'))
        return;
      if (
        (event.key === ' ' || event.key === 'Enter') &&
        target?.closest('button, a')
      )
        return;
      if (event.key === ' ' || event.key === 'Enter') {
        // Only activation of the actual reveal button may disclose an answer.
        if (screen === 'song' && !isRevealed) return;
        event.preventDefault();
        advance();
      } else if (
        event.key === 'ArrowRight' &&
        screen === 'song' &&
        isRevealed
      ) {
        event.preventDefault();
        advance();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const actionLabel =
    screen === 'start'
      ? 'Börja genomgången →'
      : screen === 'song'
        ? !isRevealed
          ? 'Vem valde låten?'
          : songIndex < submissions.length - 1
            ? 'Nästa låt →'
            : 'Till slutresultatet →'
        : !allMedals
          ? `Avslöja ${medals[medalCount].rank === 1 ? (medals[medalCount].entries.length > 1 ? 'vinnarna' : 'vinnaren') : 'plats ' + medals[medalCount].rank} →`
          : '';

  return (
    <div className="presentation">
      <header className="p-header">
        <a className="p-brand" href={`/quiz/${quizId}/results`}>
          <span aria-hidden="true">♪</span> Fredagslåten
        </a>
        <p>{displayText(quizName)}</p>
        <button className="p-quiet" onClick={toggleFullscreen}>
          {fullscreen ? 'Lämna helskärm' : 'Helskärm'}
        </button>
      </header>
      {notice && (
        <p role="status" className="p-notice">
          {notice}
        </p>
      )}
      {screen === 'start' && (
        <section className="p-start">
          <span className="p-eyebrow">Soleil · Resultatgenomgång</span>
          <h1>
            Vems låt
            <br />
            var det?
          </h1>
          <p>
            {submissions.length} låtar. {leaderboard.length} deltagare som
            gissade.
            <br />
            Nu får vi veta vem som valde vad.
          </p>
          {!submissions.length && (
            <p>Inga låtar har lämnats in i det här quizet.</p>
          )}
          <button className="p-primary" onClick={advance}>
            {actionLabel}
          </button>
          <p className="p-hint">
            Avslöja med knappen. → går vidare efter avslöjandet. ← går tillbaka.
          </p>
        </section>
      )}
      {screen === 'song' && current && (
        <section
          className={`p-song ${guessPages > 1 ? 'has-pages' : ''}`}
          aria-label={`Låt ${songIndex + 1} av ${submissions.length}`}
        >
          <div className="p-song-heading">
            <div>
              <span className="p-eyebrow">
                Låt {String(songIndex + 1).padStart(2, '0')} /{' '}
                {String(submissions.length).padStart(2, '0')}
              </span>
              <h1>
                {displayText(current.songTitle) || `Låt ${songIndex + 1}`}
              </h1>
              <p className="p-artist">
                {displayText(current.artist) ||
                  'Lyssna på låten och se gissningarna nedan.'}
              </p>
            </div>
            <div className="p-player">
              {spotifyId ? (
                <iframe
                  title={`Spotify: ${displayText(current.songTitle) || 'Låt ' + (songIndex + 1)}`}
                  src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <a
                  className="p-secondary"
                  href={current.songLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Öppna låten ↗
                </a>
              )}
            </div>
          </div>
          <div
            className={`p-answer ${isRevealed ? 'is-revealed' : ''}`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              {isRevealed ? 'Låten valdes av' : 'Vem valde låten?'}
            </span>
            <strong>
              {isRevealed ? displayText(current.userName) : 'Dags att avslöja.'}
            </strong>
          </div>
          <div className="p-section-heading">
            <h2>
              Så gissade ni <small>Egna rätta gissningar är borträknade</small>
            </h2>
            <button
              className="p-quiet"
              aria-pressed={showGuessers}
              onClick={() => setShowGuessers((v) => !v)}
            >
              {showGuessers
                ? 'Dölj namn på de som gissade'
                : 'Visa vem som gissade'}
            </button>
          </div>
          {guesses.length ? (
            <div
              className={`p-guesses ${guesses.length <= 4 ? 'is-sparse' : guesses.length > 9 ? 'is-compact' : ''} ${showGuessers ? 'with-guessers' : ''}`}
            >
              {guesses
                .slice(
                  guessPage * PRESENTATION_PAGE_SIZE,
                  (guessPage + 1) * PRESENTATION_PAGE_SIZE,
                )
                .map((guess) => (
                  <div
                    className={`p-guess ${guess.isCorrect && isRevealed ? 'is-correct' : ''}`}
                    key={guess.participantId}
                    tabIndex={showGuessers ? undefined : 0}
                    role="group"
                    aria-label={`${displayText(guess.participantName)}: ${guess.guessCount} gissningar`}
                  >
                    <div className="p-guess-top">
                      <span>{displayText(guess.participantName)}</span>
                      <strong>
                        {guess.guessCount}
                        <small>
                          {guess.guessCount === 1 ? 'gissning' : 'gissningar'}
                        </small>
                      </strong>
                    </div>
                  {guess.isCorrect && isRevealed && guess.guessCount > 0 && (
                      <span className="p-correct-label">✓ Rätt gissat!</span>
                    )}
                    {showGuessers && guess.guessers.length > 0 && (
                      <p className="p-guessers">
                        {guess.guessers.map(displayText).join(', ')}
                      </p>
                    )}
                    {!showGuessers && guess.guessers.length > 0 && (
                      <div className="p-hover-guessers">
                        Gissade av: {guess.guessers.map(displayText).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="p-empty">Inga gissningar på den här låten ännu.</p>
          )}
          <Pagination
            page={guessPage}
            pages={guessPages}
            label="Sidor med gissningar"
            onChange={setGuessPage}
          />
        </section>
      )}
      {screen === 'results' && (
        <section
          className={`p-results ${allMedals && winners ? 'is-finale' : ''} ${resultSheets.length > 1 ? 'has-pages' : ''}`}
        >
          <div className="p-results-heading">
            <span className="p-finale-symbol" aria-hidden="true">
              {allMedals && winners ? '★' : '♪'}
            </span>
            <div>
              <span className="p-eyebrow">
                {allMedals ? 'Fredagslåten · Slutresultat' : 'Spänningen stiger'}
              </span>
              <h1>
                {allMedals && winners
                  ? winners.entries.length > 1
                    ? 'En applåd för vinnarna!'
                    : 'En applåd för vinnaren!'
                  : allMedals
                    ? 'Tack för den här fredagen.'
                    : 'Vem tar hem det?'}
              </h1>
              <p>
                {allMedals
                  ? 'Snyggt spelat, allihop. Vi hörs nästa fredag!'
                  : 'Topplistan avslöjas nedifrån. Lika poäng ger delad placering.'}
              </p>
            </div>
            <div className="p-medal-progress" aria-label="Avslöjade pallplatser">
              {[...medals].reverse().map((group) => (
                <span key={group.rank} aria-label={`Plats ${group.rank}: ${medals.indexOf(group) < medalCount ? 'avslöjad' : 'väntar'}`} className={`p-medal-step p-metal-${group.rank} ${medals.indexOf(group) < medalCount ? 'is-visible' : ''}`}>
                  <span aria-hidden="true">{group.rank}</span>
                  <small>{medals.indexOf(group) < medalCount ? 'avslöjad' : 'väntar'}</small>
                </span>
              ))}
            </div>
          </div>
          {resultSheets.length ? (
            <ol className="p-ranking" aria-label="Avslöjade placeringar">
              {(resultSheets[resultPage] ?? []).map((entry) => (
                <li
                  className={`${entry.rank <= 3 ? `p-medal p-metal-${entry.rank}` : ''} ${entry.rank === latestMedal?.rank ? 'is-latest' : ''}`}
                  key={entry.userId}
                >
                  <span className="p-rank">
                    <span className="p-rank-number">{entry.rank}</span>
                    <small>{entry.shared ? 'delad plats' : 'plats'}</small>
                  </span>
                  <strong className="p-player-name">
                    {displayText(entry.userName)}
                    {entry.rank === 1 && (
                      <small className="p-winner-label">
                        {entry.shared ? 'Delad vinnare' : 'Fredagens vinnare'}
                      </small>
                    )}
                  </strong>
                  <span className="p-score">
                    {entry.correctGuesses}
                    <small>av {entry.totalGuesses} rätt</small>
                  </span>
                  <span className="p-score-track" aria-hidden="true">
                    <span style={{ width: `${entry.totalGuesses > 0 ? Math.min(100, Math.max(0, entry.correctGuesses / entry.totalGuesses * 100)) : 0}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-empty">
              {leaderboard.length
                ? 'Bara pallplatser kvar. Avslöja den första nedan.'
                : 'Inga gissningar har sparats i det här quizet.'}
            </p>
          )}
          <Pagination
            page={resultPage}
            pages={resultSheets.length}
            label="Sidor med resultat"
            onChange={setResultPage}
          />
        </section>
      )}
      {screen !== 'start' && (
        <footer className="p-controls">
          <button className="p-secondary" onClick={previous}>
            ←{' '}
            {screen === 'song' && songIndex === 0
              ? 'Till starten'
              : 'Föregående låt'}
          </button>
          <span className="p-hint">
            {screen === 'song' && !isRevealed
              ? 'Hovra för att se vem som gissade · Avslöja med knappen'
              : 'Mellanslag: gå vidare · ← tillbaka'}
          </span>
          {actionLabel ? (
            <button className="p-primary" onClick={advance}>
              {actionLabel}
            </button>
          ) : (
            <a className="p-primary" href={`/quiz/${quizId}/results`}>
              Tillbaka till resultaten →
            </a>
          )}
        </footer>
      )}
    </div>
  );
}
