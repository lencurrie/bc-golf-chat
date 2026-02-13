'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/chat')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#1a1d21]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
      
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-green-500/25">
            <span className="text-3xl font-bold text-white">BC</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-1">Sign in to BC Golf Safaris Chat</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#222529] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          New to the team?{' '}
          <Link href="/signup" className="text-green-400 hover:text-green-300 font-medium">
            Create an account
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            BC Golf Safaris Team Chat
          </p>
        </div>
      </div>
    </div>
  )
}
