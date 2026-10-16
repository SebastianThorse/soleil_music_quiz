// src/components/QuizResults.tsx
import { useState } from 'react';
import { displayText } from '../lib/display-text';
import { getSpotifyTrackId, buildLeaderboardGroups } from '../lib/quiz-display';

interface Song {
  id: number;
  songLink: string;
  songTitle: string | null;
  artist: string | null;
  submitterName: string;
  ownGuess: { guessedUserName: string; isCorrect: boolean | null } | null;
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

const getMedal = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
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
          {revealedSongs.size < songs.length && (
            <button onClick={revealAll} className="btn-secondary btn-small">
              Avslöja alla
            </button>
          )}
        </div>
        <div className="songs-list">
          {songs.map((song, index) => {
            const spotifyId = getSpotifyTrackId(song.songLink);
            const isRevealed = revealedSongs.has(song.id);

            return (
              <div key={song.id} className="song-item">
                <div className="song-content">
                  <div className="song-header">
                    <div className="song-info">
                      <div className="song-title">
                        {displayText(song.songTitle) || `Låt ${index + 1}`}
                      </div>
                      {song.artist && (
                        <div className="song-artist">
                          {displayText(song.artist)}
                        </div>
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
                        title={`Spotify: ${displayText(song.songTitle) || `Låt ${index + 1}`}`}
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
                        Inskickad av:{' '}
                        <strong>{displayText(song.submitterName)}</strong>
                      </div>
                    ) : (
                      <div className="song-submitter hidden-submitter">
                        Inskickad av: <span className="hidden-text">???</span>
                      </div>
                    )}
                    {isRevealed && song.ownGuess && (
                      <div
                        className={`own-guess ${song.ownGuess.isCorrect ? 'correct' : 'incorrect'}`}
                      >
                        Din gissning:{' '}
                        <strong>
                          {displayText(song.ownGuess.guessedUserName)}
                        </strong>{' '}
                        {song.ownGuess.isCorrect ? '✓ Rätt' : '✗ Fel'}
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
          <button
            onClick={toggleLeaderboard}
            aria-expanded={showLeaderboard}
            className="btn-secondary"
          >
            {showLeaderboard ? 'Dölj topplista' : 'Visa topplista'}
          </button>
        </div>

        {showLeaderboard && (
          <div className="leaderboard">
            {buildLeaderboardGroups(leaderboard).map((group) => {
              const medal = getMedal(group.rank);
              const { correctGuesses, totalGuesses } = group.entries[0];
              const percentage =
                totalGuesses > 0
                  ? Math.round((correctGuesses / totalGuesses) * 100)
                  : 0;

              return (
                <div
                  key={group.rank}
                  className={`leaderboard-entry ${
                    group.rank <= 3 ? `rank-${group.rank}` : ''
                  }`}
                >
                  <div className="placement">
                    {medal || `#${group.rank}`}
                    {group.entries.length > 1 && (
                      <span className="shared-badge">delad</span>
                    )}
                  </div>
                  <div className="player-info">
                    <div className="player-names">
                      {group.entries.map((entry) => (
                        <div key={entry.userId} className="player-name">
                          {displayText(entry.userName)}
                        </div>
                      ))}
                    </div>
                    <div className="player-stats">
                      {correctGuesses} rätt av {totalGuesses} gissningar (
                      {percentage}
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
                    <span className="correct">{correctGuesses}</span>
                    <span className="separator">/</span>
                    <span className="total">{totalGuesses}</span>
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
    </div>
  );
}
