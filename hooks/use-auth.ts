"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"

interface User {
  id: number
  username: string
  email?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const { data, error, mutate } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  useEffect(() => {
    if (data) {
      if (data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        })
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.error || "Authentication failed",
        })
      }
    } else if (error) {
      setAuthState({
        user: null,
        loading: false,
        error: "Failed to verify authentication",
      })
    }
  }, [data, error])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setAuthState({
          user: result.user,
          loading: false,
          error: null,
        })
        mutate() // Revalidate the auth state
        return true
      } else {
        setAuthState((prev) => ({
          ...prev,
          error: result.error || "Login failed",
        }))
        return false
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        error: "Network error during login",
      }))
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      setAuthState({
        user: null,
        loading: false,
        error: null,
      })
      mutate() // Revalidate the auth state
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user,
  }
}
