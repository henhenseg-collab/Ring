import clsx from 'clsx'

interface Props {
  activeDays: string[]
}

export default function StreakCalendar({ activeDays }: Props) {
  const days: string[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  const activeSet = new Set(activeDays)

  return (
    <div>
      <h2 className="font-inter font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
        Last 30 Days
      </h2>
      <div className="flex gap-1 flex-wrap">
        {days.map((day) => (
          <div
            key={day}
            title={day}
            className={clsx(
              'w-6 h-6 rounded-md transition-colors',
              activeSet.has(day)
                ? 'bg-recall-purple dark:bg-recall-violet'
                : 'bg-gray-100 dark:bg-gray-700',
            )}
          />
        ))}
      </div>
    </div>
  )
}
