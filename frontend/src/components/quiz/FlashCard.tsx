import { useState } from 'react'
import type { Card } from '../../api/topics'
import Button from '../ui/Button'
import { gradeCard, type Grade } from '../../api/cards'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface Props {
  card: Card
  onNext: (grade: Grade) => void
}

export default function FlashCard({ card, onNext }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [grading, setGrading] = useState(false)

  const handleGrade = async (grade: Grade) => {
    setGrading(true)
    try {
      await gradeCard(card.id, grade)
      onNext(grade)
      setFlipped(false)
    } catch {
      toast.error('Failed to save grade')
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card flip */}
      <div
        className="w-full max-w-lg h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-medium text-recall-purple dark:text-recall-violet uppercase tracking-wide mb-4">
              Question
            </span>
            <p className="text-gray-900 dark:text-white text-lg font-medium">{card.question}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-recall-lavender dark:bg-recall-purple/10 rounded-2xl shadow-lg border border-recall-violet/30 flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-medium text-recall-purple dark:text-recall-violet uppercase tracking-wide mb-4">
              Answer
            </span>
            <p className="text-gray-900 dark:text-white text-lg font-medium">{card.answer}</p>
            {card.explanation && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">{card.explanation}</p>
            )}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => handleGrade('missed')}
            disabled={grading}
            size="md"
          >
            Missed
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleGrade('hard')}
            disabled={grading}
            size="md"
          >
            Hard
          </Button>
          <Button
            variant="primary"
            onClick={() => handleGrade('easy')}
            disabled={grading}
            size="md"
          >
            Easy
          </Button>
        </div>
      )}
    </div>
  )
}
