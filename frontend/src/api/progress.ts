import api from './client'

export interface WeakCard {
  card_id: number
  question: string
  ease_factor: number
  topic_name: string
}

export interface ProgressData {
  total_cards: number
  mastered_cards: number
  mastery_pct: number
  streak_days: string[]
  weak_spots: WeakCard[]
  sessions_last_30: number
}

export const fetchProgress = () => api.get<ProgressData>('/progress').then((r) => r.data)
