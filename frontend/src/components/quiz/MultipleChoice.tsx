import { useState } from 'react'
import type { Card } from '../../api/topics'
import Button from '../ui/Button'
import { gradeCard } from '../../api/cards'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface Props {
  card: Card
  onNext: (correct: boolean) => void
}

export default function MultipleChoice({ card, onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [grading, setGrading] = useState(false)

  const options = card.options ?? []

  const handleSelect = async (opt: string) => {
    if (selected) return
    setSelected(opt)
    const correct = opt === card.answer
    setGrading(true)
    try {
      await gradeCard(card.id, correct ? 'easy' : 'missed')
    } catch {
      toast.error('Failed to save grade')
    } finally {
      setGrading(false)
    }
  }

  const handleNext = () => {
    onNext(selected === card.answer)
    setSelected(null)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
        <span className="text-xs font-medium text-recall-purple dark:text-recall-violet uppercase tracking-wide">
          Multiple Choice
        </span>
        <p className="text-gray-900 dark:text-white text-lg font-medium mt-3">{card.question}</p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {options.map((opt) => {
          const isCorrect = opt === card.answer
          const isSelected = opt === selected
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected || grading}
              className={clsx(
                'w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium transition-all duration-200 text-sm',
                !selected
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-recall-purple hover:bg-recall-lavender/50 dark:hover:border-recall-violet'
                  : isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : isSelected
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-400',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="w-full">
          {card.explanation && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">{card.explanation}</p>
          )}
          <Button variant="primary" className="w-full" onClick={handleNext}>
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}
