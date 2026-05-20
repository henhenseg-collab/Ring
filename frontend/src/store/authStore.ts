import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  darkMode: boolean
  setToken: (token: string | null) => void
  toggleDark: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      darkMode: false,
      setToken: (token) => {
        if (token) localStorage.setItem('recall_token', token)
        else localStorage.removeItem('recall_token')
        set({ token })
      },
      toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
      logout: () => {
        localStorage.removeItem('recall_token')
        set({ token: null })
      },
    }),
    { name: 'recall-auth', partialize: (s) => ({ token: s.token, darkMode: s.darkMode }) },
  ),
)
