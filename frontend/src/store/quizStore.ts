import { create } from 'zustand'
import type { Card } from '../api/topics'

interface QuizState {
  cards: Card[]
  currentIndex: number
  sessionId: number | null
  correctCount: number
  setCards: (cards: Card[]) => void
  setSessionId: (id: number) => void
  nextCard: () => void
  recordCorrect: () => void
  reset: () => void
}

export const useQuizStore = create<QuizState>((set) => ({
  cards: [],
  currentIndex: 0,
  sessionId: null,
  correctCount: 0,
  setCards: (cards) => set({ cards, currentIndex: 0, correctCount: 0 }),
  setSessionId: (sessionId) => set({ sessionId }),
  nextCard: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  recordCorrect: () => set((s) => ({ correctCount: s.correctCount + 1 })),
  reset: () => set({ cards: [], currentIndex: 0, sessionId: null, correctCount: 0 }),
}))
