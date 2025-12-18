import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const SESSION_KEY = 'app-auth-session'
const DEFAULT_SESSION_DURATION = 3600000 // 1 hour in milliseconds (default)

/**
 * PasswordProtection Component
 *
 * Provides simple password protection for the application.
 * Note: This is NOT secure authentication. The credentials are visible in the client-side code.
 * Use this only for light protection against casual users, not for securing sensitive data.
 *
 * Environment Variables:
 * - VITE_PASSWORD_PROTECTION_ENABLED: Set to 'true' to enable password protection
 * - VITE_PASSWORD_PROTECTION_CREDENTIALS: Comma-separated username:password pairs
 *   Format: "user1:pass1,user2:pass2,user3:pass3"
 *   Example: "admin:secret123,developer:dev456"
 * - VITE_PASSWORD_PROTECTION_SESSION_DURATION: Session duration in milliseconds (optional)
 *   Default: 3600000 (1 hour)
 *   Example: "7200000" for 2 hours, "1800000" for 30 minutes
 */
export function PasswordProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if password protection is enabled
  const isEnabled = import.meta.env.VITE_PASSWORD_PROTECTION_ENABLED === 'true'
  const credentialsString = import.meta.env.VITE_PASSWORD_PROTECTION_CREDENTIALS

  // Get session duration from env var (in milliseconds), fallback to default
  const sessionDuration = import.meta.env.VITE_PASSWORD_PROTECTION_SESSION_DURATION
    ? parseInt(import.meta.env.VITE_PASSWORD_PROTECTION_SESSION_DURATION, 10)
    : DEFAULT_SESSION_DURATION

  useEffect(() => {
    // If password protection is disabled, show app immediately
    if (!isEnabled) {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // Check if there's a valid session
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (sessionData) {
      try {
        const { expiresAt } = JSON.parse(sessionData)
        if (Date.now() < expiresAt) {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        } else {
          // Session expired
          sessionStorage.removeItem(SESSION_KEY)
        }
      } catch (error) {
        // Invalid session data
        sessionStorage.removeItem(SESSION_KEY)
      }
    }

    setIsLoading(false)
  }, [isEnabled])

  const handleSubmit = e => {
    e.preventDefault()
    setError('')

    if (!credentialsString) {
      console.error('VITE_PASSWORD_PROTECTION_CREDENTIALS is not set')
      setError('パスワード保護が正しく設定されていません')
      return
    }

    // Parse credentials string format: "user1:pass1,user2:pass2"
    const credentials = credentialsString.split(',').map(pair => {
      const [user, pass] = pair.trim().split(':')
      return { username: user, password: pass }
    })

    // Check if provided credentials match any of the configured pairs
    const isValid = credentials.some(
      cred => cred.username === username && cred.password === password
    )

    if (isValid) {
      // Create session
      const sessionData = {
        expiresAt: Date.now() + sessionDuration,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
      setIsAuthenticated(true)
      setUsername('')
      setPassword('')
    } else {
      setError('ユーザー名またはパスワードが正しくありません')
      setUsername('')
      setPassword('')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Show app if authenticated or protection is disabled
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show password input form
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">パスワード認証</CardTitle>
          <CardDescription className="text-center">
            このアプリケーションにアクセスするにはパスワードが必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="ユーザー名を入力"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
          <div className="mt-4 text-xs text-gray-500 text-center">セッションは1時間有効です</div>
        </CardContent>
      </Card>
    </div>
  )
}
