import Database from 'better-sqlite3'
import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type ConceptInput = {
  name: string
  notes?: string
}

export type FlashcardType = 'concept' | 'question'

export type FlashcardInput = {
  type: FlashcardType
  front: string
  back: string
}

export type StudySessionInput = {
  subjectName: string
  sessionDate: string
  durationMinutes: number
  generalNotes?: string
  concepts: ConceptInput[]
  flashcards: FlashcardInput[]
}

export type Concept = ConceptInput & { id: number }
export type Flashcard = FlashcardInput & { id: number }

export type StudySession = Omit<StudySessionInput, 'concepts' | 'flashcards'> & {
  id: number
  subjectId: number
  createdAt: string
  updatedAt: string
  concepts: Concept[]
  flashcards: Flashcard[]
}

export type StudyStats = {
  totalSessions: number
  totalMinutes: number
  totalConcepts: number
  totalFlashcards: number
  subjectBreakdown: Array<{ subjectName: string; sessions: number; minutes: number }>
}

const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    session_date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    general_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id
ON study_sessions(subject_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_session_date
ON study_sessions(session_date);

CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
        REFERENCES study_sessions(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_concepts_session_id
ON concepts(session_id);

CREATE INDEX IF NOT EXISTS idx_concepts_name
ON concepts(name);

CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    card_type TEXT NOT NULL CHECK (card_type IN ('concept', 'question')),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
        REFERENCES study_sessions(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flashcards_session_id
ON flashcards(session_id);

CREATE INDEX IF NOT EXISTS idx_flashcards_type
ON flashcards(card_type);
`

type SessionRow = {
  id: number
  subjectId: number
  subjectName: string
  sessionDate: string
  durationMinutes: number
  generalNotes: string | null
  createdAt: string
  updatedAt: string
}

type ConceptRow = { id: number; sessionId: number; name: string; notes: string | null }
type FlashcardRow = {
  id: number
  sessionId: number
  type: FlashcardType
  front: string
  back: string
}

let database: Database.Database | null = null

function getDatabase(): Database.Database {
  if (database) return database

  const databasePath = join(app.getPath('userData'), 'study-log.sqlite')
  mkdirSync(dirname(databasePath), { recursive: true })
  database = new Database(databasePath)
  database.pragma('foreign_keys = ON')
  database.exec(schema)
  return database
}

function validateInput(input: StudySessionInput): StudySessionInput {
  const subjectName = input.subjectName.trim()
  const sessionDate = input.sessionDate.trim()
  const durationMinutes = Number(input.durationMinutes)

  if (!subjectName) throw new Error('Enter the session subject.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) throw new Error('Enter a valid date.')
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duration must be a whole number greater than zero.')
  }

  const concepts = (input.concepts ?? []).map((concept) => ({
    name: concept.name.trim(),
    notes: concept.notes?.trim() || undefined
  }))
  if (concepts.some((concept) => !concept.name)) throw new Error('Every concept must have a name.')

  const flashcards = (input.flashcards ?? []).map((flashcard) => ({
    type: flashcard.type,
    front: flashcard.front.trim(),
    back: flashcard.back.trim()
  }))
  if (flashcards.some((flashcard) => !['concept', 'question'].includes(flashcard.type))) {
    throw new Error('Invalid flashcard type.')
  }
  if (flashcards.some((flashcard) => !flashcard.front || !flashcard.back)) {
    throw new Error('Every flashcard must have a front and a back.')
  }

  return {
    subjectName,
    sessionDate,
    durationMinutes,
    generalNotes: input.generalNotes?.trim() || undefined,
    concepts,
    flashcards
  }
}

function getFlashcards(db: Database.Database, sessionId: number): Flashcard[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, card_type as type, front, back FROM flashcards WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as FlashcardRow[]
  return rows.map(({ id, type, front, back }) => ({ id, type, front, back }))
}

function getConcepts(db: Database.Database, sessionId: number): Concept[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, name, notes FROM concepts WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as ConceptRow[]
  return rows.map(({ id, name, notes }) => ({ id, name, notes: notes ?? undefined }))
}

function mapSession(db: Database.Database, row: SessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    sessionDate: row.sessionDate,
    durationMinutes: row.durationMinutes,
    generalNotes: row.generalNotes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    concepts: getConcepts(db, row.id),
    flashcards: getFlashcards(db, row.id)
  }
}

const sessionSelect = `
  SELECT
    study_sessions.id,
    study_sessions.subject_id as subjectId,
    subjects.name as subjectName,
    study_sessions.session_date as sessionDate,
    study_sessions.duration_minutes as durationMinutes,
    study_sessions.general_notes as generalNotes,
    study_sessions.created_at as createdAt,
    study_sessions.updated_at as updatedAt
  FROM study_sessions
  JOIN subjects ON subjects.id = study_sessions.subject_id
`

export function listSessions(): StudySession[] {
  const db = getDatabase()
  const rows = db
    .prepare(`${sessionSelect} ORDER BY session_date DESC, study_sessions.id DESC`)
    .all() as SessionRow[]
  return rows.map((row) => mapSession(db, row))
}

export function getSession(id: number): StudySession | null {
  const db = getDatabase()
  const row = db.prepare(`${sessionSelect} WHERE study_sessions.id = ?`).get(id) as
    SessionRow | undefined
  return row ? mapSession(db, row) : null
}

export function saveSession(input: StudySessionInput, id?: number): StudySession {
  const db = getDatabase()
  const data = validateInput(input)

  const transaction = db.transaction(() => {
    const subject = db
      .prepare(
        'INSERT INTO subjects (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name RETURNING id'
      )
      .get(data.subjectName) as { id: number }
    let sessionId = id

    if (sessionId) {
      const result = db
        .prepare(
          `UPDATE study_sessions SET subject_id = ?, session_date = ?, duration_minutes = ?, general_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
        .run(
          subject.id,
          data.sessionDate,
          data.durationMinutes,
          data.generalNotes ?? null,
          sessionId
        )
      if (result.changes === 0) throw new Error('Session not found.')
      db.prepare('DELETE FROM concepts WHERE session_id = ?').run(sessionId)
    } else {
      const result = db
        .prepare(
          'INSERT INTO study_sessions (subject_id, session_date, duration_minutes, general_notes) VALUES (?, ?, ?, ?)'
        )
        .run(subject.id, data.sessionDate, data.durationMinutes, data.generalNotes ?? null)
      sessionId = Number(result.lastInsertRowid)
    }

    const insertConcept = db.prepare(
      'INSERT INTO concepts (session_id, name, notes) VALUES (?, ?, ?)'
    )
    for (const concept of data.concepts)
      insertConcept.run(sessionId, concept.name, concept.notes ?? null)
    db.prepare('DELETE FROM flashcards WHERE session_id = ?').run(sessionId)
    const insertFlashcard = db.prepare(
      'INSERT INTO flashcards (session_id, card_type, front, back) VALUES (?, ?, ?, ?)'
    )
    for (const flashcard of data.flashcards)
      insertFlashcard.run(sessionId, flashcard.type, flashcard.front, flashcard.back)
    return sessionId
  })()

  const saved = getSession(Number(transaction))
  if (!saved) throw new Error('Could not save the session.')
  return saved
}

