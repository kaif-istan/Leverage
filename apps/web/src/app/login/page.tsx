'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ShieldAlert, Sparkles, User, Mail, Lock } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        const response: any = await api.post('/auth/register', { email, password, name })
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('user', JSON.stringify(response.user))
      } else {
        const response: any = await api.post('/auth/login', { email, password })
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('user', JSON.stringify(response.user))
      }
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 shadow-lg shadow-primary/10">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm text-center">
            {isRegister
              ? 'Get started with the ultimate AI job hunting engine'
              : 'Sign in to access your personalized job tracking dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isRegister && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 px-11 text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 px-11 text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 px-11 text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary hover:bg-primary/95 text-white font-medium py-3.5 rounded-xl transition-all shadow-xl shadow-primary/20 hover:shadow-primary/35 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isRegister ? 'Register' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false)
                    setError(null)
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true)
                    setError(null)
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
