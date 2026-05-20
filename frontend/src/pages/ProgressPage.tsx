import { useQuery } from '@tanstack/react-query'
import { fetchProgress } from '../api/progress'
import StreakCalendar from '../components/dashboard/StreakCalendar'
import Skeleton from '../components/ui/Skeleton'
import { TrendingDown, Award, BookOpen, Flame } from 'lucide-react'

export default function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: fetchProgress,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Cards',
      value: data?.total_cards ?? 0,
      Icon: BookOpen,
      color: 'text-recall-purple dark:text-recall-violet',
      bg: 'bg-recall-lavender dark:bg-recall-purple/20',
    },
    {
      label: 'Mastered',
      value: data?.mastered_cards ?? 0,
      Icon: Award,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Mastery',
      value: `${data?.mastery_pct ?? 0}%`,
      Icon: Award,
      color: 'text-recall-purple dark:text-recall-violet',
      bg: 'bg-recall-lavender dark:bg-recall-purple/20',
    },
    {
      label: 'Sessions (30d)',
      value: data?.sessions_last_30 ?? 0,
      Icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-inter text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <p className="font-inter font-bold text-xl text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <StreakCalendar activeDays={data?.streak_days ?? []} />
      </div>

      {/* Mastery bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="font-inter font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Overall Mastery</h2>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-recall-purple rounded-full transition-all duration-700"
            style={{ width: `${data?.mastery_pct ?? 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          <span>{data?.mastered_cards ?? 0} mastered</span>
          <span>{data?.total_cards ?? 0} total</span>
        </div>
      </div>

      {/* Weak spots */}
      {data?.weak_spots && data.weak_spots.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} className="text-orange-500" />
            <h2 className="font-inter font-semibold text-sm text-gray-700 dark:text-gray-300">
              Needs Work
            </h2>
          </div>
          <div className="space-y-3">
            {data.weak_spots.map((ws, i) => (
              <div key={ws.card_id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ws.question}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{ws.topic_name}</span>
                    <span className="text-xs text-orange-500">EF: {ws.ease_factor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
