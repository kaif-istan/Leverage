'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  MapPin,
  Compass,
  Search,
  Filter,
  RefreshCw,
  Zap,
  ExternalLink,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import api from '@/lib/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationType, setLocationType] = useState('')
  const [seniority, setSeniority] = useState('')
  const [sort, setSort] = useState('opportunityScore')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/jobs', {
        params: {
          page,
          search,
          locationType,
          seniority,
          sort,
          limit: 15,
        },
      })
      setJobs(res.jobs || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [page, locationType, seniority, sort])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const handleGlobalRefresh = async () => {
    setRefreshing(true)
    try {
      await api.post('/jobs/recompute-ranks')
      await fetchJobs()
    } catch (err) {
      console.error('Failed to recompute global ranks:', err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Dynamic Background lights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-primary/20 p-2.5 rounded-xl border border-primary/30 flex items-center justify-center"
          >
            <Zap className="h-5 w-5 text-primary" />
          </Link>
          <span className="text-lg font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            AI JOB HUNTER
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/jobs" className="text-primary font-semibold text-sm">
            Discover
          </Link>
          <Link
            href="/settings/companies"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            Monitored Startups
          </Link>
          <Link
            href="/settings/preferences"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Match Weights
          </Link>
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            Home
          </Link>
        </nav>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              Personalized Recommendations
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Active startup roles ranked by your strategic career Opportunity Score.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGlobalRefresh}
              disabled={refreshing}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Re-scoring Feed...' : 'Sync Ranks'}
            </button>
            <div className="text-xs bg-slate-900 border border-white/5 px-4 py-2.5 rounded-xl text-slate-400">
              Total active listings: <span className="font-semibold text-primary">{total}</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search roles, titles, or technical skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-white"
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={locationType}
                onChange={(e) => {
                  setLocationType(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-slate-300 appearance-none cursor-pointer pr-10"
              >
                <option value="">Any Location</option>
                <option value="remote">Fully Remote</option>
                <option value="hybrid">Hybrid Work</option>
                <option value="onsite">Onsite Only</option>
              </select>
            </div>

            <div className="relative flex-1 md:flex-none">
              <select
                value={seniority}
                onChange={(e) => {
                  setSeniority(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-slate-300 appearance-none cursor-pointer pr-10"
              >
                <option value="">Any Seniority</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="staff">Staff/Principal</option>
                <option value="lead">Tech Lead</option>
                <option value="manager">Engineering Manager</option>
              </select>
            </div>

            <div className="relative flex-1 md:flex-none">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-slate-300 appearance-none cursor-pointer pr-10"
              >
                <option value="opportunityScore">Sort: Opportunity Score</option>
                <option value="overallScore">Sort: Match Score</option>
                <option value="postedAt">Sort: Date Posted</option>
                <option value="salary">Sort: Highest Salary</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </form>

        {/* Jobs List */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass p-16 rounded-3xl text-center border border-white/5 flex flex-col items-center gap-4">
            <div className="bg-slate-900 p-4 rounded-full border border-white/15 w-fit">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">No openings found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find matches matching those filters. Try adjusting search terms or
              verify monitored companies.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => {
              const hasOppScore =
                job.opportunityScore !== undefined && job.opportunityScore !== null
              const hasMatchScore = job.matchScore !== undefined && job.matchScore !== null
              const isExcellentOpp = hasOppScore && job.opportunityScore >= 85

              return (
                <div
                  key={job.id}
                  className={`glass-card p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                    isExcellentOpp
                      ? 'border-emerald-500/20 shadow-lg shadow-emerald-500/[0.02]'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                        {job.company?.name || 'Company'}
                      </span>
                      <span className="text-xs text-slate-500 capitalize bg-slate-900 px-2 py-1 rounded border border-white/5">
                        {job.locationType}
                      </span>
                      <span className="text-xs text-slate-500 capitalize bg-slate-900 px-2 py-1 rounded border border-white/5">
                        {job.seniorityLevel}
                      </span>

                      {/* Opportunity Score Badge */}
                      {hasOppScore && (
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border font-display flex items-center gap-1 shadow-md transition-all ${
                            isExcellentOpp
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse shadow-emerald-500/5'
                              : 'bg-primary/10 border-primary/20 text-primary'
                          }`}
                        >
                          ★ {job.opportunityScore} Opp Score
                        </span>
                      )}

                      {/* Match Score Badge */}
                      {hasMatchScore && (
                        <span className="text-xs font-semibold px-2 py-1 rounded border border-white/5 bg-slate-900 text-slate-400">
                          {Math.round(job.matchScore * 100)}% Match
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold font-display text-white hover:text-primary transition-colors">
                      <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {job.location}
                      </span>
                      {job.salaryMin && (
                        <span className="text-slate-300 font-semibold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                          {job.salaryCurrency === 'INR' ? '₹' : '$'}
                          {(job.salaryMin / 100000).toFixed(0)}L -{' '}
                          {(job.salaryMax / 100000).toFixed(0)}L
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Posted {new Date(job.postedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Extracted Skills */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {job.requiredSkills.slice(0, 5).map((skill: string) => (
                          <span
                            key={skill}
                            className="text-[10px] font-semibold text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                            +{job.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all text-center flex items-center gap-1.5 w-full md:w-auto"
                    >
                      View Details & Match <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > jobs.length && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 font-semibold py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-400 flex items-center px-2">
              Page {page} of {Math.ceil(total / 15)}
            </span>
            <button
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 font-semibold py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
