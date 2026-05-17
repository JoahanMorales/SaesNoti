import { useState, useCallback } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import type { LoginResult } from './types'

export default function App() {
  const [session, setSession] = useState<LoginResult | null>(null)

  const handleLogin = useCallback((result: LoginResult) => {
    setSession(result)
  }, [])

  const handleLogout = useCallback(() => {
    setSession(null)
  }, [])

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <Dashboard session={session} onLogout={handleLogout} />
}
