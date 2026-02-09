// src/lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// Quiz tables
export const quizzes = sqliteTable('quizzes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  status: text('status', { enum: ['open', 'closed', 'guessing', 'completed'] })
    .notNull()
    .default('open'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const songSubmissions = sqliteTable('song_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  songLink: text('song_link').notNull(),
  songTitle: text('song_title'),
  artist: text('artist'),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const guesses = sqliteTable('guesses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  guesserId: text('guesser_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  songSubmissionId: integer('song_submission_id')
    .notNull()
    .references(() => songSubmissions.id, { onDelete: 'cascade' }),
  guessedUserId: text('guessed_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  guessedAt: integer('guessed_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const quizParticipants = sqliteTable('quiz_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const quizAdmins = sqliteTable('quiz_admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  addedBy: text('added_by').references(() => user.id),
});
