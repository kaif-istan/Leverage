'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  Zap,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Building,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Heart,
  Settings,
  RefreshCw,
} from 'lucide-react'
import api from '@/lib/api'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [job, setJob] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/jobs/${resolvedParams.id}`)
      setJob(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [resolvedParams.id])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      await api.post(`/jobs/${resolvedParams.id}/match`)
      // Reload details
      const data = await api.get(`/jobs/${resolvedParams.id}`)
      setJob(data)
    } catch (err) {
      console.error('Recalculation failed:', err)
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold font-display text-white">Job opening not found</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-sm mb-6">
          The opening you are looking for does not exist or was closed.
        </p>
        <Link
          href="/jobs"
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm"
        >
          Return to Board
        </Link>
      </div>
    )
  }

  const match = job.matchDetail || {}
  const overallScore = Math.round((match.overallScore || 0) * 100)
  const oppScore = Math.round(match.opportunityScore || 0)
  const isExcellentOpp = oppScore >= 85

  // Sub-signal percentages
  const salaryPct = Math.round((match.salarySignal || 0.5) * 100)
  const qualityPct = Math.round((match.companyQualitySignal || 0.5) * 100)
  const velocityPct = Math.round((match.hiringVelocitySignal || 0.5) * 100)
  const remotePct = Math.round((match.remoteSignal || 0.5) * 100)
  const freshnessPct = Math.round((match.freshnessSignal || 0.5) * 100)

  // Circular gauge calculations
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const matchStrokeDashoffset = circumference - (overallScore / 100) * circumference
  const oppStrokeDashoffset = circumference - (oppScore / 100) * circumference

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden pb-16">
      {/* Visual background lights */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/jobs"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Board
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/settings/preferences"
            className="text-slate-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" /> Adjust weights
          </Link>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold font-display tracking-tight text-white">
              AI JOB HUNTER
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header Card */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        <div
          className={`glass-card p-8 rounded-3xl border flex flex-col gap-6 relative overflow-hidden ${
            isExcellentOpp
              ? 'border-emerald-500/20 shadow-xl shadow-emerald-500/[0.02]'
              : 'border-white/5'
          }`}
        >
          {isExcellentOpp && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500/10 to-transparent px-6 py-2 border-b border-l border-emerald-500/20 rounded-bl-3xl flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold text-emerald-400 tracking-wider uppercase font-display">
                Top Strategic Opportunity
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl">
              {job.company?.name}
            </span>
            <span className="text-xs font-semibold capitalize bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg text-slate-400">
              {job.locationType}
            </span>
            <span className="text-xs font-semibold capitalize bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg text-slate-400">
              {job.seniorityLevel}
            </span>
            {job.employmentType && (
              <span className="text-xs font-semibold capitalize bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg text-slate-400">
                {job.employmentType.replace('_', ' ')}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-white leading-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500" />
                {job.location}
              </span>
              {job.salaryMin && (
                <span className="text-slate-200 font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                  Compensation: {job.salaryCurrency === 'INR' ? '₹' : '$'}
                  {(job.salaryMin / 100000).toFixed(0)}L - {(job.salaryMax / 100000).toFixed(0)}L
                  Midpoint
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                Posted {new Date(job.postedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 items-center justify-between">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
            >
              Apply on ATS Page <ExternalLink className="h-4 w-4" />
            </a>

            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold px-5 py-3.5 rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recomputating Score...' : 'Recompute Score'}
            </button>
          </div>
        </div>

        {/* Dual Gauge Scores Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Score Card */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold font-display text-white">Match Profile Fit</h2>
              <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
                Represents semantic experience alignment and specific taxonomy skill overlaps.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                    Semantic
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {Math.round((match.semanticScore || 0.5) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                    Keywords
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {Math.round((match.keywordScore || 0.5) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-900 border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] uppercase text-slate-500 block font-semibold">
                    Seniority
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {Math.round((match.seniorityScore || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-800 fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-primary fill-none transition-all duration-500"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={matchStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-black font-display text-white">
                {overallScore}%
              </span>
            </div>
          </div>

          {/* Opportunity Score Card */}
          <div
            className={`glass p-6 rounded-3xl border flex items-center justify-between gap-6 relative overflow-hidden ${
              isExcellentOpp ? 'border-emerald-500/20' : 'border-white/5'
            }`}
          >
            {isExcellentOpp && (
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 border-b border-l border-emerald-500/20 rounded-bl-xl font-display">
                ★ OUTSTANDING
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold font-display text-white">
                Strategic Opportunity Score
              </h2>
              <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">
                Composite priority rating evaluated across weights snapshot, quality, hiring
                velocity, remote, and salary.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-400">
                <Sparkles className="h-4 w-4" /> Global Rank: #{match.opportunityRank || 'N/A'}
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-800 fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className={`fill-none transition-all duration-500 ${isExcellentOpp ? 'stroke-emerald-400' : 'stroke-primary'}`}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={oppStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className={`absolute text-xl font-black font-display ${isExcellentOpp ? 'text-emerald-400' : 'text-white'}`}
              >
                {oppScore}
              </span>
            </div>
          </div>
        </div>

        {/* Opportunity Signals details & Explanations split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 6 Sub-Signals progress sliders */}
          <div className="glass p-6 rounded-3xl border border-white/5 lg:col-span-2 flex flex-col gap-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" /> Core Signals Breakdown
            </h3>

            <div className="flex flex-col gap-4">
              {/* Signal 1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Match Compatibility (30% weight)
                  </span>
                  <span className="text-slate-400 font-mono">{overallScore}/100</span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${overallScore}%` }}
                  />
                </div>
              </div>

              {/* Signal 2 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Salary Attractiveness (25% weight)
                  </span>
                  <span className="text-slate-400 font-mono">Signal: {salaryPct}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${salaryPct}%` }}
                  />
                </div>
              </div>

              {/* Signal 3 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Company Quality & Credentials (20% weight)
                  </span>
                  <span className="text-slate-400 font-mono">Rating: {qualityPct}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${qualityPct}%` }}
                  />
                </div>
              </div>

              {/* Signal 4 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">Hiring Velocity (10% weight)</span>
                  <span className="text-slate-400 font-mono capitalize">
                    {job.companyIntelligence?.hiringVelocity || 'unknown'} ({velocityPct}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${velocityPct}%` }}
                  />
                </div>
              </div>

              {/* Signal 5 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Remote Workspace Alignment (8% weight)
                  </span>
                  <span className="text-slate-400 font-mono">Score: {remotePct}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${remotePct}%` }}
                  />
                </div>
              </div>

              {/* Signal 6 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Posting Freshness (7% weight)
                  </span>
                  <span className="text-slate-400 font-mono">Freshness: {freshnessPct}%</span>
                </div>
                <div className="h-2 bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${freshnessPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Boosts / Drags Explanation Lists */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Strategic Explanations
            </h3>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[280px] pr-1 scrollbar-thin">
              {match.opportunityBoostReasons?.map((reason: any, idx: number) => {
                const isBoost = reason.direction === 'boost'
                const isDrag = reason.direction === 'drag'

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      isBoost
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                        : isDrag
                          ? 'bg-destructive/5 border-destructive/10 text-red-300'
                          : 'bg-white/[0.02] border-white/5 text-slate-400'
                    }`}
                  >
                    {isBoost ? (
                      <ThumbsUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isDrag ? (
                      <ThumbsDown className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block text-white mb-0.5 font-semibold capitalize">
                        {reason.factor}
                      </strong>
                      {reason.description}
                    </div>
                  </div>
                )
              })}
              {(!match.opportunityBoostReasons || match.opportunityBoostReasons.length === 0) && (
                <p className="text-slate-500 text-xs italic text-center my-auto">
                  No specific score adjustments calculated.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Taxonomy Skill Checks split columns */}
        <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-400" /> Skill Overlaps & Gaps Check
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {/* Matched Skills (Emerald) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="text-xs font-bold font-display text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 shrink-0" /> Matched Skills (
                {match.matchedSkills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5 content-start">
                {match.matchedSkills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
                {(!match.matchedSkills || match.matchedSkills.length === 0) && (
                  <span className="text-[10px] text-slate-500 italic">
                    No direct target skills matched.
                  </span>
                )}
              </div>
            </div>

            {/* Missing Required (Crimson) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="text-xs font-bold font-display text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" /> Missing Required (
                {match.missingRequiredSkills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5 content-start">
                {match.missingRequiredSkills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[10px] font-bold text-red-300 bg-destructive/10 border border-destructive/20 px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
                {(!match.missingRequiredSkills || match.missingRequiredSkills.length === 0) && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    ✓ Clean! Matched all required skills.
                  </span>
                )}
              </div>
            </div>

            {/* Missing Preferred (Amber) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="text-xs font-bold font-display text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Missing Preferred (
                {match.missingPreferredSkills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5 content-start">
                {match.missingPreferredSkills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
                {(!match.missingPreferredSkills || match.missingPreferredSkills.length === 0) && (
                  <span className="text-[10px] text-slate-500 italic">
                    No preferred requirements missing.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company intelligence panel */}
        {job.companyIntelligence && (
          <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
              <Building className="h-4 w-4 text-primary" /> Company Context Intelligence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                  Headcount Size
                </span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {job.companyIntelligence.employeeCount ||
                    job.companyIntelligence.employeeCountRange ||
                    'Unknown Size'}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                  Funding Stage
                </span>
                <span className="text-sm font-bold text-white mt-1 block capitalize">
                  {job.companyIntelligence.fundingStage
                    ? job.companyIntelligence.fundingStage.replace('_', ' ')
                    : 'Unknown Stage'}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                  Glassdoor Review
                </span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block flex items-center gap-1">
                  ★{' '}
                  {job.companyIntelligence.glassdoorRating
                    ? `${job.companyIntelligence.glassdoorRating} / 5`
                    : 'N/A Rating'}
                </span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                  Tech Stack Details
                </span>
                <div className="flex flex-wrap gap-1 mt-1.5 max-h-[38px] overflow-hidden">
                  {job.companyIntelligence.techStack?.slice(0, 3).map((tech: string) => (
                    <span
                      key={tech}
                      className="text-[9px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-slate-400"
                    >
                      {tech}
                    </span>
                  ))}
                  {(!job.companyIntelligence.techStack ||
                    job.companyIntelligence.techStack.length === 0) && (
                    <span className="text-[10px] text-slate-500 italic">
                      No stacks cataloged yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Description details */}
        <div className="glass p-8 md:p-12 rounded-3xl border border-white/5 flex flex-col gap-6">
          <h2 className="text-xl font-bold font-display text-white border-b border-white/5 pb-4">
            Job Description & Specifications
          </h2>

          <div
            className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed flex flex-col gap-4 description-block"
            dangerouslySetInnerHTML={{
              __html: job.descriptionHtml || `<p>${job.descriptionText}</p>`,
            }}
          />
        </div>
      </main>
    </div>
  )
}
