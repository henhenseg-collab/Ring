import api from './client'

export type Grade = 'easy' | 'hard' | 'missed'

export interface GradeResponse {
  interval: number
  ease_factor: number
  due_date: string
  repetitions: number
}

export interface FreeGradeResponse {
  passed: boolean
  feedback: string
}

export const gradeCard = (cardId: number, grade: Grade) =>
  api.post<GradeResponse>(`/cards/${cardId}/grade`, { grade }).then((r) => r.data)

export const gradeFreeResponse = (cardId: number, student_answer: string) =>
  api.post<FreeGradeResponse>(`/cards/${cardId}/grade-free`, { student_answer }).then((r) => r.data)
