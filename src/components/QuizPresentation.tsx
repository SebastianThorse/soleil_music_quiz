// src/components/QuizPresentation.tsx
import { useState } from 'react';

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

interface LeaderboardEntry {
  userId: string;
  userName: string;
  correctGuesses: number;
  totalGuesses: number;
}

interface Props {
  quizName: string;
  submissions: Submission[];
  leaderboard: LeaderboardEntry[];
}

const getSpotifyTrackId = (link: string): string | null => {
  try {
    const match = link.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Quiz names can arrive as UTF-8 bytes decoded as Latin-1 (for example, "Ã¶").
const getDisplayQuizName = (name: string): string => {
  try {
    const bytes = Uint8Array.from(name, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return name;
  }
};

export default function QuizPresentation({
  quizName,
  submissions,
  leaderboard,
}: Props) {
  const [currentScreen, setCurrentScreen] = useState<
    'start' | 'song' | 'results'
  >('start');
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [revealedSongs, setRevealedSongs] = useState<Set<number>>(new Set());
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const startPresentation = () => {
    setCurrentScreen('song');
    setCurrentSongIndex(0);
  };

  const revealAnswer = () => {
    setRevealedSongs((prev) => new Set(prev).add(currentSongIndex));
  };

  const nextSong = () => {
    if (currentSongIndex < submissions.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    } else {
      setCurrentScreen('results');
      // Start revealing leaderboard entries
      setTimeout(() => setShowLeaderboard(true), 300);
    }
  };

  const currentSubmission = submissions[currentSongIndex];
  const isRevealed = revealedSongs.has(currentSongIndex);
  const displayQuizName = getDisplayQuizName(quizName);
  const spotifyId = currentSubmission
    ? getSpotifyTrackId(currentSubmission.songLink)
    : null;

  // Reverse leaderboard for last-to-first reveal
  const reversedLeaderboard = [...leaderboard].reverse();

  return (
    <div className="presentation-container">
      {/* Start Screen */}
      {currentScreen === 'start' && (
        <div className="screen active">
          <div className="start-content">
            <h1>{displayQuizName}</h1>
            <h2>Presentationsläge</h2>
            <p className="subtitle">
              Gå igenom varje låt och se vem som gissade vad
            </p>
            <button
              onClick={startPresentation}
              className="btn-primary btn-large"
            >
              Starta presentation
            </button>
          </div>
        </div>
      )}

      {/* Song Screen */}
      {currentScreen === 'song' && currentSubmission && (
        <div className="screen active song-screen">
          <div className="song-content">
            <div className="song-info">
              {currentSubmission.songTitle && (
                <h2 className="song-title">{currentSubmission.songTitle}</h2>
              )}
              {currentSubmission.artist && (
                <p className="artist">{currentSubmission.artist}</p>
              )}
            </div>

            {/* Spotify Embed */}
            {spotifyId && (
              <div className="spotify-embed-row">
                <div className="spotify-embed">
                  <iframe
                    style={{ borderRadius: '12px' }}
                    src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
                <div className="song-number">
                  Låt {currentSongIndex + 1} av {submissions.length}
                </div>
              </div>
            )}

            {/* Guess Visualization */}
            <div className="guess-grid">
              {currentSubmission.guessDistribution
                .sort((a, b) => b.guessCount - a.guessCount) // Sort by most guesses first
                // Always show the correct submitter once revealed, even with 0 guesses
                .filter(
                  (guess) => guess.guessCount > 0 || (guess.isCorrect && isRevealed),
                )
                .map((guess) => {
                  const maxGuesses = Math.max(
                    ...currentSubmission.guessDistribution.map(
                      (g) => g.guessCount,
                    ),
                    1,
                  );
                  const sizeMultiplier =
                    1 + (guess.guessCount / maxGuesses) * 2;
                  const fontSize = Math.min(1.2 * sizeMultiplier, 2.5);

                  return (
                    <div
                      key={guess.participantId}
                      className={`guess-box ${
                        guess.isCorrect && isRevealed
                          ? 'correct-answer revealed'
                          : ''
                      }`}
                      style={{ fontSize: `${fontSize}rem` }}
                    >
                      <div className="guess-count">
                        {guess.guessCount}
                      </div>
                      <div className="guess-name">{guess.participantName}</div>

                      {/* Tooltip - only show if there are guessers */}
                      {guess.guessers.length > 0 && (
                        <div className="guess-tooltip">
                          <div className="tooltip-title">Gissade av:</div>
                          {guess.guessers.map((guesser, idx) => (
                            <div key={idx} className="tooltip-name">
                              {guesser}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="action-buttons">
              {!isRevealed ? (
                <button
                  onClick={revealAnswer}
                  className="btn-primary btn-large"
                >
                  Avslöja vem som skickade in
                </button>
              ) : (
                <button onClick={nextSong} className="btn-secondary btn-large">
                  {currentSongIndex < submissions.length - 1
                    ? 'Nästa låt →'
                    : 'Se slutresultat →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {currentScreen === 'results' && (
        <div className="screen active results-screen">
          <div className="results-content">
            <h1>Slutresultat</h1>
            <h2>{quizName}</h2>

            <div className="leaderboard">
              {reversedLeaderboard.map((entry, index) => {
                const placement = leaderboard.length - index;
                const medal =
                  placement === 1
                    ? '🥇'
                    : placement === 2
                      ? '🥈'
                      : placement === 3
                        ? '🥉'
                        : '';

                return (
                  <div
                    key={entry.userId}
                    className={`leaderboard-entry ${showLeaderboard ? 'reveal' : 'hidden'}`}
                    style={{ animationDelay: `${index * 0.5}s` }}
                  >
                    <div className="placement">{medal || `#${placement}`}</div>
                    <div className="player-name">{entry.userName}</div>
                    <div className="score">
                      <span className="correct">{entry.correctGuesses}</span>
                      <span className="total">/ {entry.totalGuesses}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href={`/quiz/${submissions[0]?.id}`}
              className="btn-primary btn-large"
            >
              Tillbaka till quizet
            </a>
          </div>
        </div>
      )}

      <style>{`
        .presentation-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }

        .screen {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }

        .screen.active {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Start Screen */
        .start-content {
          text-align: center;
          color: white;
          max-width: 600px;
        }

        .start-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .start-content h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }

        .start-content .subtitle {
          font-size: 1.25rem;
          opacity: 0.8;
          margin-bottom: 3rem;
        }

        /* Song Screen */
        .song-screen {
          flex-direction: column;
        }

        .song-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .song-number {
          color: white;
          opacity: 0.9;
          font-size: 2rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .song-info {
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }

        .song-title {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
        }

        .artist {
          font-size: 1.5rem;
          opacity: 0.9;
          margin: 0;
        }

        .spotify-embed-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .spotify-embed {
          max-width: 500px;
          width: 100%;
        }

        .guesses-title {
          color: white;
          text-align: center;
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }

        .guess-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .guess-box {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 1rem;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .guess-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .guess-box.correct-answer {
          background-color: #059669;
          color: white;
        }

        .guess-box.correct-answer.revealed {
          animation: correctReveal 0.6s ease-out;
        }

        @keyframes correctReveal {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .guess-box.hidden {
          display: none;
        }

        .guess-name {
          font-weight: 700;
          font-size: 2rem;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }

        .guess-count {
          font-size: 3rem;
          font-weight: 700;
          opacity: 0.8;
          width: 100%;
          border-bottom: 2px solid black;
          border-radius: 1rem 1rem 0 0;
          background-color: #C8A2C8; /* lilac */
        }

        .guess-box.correct-answer .guess-count {
          opacity: 1;
          font-weight: 600;
          background-color: #059669;
        }

        .guess-box.correct-answer .guess-count::before {
          content: "✓ ";
          font-size: 3rem;
        }

        /* Tooltip */
        .guess-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          z-index: 10;
        }

        .guess-box:hover .guess-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-5px);
        }

        .tooltip-title {
          font-weight: 600;
          font-size: 1.5rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 0.25rem;
        }

        .tooltip-name {
          font-size: 2rem;
          padding: 0.25rem 0;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-primary {
          background-color: white;
          color: #667eea;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
        }

        .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.25rem;
        }

        /* Results Screen */
        .results-content {
          width: 100%;
          max-width: 800px;
          text-align: center;
          color: white;
        }

        .results-content h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .results-content h2 {
          font-size: 1.5rem;
          opacity: 0.9;
          margin-bottom: 3rem;
        }

        .leaderboard {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 3rem;
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          color: #1f2937;
          opacity: 0;
          transform: translateX(-50px);
        }

        .leaderboard-entry.reveal {
          animation: slideIn 0.5s ease-out forwards;
        }

        .leaderboard-entry.hidden {
          opacity: 0;
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .placement {
          font-size: 2rem;
          font-weight: 700;
          min-width: 60px;
        }

        .player-name {
          flex: 1;
          text-align: left;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .score {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .score .correct {
          color: #10b981;
          font-size: 2rem;
        }

        .score .total {
          color: #6b7280;
          font-size: 1.25rem;
        }

        @media (max-width: 768px) {
          .guess-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .spotify-embed-row {
            flex-direction: column;
            gap: 1rem;
          }

          .song-number {
            font-size: 1.5rem;
          }

          .song-title {
            font-size: 1.75rem;
          }

          .artist {
            font-size: 1.25rem;
          }

          .start-content h1 {
            font-size: 2rem;
          }

          .results-content h1 {
            font-size: 2rem;
          }

          .leaderboard-entry {
            gap: 1rem;
            padding: 1rem;
          }

          .placement {
            font-size: 1.5rem;
            min-width: 50px;
          }

          .player-name {
            font-size: 1.125rem;
          }

          .score {
            font-size: 1.125rem;
          }

          .score .correct {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
