import api from './client'

export interface SessionOut {
  id: number
  topic_id: number
  started_at: string
  completed_at: string | null
  cards_reviewed: number
  score: number
}

export const createSession = (topic_id: number) =>
  api.post<SessionOut>('/sessions', { topic_id }).then((r) => r.data)

export const completeSession = (sessionId: number, cards_reviewed: number, score: number) =>
  api
    .patch<SessionOut>(`/sessions/${sessionId}/complete`, { cards_reviewed, score })
    .then((r) => r.data)