function validateFlashcard(input: FlashcardInput): FlashcardInput {
  const flashcard = {
    type: input.type,
    front: input.front.trim(),
    back: input.back.trim()
  }
  if (!['concept', 'question'].includes(flashcard.type)) throw new Error('Invalid flashcard type.')
  if (!flashcard.front || !flashcard.back)
    throw new Error('Every flashcard must have a front and a back.')
  return flashcard
}

export function listFlashcards(sessionId: number): Flashcard[] {
  const db = getDatabase()
  if (!getSession(sessionId)) throw new Error('Session not found.')
  return getFlashcards(db, sessionId)
}

export function saveFlashcard(input: FlashcardInput, sessionId: number, id?: number): Flashcard {
  const db = getDatabase()
  const flashcard = validateFlashcard(input)
  const transaction = db.transaction(() => {
    if (id) {
      const result = db
        .prepare(
          'UPDATE flashcards SET card_type = ?, front = ?, back = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND session_id = ?'
        )
        .run(flashcard.type, flashcard.front, flashcard.back, id, sessionId)
      if (result.changes === 0) throw new Error('Flashcard not found.')
      return id
    }
    const result = db
      .prepare('INSERT INTO flashcards (session_id, card_type, front, back) VALUES (?, ?, ?, ?)')
      .run(sessionId, flashcard.type, flashcard.front, flashcard.back)
    return Number(result.lastInsertRowid)
  })()
  const saved = getFlashcards(db, sessionId).find((item) => item.id === Number(transaction))
  if (!saved) throw new Error('Could not save the flashcard.')
  return saved
}

export function deleteFlashcard(sessionId: number, id: number): void {
  const db = getDatabase()
  const result = db
    .prepare('DELETE FROM flashcards WHERE id = ? AND session_id = ?')
    .run(id, sessionId)
  if (result.changes === 0) throw new Error('Flashcard not found.')
}

export function deleteSession(id: number): void {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id)
  if (result.changes === 0) throw new Error('Session not found.')
}

export function getStats(): StudyStats {
  const db = getDatabase()
  const totals = db
    .prepare(
      'SELECT COUNT(*) as totalSessions, COALESCE(SUM(duration_minutes), 0) as totalMinutes FROM study_sessions'
    )
    .get() as { totalSessions: number; totalMinutes: number }
  const concepts = db.prepare('SELECT COUNT(*) as totalConcepts FROM concepts').get() as {
    totalConcepts: number
  }
  const flashcards = db.prepare('SELECT COUNT(*) as totalFlashcards FROM flashcards').get() as {
    totalFlashcards: number
  }
  const subjectBreakdown = db
    .prepare(
      `SELECT subjects.name as subjectName, COUNT(study_sessions.id) as sessions, COALESCE(SUM(study_sessions.duration_minutes), 0) as minutes FROM subjects JOIN study_sessions ON study_sessions.subject_id = subjects.id GROUP BY subjects.id ORDER BY minutes DESC`
    )
    .all() as Array<{ subjectName: string; sessions: number; minutes: number }>

  return { ...totals, ...concepts, ...flashcards, subjectBreakdown }
}

export function closeDatabase(): void {
  database?.close()
  database = null
}
