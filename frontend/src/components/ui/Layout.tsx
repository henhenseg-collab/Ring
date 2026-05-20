import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, BookOpen, Home, BarChart2, Plus, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const { darkMode, toggleDark, logout } = useAuthStore()
  const { pathname } = useLocation()

  const nav = [
    { to: '/', label: 'Home', Icon: Home },
    { to: '/import', label: 'Import', Icon: Plus },
    { to: '/progress', label: 'Progress', Icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-recall-dark/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <RecallLogo />
            <span className="font-inter font-bold text-lg text-recall-purple dark:text-recall-violet">
              Recall
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-recall-lavender text-recall-purple dark:bg-recall-purple/20 dark:text-recall-violet'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  )
}

function RecallLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="#534AB7" />
      <text x="6" y="21" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill="white">R</text>
      <circle cx="21" cy="20" r="6" fill="#7F77DD" />
      <path d="M18 20l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
