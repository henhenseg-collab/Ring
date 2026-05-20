import { useState } from 'react'
import type { Card } from '../../api/topics'
import Button from '../ui/Button'
import { gradeFreeResponse } from '../../api/cards'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props {
  card: Card
  onNext: (correct: boolean) => void
}

export default function FreeResponse({ card, onNext }: Props) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<{ passed: boolean; feedback: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await gradeFreeResponse(card.id, answer)
      setResult({ passed: res.passed, feedback: res.feedback })
    } catch {
      toast.error('Grading failed — check your connection')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    onNext(result?.passed ?? false)
    setAnswer('')
    setResult(null)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <span className="text-xs font-medium text-recall-purple dark:text-recall-violet uppercase tracking-wide">
          Free Response
        </span>
        <p className="text-gray-900 dark:text-white text-lg font-medium mt-3">{card.question}</p>
      </div>

      <div className="w-full">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!result || loading}
          rows={4}
          placeholder="Type your answer here..."
          className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-recall-purple dark:focus:border-recall-violet resize-none transition-colors"
        />
      </div>

      {result ? (
        <div
          className={clsx(
            'w-full rounded-xl p-4 border',
            result.passed
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 text-orange-700 dark:text-orange-400',
          )}
        >
          <p className="font-semibold text-sm mb-1">{result.passed ? '✓ Correct!' : '× Not quite'}</p>
          <p className="text-sm">{result.feedback}</p>
          {!result.passed && (
            <p className="text-xs mt-2 opacity-75">
              <strong>Answer:</strong> {card.answer}
            </p>
          )}
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          loading={loading}
          disabled={!answer.trim()}
        >
          Submit Answer
        </Button>
      )}

      {result && (
        <Button variant="primary" className="w-full" onClick={handleNext}>
          Next →
        </Button>
      )}
    </div>
  )
}
