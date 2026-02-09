// src/components/QuizResults.tsx
import { useState } from 'react';

interface Song {
  id: number;
  songLink: string;
  songTitle: string | null;
  artist: string | null;
  submitterName: string;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  correctGuesses: number;
  totalGuesses: number;
}

interface Props {
  quizId: number;
  songs: Song[];
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

export default function QuizResults({ quizId, songs, leaderboard }: Props) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [revealedSongs, setRevealedSongs] = useState<Set<number>>(new Set());

  const toggleLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
  };

  const revealSong = (songId: number) => {
    setRevealedSongs((prev) => new Set(prev).add(songId));
  };

  const revealAll = () => {
    setRevealedSongs(new Set(songs.map((s) => s.id)));
  };

  return (
    <div className="results-wrapper">
      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-box">
          <span className="stat-number">{leaderboard.length}</span>
          <span className="stat-label">Deltagare som gissade</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{songs.length}</span>
          <span className="stat-label">Låtar att gissa på</span>
        </div>
      </div>

      {/* Song List */}
      <div className="section">
        <div className="section-header">
          <h3>Alla låtar</h3>
          {!showLeaderboard && revealedSongs.size < songs.length && (
            <button onClick={revealAll} className="btn-secondary btn-small">
              Avslöja alla
            </button>
          )}
        </div>
        <div className="songs-list">
          {songs.map((song) => {
            const spotifyId = getSpotifyTrackId(song.songLink);
            const isRevealed = showLeaderboard || revealedSongs.has(song.id);

            return (
              <div key={song.id} className="song-item">
                <div className="song-content">
                  <div className="song-header">
                    <div className="song-info">
                      {song.songTitle && (
                        <div className="song-title">{song.songTitle}</div>
                      )}
                      {song.artist && (
                        <div className="song-artist">{song.artist}</div>
                      )}
                    </div>
                    {!isRevealed && (
                      <button
                        onClick={() => revealSong(song.id)}
                        className="btn-reveal"
                      >
                        Avslöja avsändare
                      </button>
                    )}
                  </div>

                  {/* Spotify Embed */}
                  {spotifyId && (
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
                  )}

                  {/* Submitter Info */}
                  <div className="song-footer">
                    {isRevealed ? (
                      <div className="song-submitter revealed">
                        Inskickad av: <strong>{song.submitterName}</strong>
                      </div>
                    ) : (
                      <div className="song-submitter hidden-submitter">
                        Inskickad av: <span className="hidden-text">???</span>
                      </div>
                    )}
                    {!spotifyId && (
                      <a
                        href={song.songLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="song-link"
                      >
                        Öppna i Spotify →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="section leaderboard-section">
        <div className="leaderboard-header">
          <h3>Topplista</h3>
          <button onClick={toggleLeaderboard} className="btn-secondary">
            {showLeaderboard ? 'Dölj topplista' : 'Visa topplista'}
          </button>
        </div>

        {showLeaderboard && (
          <div className="leaderboard">
            {leaderboard.map((entry, index) => {
              const placement = index + 1;
              const medal =
                placement === 1
                  ? '🥇'
                  : placement === 2
                    ? '🥈'
                    : placement === 3
                      ? '🥉'
                      : '';
              const percentage =
                entry.totalGuesses > 0
                  ? Math.round(
                      (entry.correctGuesses / entry.totalGuesses) * 100,
                    )
                  : 0;

              return (
                <div key={entry.userId} className="leaderboard-entry">
                  <div className="placement">{medal || `#${placement}`}</div>
                  <div className="player-info">
                    <div className="player-name">{entry.userName}</div>
                    <div className="player-stats">
                      {entry.correctGuesses} rätt av {entry.totalGuesses}{' '}
                      gissningar ({percentage}
                      %)
                    </div>
                  </div>
                  <div className="score-bar-container">
                    <div
                      className="score-bar"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="score">
                    <span className="correct">{entry.correctGuesses}</span>
                    <span className="separator">/</span>
                    <span className="total">{entry.totalGuesses}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {leaderboard.length === 0 && (
        <div className="empty-state">
          <p>Inga gissningar har gjorts ännu.</p>
        </div>
      )}

      <style>{`
        .results-wrapper {
          width: 100%;
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-box {
          text-align: center;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .stat-number {
          display: block;
          font-size: 3rem;
          font-weight: 700;
          color: #0070f3;
        }

        .stat-label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.5rem;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        h3 {
          font-size: 1.5rem;
          color: #1f2937;
          margin: 0;
        }

        .songs-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .song-item {
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
        }

        .song-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .song-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .song-info {
          flex: 1;
        }

        .song-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .song-artist {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .spotify-embed {
          margin: 0.5rem 0;
        }

        .song-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .song-submitter {
          font-size: 0.875rem;
          color: #4b5563;
        }

        .song-submitter.revealed {
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

        .hidden-submitter {
          color: #9ca3af;
        }

        .hidden-text {
          font-weight: 700;
          color: #d1d5db;
          letter-spacing: 0.1em;
        }

        .song-link {
          color: #0070f3;
          text-decoration: none;
          font-weight: 600;
          white-space: nowrap;
          font-size: 0.875rem;
        }

        .song-link:hover {
          text-decoration: underline;
        }

        .btn-secondary,
        .btn-reveal {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-secondary:hover,
        .btn-reveal:hover {
          background-color: #e5e7eb;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .btn-reveal {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background-color: #0070f3;
          color: white;
        }

        .btn-reveal:hover {
          background-color: #0051cc;
        }

        .leaderboard-section {
          margin-bottom: 0;
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .leaderboard {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .leaderboard-entry {
          display: grid;
          grid-template-columns: 60px 1fr 150px 80px;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .leaderboard-entry:hover {
          background: #f3f4f6;
          transform: translateX(5px);
        }

        .leaderboard-entry:nth-child(1) {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #fbbf24;
        }

        .leaderboard-entry:nth-child(2) {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          border: 2px solid #a5b4fc;
        }

        .leaderboard-entry:nth-child(3) {
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          border: 2px solid #fb923c;
        }

        .placement {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          color: #1f2937;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .player-stats {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .score-bar-container {
          background: #e5e7eb;
          border-radius: 9999px;
          height: 8px;
          overflow: hidden;
        }

        .score-bar {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          height: 100%;
          border-radius: 9999px;
          transition: width 1s ease-out;
        }

        .score {
          text-align: right;
          font-weight: 700;
        }

        .score .correct {
          color: #10b981;
          font-size: 1.75rem;
        }

        .score .separator {
          color: #d1d5db;
          font-size: 1.25rem;
          margin: 0 0.25rem;
        }

        .score .total {
          color: #6b7280;
          font-size: 1.25rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .stats-summary {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .section-header button {
            width: 100%;
          }

          .song-header {
            flex-direction: column;
          }

          .btn-reveal {
            align-self: flex-start;
          }

          .song-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .leaderboard-entry {
            grid-template-columns: 50px 1fr;
            gap: 1rem;
          }

          .score-bar-container {
            grid-column: 1 / -1;
          }

          .score {
            grid-column: 1 / -1;
            text-align: center;
          }

          .placement {
            font-size: 1.5rem;
          }

          .player-name {
            font-size: 1.125rem;
          }

          .leaderboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .leaderboard-header button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
