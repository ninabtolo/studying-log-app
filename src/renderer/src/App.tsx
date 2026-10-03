import { useEffect, useState } from 'react'
import type {
  ConceptInput,
  Flashcard,
  FlashcardInput,
  StudySession,
  StudySessionInput,
  StudyStats
} from '../../preload/api'

const today = new Date().toISOString().slice(0, 10)
const emptyForm: StudySessionInput = {
  subjectName: '',
  sessionDate: today,
  durationMinutes: 30,
  generalNotes: '',
  concepts: [{ name: '', notes: '' }],
  flashcards: []
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours}h ${remaining ? `${remaining}min` : ''}` : `${minutes}min`
}

function App(): React.JSX.Element {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [form, setForm] = useState<StudySessionInput>(emptyForm)
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<string, boolean>>({})
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [selectedFlashcardBack, setSelectedFlashcardBack] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = async (): Promise<void> => {
    const [nextSessions, nextStats] = await Promise.all([
      window.api.listSessions(),
      window.api.getStats()
    ])
    setSessions(nextSessions)
    setStats(nextStats)
  }

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        await refresh()
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not load the study data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!selectedFlashcard) return
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setSelectedFlashcard(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFlashcard])

  const updateConcept = (index: number, field: keyof ConceptInput, value: string): void => {
    setForm((current) => ({
      ...current,
      concepts: current.concepts.map((concept, conceptIndex) =>
        conceptIndex === index ? { ...concept, [field]: value } : concept
      )
    }))
  }
  const updateFlashcard = (index: number, field: keyof FlashcardInput, value: string): void => {
    setForm((current) => ({
      ...current,
      flashcards: current.flashcards.map((flashcard, flashcardIndex) =>
        flashcardIndex === index ? { ...flashcard, [field]: value } : flashcard
      )
    }))
  }
  const resetForm = (): void => {
    setForm({ ...emptyForm, concepts: [{ name: '', notes: '' }], flashcards: [] })
    setEditingId(undefined)
    setError('')
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await window.api.saveSession(form, editingId)
      await refresh()
      resetForm()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the session.')
    } finally {
      setSaving(false)
    }
  }

  const edit = (session: StudySession): void => {
    setEditingId(session.id)
    setForm({
      subjectName: session.subjectName,
      sessionDate: session.sessionDate,
      durationMinutes: session.durationMinutes,
      generalNotes: session.generalNotes ?? '',
      concepts: session.concepts.length
        ? session.concepts.map(({ name, notes }) => ({ name, notes: notes ?? '' }))
        : [{ name: '', notes: '' }],
      flashcards: session.flashcards.map(({ type, front, back }) => ({ type, front, back }))
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (id: number): Promise<void> => {
    if (!window.confirm('Delete this session and its concepts?')) return
    try {
      await window.api.deleteSession(id)
      if (editingId === id) resetForm()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete the session.')
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">STUDY LOG</p>
          <h1>{editingId ? 'Edit study session' : 'New study session'}</h1>
          <p className="muted">Record sessions, concepts, notes, and review cards in one place.</p>
        </div>
        {editingId && (
          <button className="button secondary" onClick={resetForm}>
            Cancel edit
          </button>
        )}
      </header>
      <section className="content-grid">
        <form className="card form-card" onSubmit={submit}>
          <div className="section-heading">
            <h2>Session details</h2>
            <span className="required">* required</span>
          </div>
          <label>
            Subject *
            <input
              value={form.subjectName}
              onChange={(event) => setForm({ ...form, subjectName: event.target.value })}
              placeholder="e.g. Databases"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Date *
              <input
                type="date"
                value={form.sessionDate}
                onChange={(event) => setForm({ ...form, sessionDate: event.target.value })}
                required
              />
            </label>
            <label>
              Duration (minutes) *
              <input
                type="number"
                min="1"
                step="1"
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm({ ...form, durationMinutes: Number(event.target.value) })
                }
                required
              />
            </label>
          </div>
          <label>
            General notes
            <textarea
              value={form.generalNotes ?? ''}
              onChange={(event) => setForm({ ...form, generalNotes: event.target.value })}
              placeholder="How did the session go?"
              rows={3}
            />
          </label>
          <div className="section-heading concepts-heading">
            <h2>Studied concepts</h2>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm({ ...form, concepts: [...form.concepts, { name: '', notes: '' }] })
              }
            >
              + add
            </button>
          </div>
          <div className="concept-list">
            {form.concepts.map((concept, index) => (
              <div className="concept-row" key={index}>
                <input
                  value={concept.name}
                  onChange={(event) => updateConcept(index, 'name', event.target.value)}
                  placeholder="Concept name"
                  aria-label={`Concept name ${index + 1}`}
                />
                <input
                  value={concept.notes ?? ''}
                  onChange={(event) => updateConcept(index, 'notes', event.target.value)}
                  placeholder="Concept note"
                  aria-label={`Concept note ${index + 1}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setForm({
                      ...form,
                      concepts: form.concepts.filter((_, itemIndex) => itemIndex !== index)
                    })
                  }
                  aria-label="Remove concept"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="section-heading concepts-heading">
            <h2>Review flashcards</h2>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setForm({
                  ...form,
                  flashcards: [...form.flashcards, { type: 'concept', front: '', back: '' }]
                })
              }
            >
              + add
            </button>
          </div>
          <div className="flashcard-list">
            {form.flashcards.map((flashcard, index) => (
              <div className="flashcard-row" key={index}>
                <select
                  value={flashcard.type}
                  onChange={(event) =>
                    updateFlashcard(index, 'type', event.target.value as FlashcardInput['type'])
                  }
                  aria-label={`Flashcard type ${index + 1}`}
                >
                  <option value="concept">Concept</option>
                  <option value="question">Question</option>
                </select>
                <input
                  value={flashcard.front}
                  onChange={(event) => updateFlashcard(index, 'front', event.target.value)}
                  placeholder={flashcard.type === 'concept' ? 'Keyword' : 'Question'}
                  aria-label={`Flashcard front ${index + 1}`}
                />
                <input
                  value={flashcard.back}
                  onChange={(event) => updateFlashcard(index, 'back', event.target.value)}
                  placeholder={flashcard.type === 'concept' ? 'Brief definition' : 'Answer'}
                  aria-label={`Flashcard back ${index + 1}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setForm({
                      ...form,
                      flashcards: form.flashcards.filter((_, itemIndex) => itemIndex !== index)
                    })
                  }
                  aria-label="Remove flashcard"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update session' : 'Save session'}
          </button>
        </form>
        <aside className="summary-column">
          <div className="summary-grid">
            <div className="card metric">
              <span>Sessions</span>
              <strong>{stats?.totalSessions ?? 0}</strong>
            </div>
            <div className="card metric">
              <span>Tempo total</span>
              <strong>{formatDuration(stats?.totalMinutes ?? 0)}</strong>
            </div>
            <div className="card metric">
              <span>Concepts</span>
              <strong>{stats?.totalConcepts ?? 0}</strong>
            </div>
            <div className="card metric">
              <span>Flashcards</span>
              <strong>{stats?.totalFlashcards ?? 0}</strong>
            </div>
          </div>
          <div className="card breakdown">
            <div className="section-heading">
              <h2>Totals by subject</h2>
            </div>
            {stats?.subjectBreakdown.length ? (
              stats.subjectBreakdown.map((item) => (
                <div className="breakdown-row" key={item.subjectName}>
                  <span>{item.subjectName}</span>
                  <span>
                    {item.sessions} {item.sessions === 1 ? 'session' : 'sessions'} ·{' '}
                    {formatDuration(item.minutes)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No data yet.</p>
            )}
          </div>
        </aside>
      </section>
      <section className="history-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECORDS</p>
            <h2>Study history</h2>
          </div>
          <span className="muted">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        {loading ? (
          <div className="card empty-state">Loading study history...</div>
        ) : sessions.length === 0 ? (
          <div className="card empty-state">No study sessions yet.</div>
        ) : (
          <div className="history-list">
            {sessions.map((session) => (
              <article className="card session-card" key={session.id}>
                <div className="session-main">
                  <div className="session-meta">
                    <span className="date">
                      {new Date(`${session.sessionDate}T12:00:00`).toLocaleDateString('en-US')}
                    </span>
                    <span>{formatDuration(session.durationMinutes)}</span>
                  </div>
                  <h3>{session.subjectName}</h3>
                  {session.generalNotes && <p className="session-notes">{session.generalNotes}</p>}
                  <div className="tag-list">
                    {session.concepts.map((concept, conceptIndex) => (
                      <span
                        className="tag"
                        title={concept.notes}
                        key={`${session.id}-${conceptIndex}`}
                      >
                        {concept.name}
                      </span>
                    ))}
                  </div>
                  {session.flashcards.length > 0 && (
                    <div className="flashcard-viewers">
                      <p className="session-notes">
                        {session.flashcards.length}{' '}
                        {session.flashcards.length === 1 ? 'review flashcard' : 'review flashcards'}
                      </p>
                      {session.flashcards.map((flashcard, flashcardIndex) => {
                        const flashcardKey = `${session.id}-${flashcard.id ?? flashcardIndex}`
                        const showingBack = flippedFlashcards[flashcardKey] ?? false
                        return (
                          <div
                            className="flashcard-viewer"
                            key={flashcardKey}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedFlashcard(flashcard)
                              setSelectedFlashcardBack(false)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                setSelectedFlashcard(flashcard)
                                setSelectedFlashcardBack(false)
                              }
                            }}
                          >
                            <div className="flashcard-viewer-meta">
                              <span>{flashcard.type === 'concept' ? 'Concept' : 'Question'}</span>
                              <span>{showingBack ? 'Back' : 'Front'}</span>
                            </div>
                            <div className="flashcard-face">
                              {showingBack ? flashcard.back : flashcard.front}
                            </div>
                            <button
                              className="text-button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setFlippedFlashcards((current) => ({
                                  ...current,
                                  [flashcardKey]: !showingBack
                                }))
                              }}
                            >
                              {showingBack ? 'Show front' : 'Show answer'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="session-actions">
                  <button className="text-button" onClick={() => edit(session)}>
                    Edit
                  </button>
                  <button className="text-button danger" onClick={() => remove(session.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selectedFlashcard && (
        <div className="modal-backdrop" onClick={() => setSelectedFlashcard(null)}>
          <div
            className="flashcard-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Flashcard viewer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flashcard-modal-header">
              <span className="eyebrow">
                {selectedFlashcard.type === 'concept' ? 'CONCEPT' : 'QUESTION'}
              </span>
              <button
                className="close-button"
                onClick={() => setSelectedFlashcard(null)}
                aria-label="Close flashcard viewer"
              >
                ×
              </button>
            </div>
            <span className="flashcard-side-label">{selectedFlashcardBack ? 'Back' : 'Front'}</span>
            <div className="flashcard-modal-face">
              {selectedFlashcardBack ? selectedFlashcard.back : selectedFlashcard.front}
            </div>
            <button
              className="button primary"
              onClick={() => setSelectedFlashcardBack((current) => !current)}
            >
              {selectedFlashcardBack ? 'Show front' : 'Show answer'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
