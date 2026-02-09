
-- Quizzes table - stores quiz sessions
CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,  -- Add this field
    created_by TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'guessing', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES User(id)
);

-- Song submissions - stores songs submitted to each quiz
CREATE TABLE song_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    song_link TEXT NOT NULL,
    song_title TEXT,
    artist TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(quiz_id, user_id)
);

-- Guesses - stores user guesses for who submitted which song
CREATE TABLE guesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    guesser_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    song_submission_id INTEGER NOT NULL,
    guessed_user_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    is_correct BOOLEAN,
    guessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (guesser_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (song_submission_id) REFERENCES song_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (guessed_user_id) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(guesser_id, song_submission_id)
);

-- Quiz participants - tracks who has joined each quiz
CREATE TABLE quiz_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    UNIQUE(quiz_id, user_id)
);

-- Quiz admins - tracks who can manage each quiz
CREATE TABLE quiz_admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,  -- Changed from INTEGER to TEXT
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    added_by TEXT,  -- Changed from INTEGER to TEXT
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES User(id),
    UNIQUE(quiz_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX idx_song_submissions_quiz ON song_submissions(quiz_id);
CREATE INDEX idx_song_submissions_user ON song_submissions(user_id);
CREATE INDEX idx_guesses_quiz ON guesses(quiz_id);
CREATE INDEX idx_guesses_guesser ON guesses(guesser_id);
CREATE INDEX idx_quiz_participants_quiz ON quiz_participants(quiz_id);
CREATE INDEX idx_quiz_admins_quiz ON quiz_admins(quiz_id);
CREATE INDEX idx_quiz_admins_user ON quiz_admins(user_id);

-- Example queries you might use:

-- Create a quiz and automatically add creator as admin (use a transaction)
-- BEGIN TRANSACTION;
-- INSERT INTO quizzes (name, description, created_by, status) VALUES (?, ?, ?, 'open');
-- INSERT INTO quiz_admins (quiz_id, user_id, added_by) VALUES (last_insert_rowid(), ?, NULL);
-- COMMIT;

-- Check if user is admin of a quiz
-- SELECT COUNT(*) FROM quiz_admins WHERE quiz_id = ? AND user_id = ?;

-- Get all admins for a quiz
-- SELECT u.id, u.name, qa.added_at 
-- FROM quiz_admins qa
-- JOIN User u ON qa.user_id = u.id
-- WHERE qa.quiz_id = ?;

-- Get all songs for a specific quiz
-- SELECT s.*, u.name FROM song_submissions s 
-- JOIN User u ON s.user_id = u.id 
-- WHERE s.quiz_id = ?;

-- Get all guesses for a quiz with correctness
-- SELECT g.*, u1.name as guesser, u2.name as guessed_for, s.song_title
-- FROM guesses g
-- JOIN User u1 ON g.guesser_id = u1.id
-- JOIN User u2 ON g.guessed_user_id = u2.id
-- JOIN song_submissions s ON g.song_submission_id = s.id
-- WHERE g.quiz_id = ?;

-- Get leaderboard (users with most correct guesses for a quiz)
-- SELECT u.name, COUNT(*) as correct_guesses
-- FROM guesses g
-- JOIN User u ON g.guesser_id = u.id
-- WHERE g.quiz_id = ? AND g.is_correct = 1
-- GROUP BY u.id
-- ORDER BY correct_guesses DESC;

-- Check if user has already submitted a song to a quiz
-- SELECT * FROM song_submissions 
-- WHERE quiz_id = ? AND user_id = ?;
