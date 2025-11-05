import { useState, useEffect } from 'react'
import liff from '@line/liff'

export const useLiff = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID

        if (!liffId) {
          throw new Error('LIFF IDが設定されていません')
        }

        await liff.init({ liffId })

        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile()
          const idToken = liff.getIDToken()

          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
            idToken
          })
          setIsLoggedIn(true)
        }
      } catch (err) {
        console.error('LIFF初期化エラー:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeLiff()
  }, [])

  const login = () => {
    liff.login()
  }

  const logout = () => {
    liff.logout()
    setIsLoggedIn(false)
    setProfile(null)
  }

  return {
    isLoggedIn,
    profile,
    loading,
    error,
    login,
    logout
  }
}
