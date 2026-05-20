import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTopics } from '../api/topics'
import { fetchProgress } from '../api/progress'
import TopicCard from '../components/dashboard/TopicCard'
import StreakCalendar from '../components/dashboard/StreakCalendar'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import { Plus, TrendingDown } from 'lucide-react'

export default function HomePage() {
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
  })
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: fetchProgress,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-inter text-2xl font-bold text-gray-900 dark:text-white">Your Topics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {topics?.length ?? 0} topic{topics?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/import">
          <Button variant="primary" size="sm">
            <Plus size={15} />
            New Topic
          </Button>
        </Link>
      </div>

      {/* Streak calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        {progressLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <StreakCalendar activeDays={progress?.streak_days ?? []} />
        )}
      </div>

      {/* Topic grid */}
      {topicsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : topics?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">No topics yet.</p>
          <Link to="/import">
            <Button variant="primary">Create your first topic</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics?.map((t) => <TopicCard key={t.id} topic={t} />)}
        </div>
      )}

      {/* Weak spots */}
      {progress?.weak_spots && progress.weak_spots.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-orange-500" />
            <h2 className="font-inter font-semibold text-sm text-gray-700 dark:text-gray-300">
              Weak Spots
            </h2>
          </div>
          <div className="space-y-2">
            {progress.weak_spots.map((ws) => (
              <div
                key={ws.card_id}
                className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{ws.question}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{ws.topic_name}</p>
                </div>
                <span className="text-xs font-medium text-orange-500 shrink-0">
                  EF {ws.ease_factor.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
