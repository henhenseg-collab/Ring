import api from './client'

export interface Topic {
  id: number
  name: string
  created_at: string
  card_count: number
  mastery_pct: number
  due_count: number
  last_studied: string | null
}

export interface Card {
  id: number
  type: 'flashcard' | 'multiple_choice' | 'free_response'
  question: string
  answer: string
  explanation: string | null
  options: string[] | null
  interval: number
  ease_factor: number
  due_date: string | null
  repetitions: number
}

export const fetchTopics = () => api.get<Topic[]>('/topics').then((r) => r.data)

export const fetchCards = (topicId: number) =>
  api.get<Card[]>(`/topics/${topicId}/cards`).then((r) => r.data)

export const fetchSessionCards = (topicId: number) =>
  api.get<Card[]>(`/topics/${topicId}/session`).then((r) => r.data)
