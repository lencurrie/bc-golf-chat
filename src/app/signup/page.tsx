'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Sparkles, Check } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // First, create the account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Then sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Account created but failed to sign in. Please try logging in.')
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5" />
      
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <span className="text-3xl font-bold text-white">BC</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Join the team</h1>
          <p className="text-gray-400 mt-1">Create your BC Golf Chat account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-[#222529] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="••••••••"
                minLength={6}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Minimum 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
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
