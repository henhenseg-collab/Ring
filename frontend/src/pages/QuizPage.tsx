import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSessionCards } from '../api/topics'
import { createSession, completeSession } from '../api/sessions'
import { useQuizStore } from '../store/quizStore'
import FlashCard from '../components/quiz/FlashCard'
import MultipleChoice from '../components/quiz/MultipleChoice'
import FreeResponse from '../components/quiz/FreeResponse'
import ExplainPanel from '../components/explain/ExplainPanel'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { HelpCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Card } from '../api/topics'
import type { Grade } from '../api/cards'

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { cards, currentIndex, sessionId, correctCount, setCards, setSessionId, nextCard, recordCorrect, reset } =
    useQuizStore()
  const [explainCard, setExplainCard] = useState<Card | null>(null)
  const [finished, setFinished] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['session-cards', topicId],
    queryFn: () => fetchSessionCards(Number(topicId)),
    enabled: !!topicId,
  })

  useEffect(() => {
    if (data && data.length > 0) {
      setCards(data)
      reset()
      setCards(data)
      createSession(Number(topicId))
        .then((s) => setSessionId(s.id))
        .catch(() => {})
    }
  }, [data])

  const handleNext = async (gradeOrCorrect: Grade | boolean) => {
    const correct =
      typeof gradeOrCorrect === 'boolean'
        ? gradeOrCorrect
        : gradeOrCorrect === 'easy'

    if (correct) recordCorrect()

    if (currentIndex + 1 >= cards.length) {
      // Session complete
      const score = Math.round(((correctCount + (correct ? 1 : 0)) / cards.length) * 100)
      if (sessionId) {
        try {
          await completeSession(sessionId, cards.length, score)
        } catch {}
      }
      await qc.invalidateQueries({ queryKey: ['topics'] })
      await qc.invalidateQueries({ queryKey: ['progress'] })
      setFinished(true)
      toast.success('Session complete!')
    } else {
      nextCard()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg mx-auto mt-8">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {data?.length === 0 ? 'No cards due! Check back tomorrow.' : 'Failed to load cards.'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to Topics
        </Button>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((correctCount / cards.length) * 100)
    return (
      <div className="text-center py-16 max-w-sm mx-auto">
        <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="font-inter text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You got {correctCount} of {cards.length} correct ({pct}%)
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              reset()
              setFinished(false)
              qc.invalidateQueries({ queryKey: ['session-cards', topicId] })
            }}
          >
            Study Again
          </Button>
        </div>
      </div>
    )
  }

  const current = cards[currentIndex]
  const progress = ((currentIndex) / cards.length) * 100

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-recall-purple dark:hover:text-recall-violet transition-colors"
          >
            <ArrowLeft size={13} />
            Exit
          </button>
          <span>{currentIndex + 1} of {cards.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-recall-purple rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="relative">
        {current.type === 'flashcard' && (
          <FlashCard card={current} onNext={(grade) => handleNext(grade)} />
        )}
        {current.type === 'multiple_choice' && (
          <MultipleChoice card={current} onNext={(correct) => handleNext(correct)} />
        )}
        {current.type === 'free_response' && (
          <FreeResponse card={current} onNext={(correct) => handleNext(correct)} />
        )}
      </div>

      {/* Explain button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setExplainCard(current)}
          className="flex items-center gap-1.5 text-sm text-recall-purple dark:text-recall-violet hover:underline transition-colors"
        >
          <HelpCircle size={14} />
          Explain this
        </button>
      </div>

      {explainCard && (
        <ExplainPanel card={explainCard} onClose={() => setExplainCard(null)} />
      )}
    </div>
  )
}
