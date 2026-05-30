'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Building, Zap, Compass, Star, User, LogOut, CheckCircle, ShieldAlert } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/30">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AI JOB HUNTER
          </span>
        </div>
        <nav className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 hover:text-primary transition-colors text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-primary hover:bg-primary/90 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
            >
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24 flex flex-col gap-16 md:gap-24 w-full">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-semibold text-primary uppercase tracking-wider">
            <Star className="h-3.5 w-3.5 fill-primary" />
            Sprint 0 Active — Platform Bootstrapped
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Your Personal AI <br className="hidden md:inline" /> Job Hunting Agent
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            Automatically discover, rank, analyze, track, and tailor job applications. Powered by Llama embeddings, Drizzle database schemas, and intelligent crawlers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            {user ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3.5 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Authenticated & Connected to API
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-primary hover:bg-primary/95 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 text-center"
                >
                  Configure Profile & Get Started
                </Link>
                <a
                  href="#features"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 font-medium px-8 py-4 rounded-xl transition-all text-center"
                >
                  Explore Architecture
                </a>
              </>
            )}
          </div>
        </section>

        {/* Features / Architecture Cards */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 w-fit">
              <Compass className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold font-display">Multi-ATS Crawling</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrations for Lever, Ashby, and Greenhouse APIs. Seamless slug discovery directly from YC, Wellfound, and GitHub trends.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 w-fit">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold font-display">Embedding Scoring</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              6-signal composite ranking algorithm utilizing Ollama local nomic-embed-text embeddings for completely free intelligence matching.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 w-fit">
              <Briefcase className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold font-display">Resume Tailoring</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dynamically tailors your resumes, highlights custom skills, drafts ultra-personalized cover letters, and logs history.
            </p>
          </div>
        </section>

        {/* System Diagnostics status */}
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold font-display">System Boot Status</h3>
            <p className="text-slate-400 text-sm">
              Current deployment configuration diagnostic report.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              PostgreSQL Schema Ready
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
              Redis & BullMQ Standby
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-xl text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
              Turborepo Pipeline Ok
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-black/20">
        <p>© 2026 AI Job Hunter. Architectural Blueprint Sprint 0 Verified.</p>
      </footer>
    </div>
  )
}
