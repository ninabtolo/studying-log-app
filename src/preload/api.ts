import { contextBridge, ipcRenderer } from 'electron'
import type {
  Flashcard,
  FlashcardInput,
  StudySession,
  StudySessionInput,
  StudyStats
} from '../main/database'

export type {
  ConceptInput,
  Flashcard,
  FlashcardInput,
  FlashcardType,
  StudySession,
  StudySessionInput,
  StudyStats
} from '../main/database'

export type StudyLogApi = {
  listSessions: () => Promise<StudySession[]>
  getSession: (id: number) => Promise<StudySession | null>
  saveSession: (input: StudySessionInput, id?: number) => Promise<StudySession>
  deleteSession: (id: number) => Promise<void>
  listFlashcards: (sessionId: number) => Promise<Flashcard[]>
  saveFlashcard: (sessionId: number, input: FlashcardInput, id?: number) => Promise<Flashcard>
  deleteFlashcard: (sessionId: number, id: number) => Promise<void>
  getStats: () => Promise<StudyStats>
}

const api: StudyLogApi = {
  listSessions: () => ipcRenderer.invoke('study-sessions:list'),
  getSession: (id) => ipcRenderer.invoke('study-sessions:get', id),
  saveSession: (input, id) => ipcRenderer.invoke('study-sessions:save', input, id),
  deleteSession: (id) => ipcRenderer.invoke('study-sessions:delete', id),
  listFlashcards: (sessionId) => ipcRenderer.invoke('flashcards:list', sessionId),
  saveFlashcard: (sessionId, input, id) =>
    ipcRenderer.invoke('flashcards:save', sessionId, input, id),
  deleteFlashcard: (sessionId, id) => ipcRenderer.invoke('flashcards:delete', sessionId, id),
  getStats: () => ipcRenderer.invoke('study-sessions:stats')
}

export function exposeApi(): void {
  if (process.contextIsolated) contextBridge.exposeInMainWorld('api', api)
  else (window as unknown as Window & { api: StudyLogApi }).api = api
}
