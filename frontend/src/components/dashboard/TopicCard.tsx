import { Link } from 'react-router-dom'
import { BookOpen, Calendar, Zap } from 'lucide-react'
import type { Topic } from '../../api/topics'
import clsx from 'clsx'

export default function TopicCard({ topic }: { topic: Topic }) {
  const mastery = topic.mastery_pct

  return (
    <Link
      to={`/quiz/${topic.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-inter font-semibold text-gray-900 dark:text-white group-hover:text-recall-purple dark:group-hover:text-recall-violet transition-colors">
            {topic.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{topic.card_count} cards</p>
        </div>
        {topic.due_count > 0 && (
          <span className="bg-recall-lavender text-recall-purple dark:bg-recall-purple/20 dark:text-recall-violet text-xs font-semibold px-2 py-1 rounded-full">
            {topic.due_count} due
          </span>
        )}
      </div>

      {/* Mastery bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Mastery</span>
          <span>{mastery}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              mastery >= 80
                ? 'bg-green-500'
                : mastery >= 50
                  ? 'bg-recall-violet'
                  : 'bg-recall-purple',
            )}
            style={{ width: `${mastery}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        {topic.last_studied && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {topic.last_studied}
          </span>
        )}
      </div>
    </Link>
  )
}
