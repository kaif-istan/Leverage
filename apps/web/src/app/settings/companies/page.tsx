'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building,
  RefreshCw,
  Zap,
  Plus,
  Search,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import api from '@/lib/api'

export default function CompaniesSettingsPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyUrl, setNewCompanyUrl] = useState('')
  const [probing, setProbing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [scrapingMap, setScrapingMap] = useState<Record<string, boolean>>({})

  const fetchStatsAndCompanies = async () => {
    setLoading(true)
    try {
      const compData: any = await api.get('/companies')
      const statsData: any = await api.get('/companies/stats')
      setCompanies(compData || [])
      setStats(statsData || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatsAndCompanies()
  }, [])

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setProbing(true)
    setMessage(null)

    try {
      const res: any = await api.post('/companies/probe', {
        name: newCompanyName,
        websiteUrl: newCompanyUrl || undefined,
      })

      if (res.success) {
        setMessage({
          type: 'success',
          text: `🎉 Successfully verified! Monitored ${newCompanyName} via ${res.data.atsPlatform} (${res.data.atsSlug}).`,
        })
        setNewCompanyName('')
        setNewCompanyUrl('')
        fetchStatsAndCompanies()
      } else {
        setMessage({
          type: 'error',
          text: res.message || 'Could not verify active Greenhouse, Lever, or Ashby job page.',
        })
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to verify company platform.',
      })
    } finally {
      setProbing(false)
    }
  }

  const triggerDiscovery = async (type: 'yc' | 'wellfound') => {
    try {
      await api.post(`/companies/trigger-${type}`, {})
      setMessage({
        type: 'success',
        text: `🚀 Background scan started for ${type === 'yc' ? 'YC Startup Index' : 'Wellfound Curated List'}. Check statistics in a minute!`,
      })
      setTimeout(fetchStatsAndCompanies, 3000)
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleScrape = async (companyId: string, name: string) => {
    setScrapingMap((prev) => ({ ...prev, [companyId]: true }))
    setMessage(null)

    try {
      await api.post(`/jobs/scrape/${companyId}`, {})
      setMessage({
        type: 'success',
        text: `🎉 Successfully crawled and synced active job listings for ${name}!`,
      })
      // Refresh the stats too
      const statsData: any = await api.get('/companies/stats')
      setStats(statsData || null)
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.message || `Failed to sync jobs for ${name}.`,
      })
    } finally {
      setScrapingMap((prev) => ({ ...prev, [companyId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/jobs"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Job Board
        </Link>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold font-display tracking-tight text-white">
            AI JOB HUNTER
          </span>
        </div>
      </header>

      {/* Dashboard layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 flex flex-col lg:flex-row gap-8">
        {/* Left column: Add Monitored / Trigger Crawlers */}
        <div className="flex-1 lg:max-w-md flex flex-col gap-6">
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <h2 className="text-xl font-bold font-display text-white">Add Monitored Company</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Input any tech company. Our verification service will probe Greenhouse, Lever, and
              Ashby endpoints in real-time, register their slugs, and pull their job postings.
            </p>

            {message && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleManualAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Website URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. linear.app"
                  value={newCompanyUrl}
                  onChange={(e) => setNewCompanyUrl(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-white"
                />
              </div>

              <button
                type="submit"
                disabled={probing}
                className="bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                {probing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add & Probe Platform
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trigger auto disc */}
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <h2 className="text-xl font-bold font-display text-white">Platform Scan Triggers</h2>
            <p className="text-slate-400 text-xs">
              Manually trigger background scrapers to discover startups from public directories and
              enqueue them for slug probing.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => triggerDiscovery('yc')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-primary" /> Sync YC algolia
              </button>
              <button
                onClick={() => triggerDiscovery('wellfound')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-primary" /> Sync Wellfound
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Monitored Startups stats and list */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Stats widgets */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Verified Active
                </span>
                <span className="text-2xl font-bold text-white">{stats.monitoredCount}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Queue Total
                </span>
                <span className="text-2xl font-bold text-white">{stats.queue.total}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Queue Confirmed
                </span>
                <span className="text-2xl font-bold text-emerald-400">{stats.queue.confirmed}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Queue Pending
                </span>
                <span className="text-2xl font-bold text-indigo-400">{stats.queue.pending}</span>
              </div>
            </div>
          )}

          {/* Companies List */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex-1 flex flex-col gap-4">
            <h2 className="text-2xl font-bold font-display text-white">
              Monitored Startup Directory
            </h2>

            {loading ? (
              <div className="flex flex-col gap-3 py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/[0.01] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No monitored companies yet. Add one on the left to start!
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto flex flex-col gap-3 pr-2">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{c.name}</h4>
                        <span className="text-[10px] text-slate-500 capitalize bg-slate-900 border border-white/5 px-2 py-0.5 rounded">
                          {c.atsPlatform} API: <span className="font-semibold">{c.atsSlug}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Monitored
                      </span>
                      <button
                        onClick={() => handleScrape(c.id, c.name)}
                        disabled={scrapingMap[c.id]}
                        className="bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 text-slate-300 hover:text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${scrapingMap[c.id] ? 'animate-spin text-primary' : ''}`}
                        />
                        {scrapingMap[c.id] ? 'Syncing...' : 'Sync Jobs'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
