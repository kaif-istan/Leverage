'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Save, RefreshCw, Zap, Info, DollarSign } from 'lucide-react'
import api from '@/lib/api'

interface OpportunityWeights {
  matchWeight: number
  salaryWeight: number
  companyQualityWeight: number
  hiringVelocityWeight: number
  remoteWeight: number
  freshnessWeight: number
}

export default function PreferencesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Strongly-typed weights hooks
  const [weights, setWeights] = useState<OpportunityWeights>({
    matchWeight: 0.3,
    salaryWeight: 0.25,
    companyQualityWeight: 0.2,
    hiringVelocityWeight: 0.1,
    remoteWeight: 0.08,
    freshnessWeight: 0.07,
  })

  const [salaryMin, setSalaryMin] = useState(100000)
  const [remotePreference, setRemotePreference] = useState('any')

  useEffect(() => {
    const fetchPrefs = async () => {
      setLoading(true)
      try {
        const res: any = await api.get('/jobs/preferences')
        if (res) {
          if (res.opportunityWeights) {
            setWeights(res.opportunityWeights)
          }
          if (res.salaryMin) {
            setSalaryMin(res.salaryMin)
          }
          if (res.remotePreference) {
            setRemotePreference(res.remotePreference)
          }
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])

  // Proportional dynamic weights normalizer with keyof constraints
  const handleWeightChange = (key: keyof OpportunityWeights, value: number) => {
    const currentVal = value / 100 // convert percent to float
    const otherKeys = (Object.keys(weights) as Array<keyof OpportunityWeights>).filter(
      (k) => k !== key,
    )
    const remaining = 1.0 - currentVal

    if (otherKeys.length === 0) return

    // Sum of other weights
    const sumOther = otherKeys.reduce((acc, k) => acc + (weights[k] || 0), 0)

    let newWeights = { ...weights }
    newWeights[key] = currentVal

    if (sumOther > 0) {
      // Distribute remaining weight proportionally among other options
      otherKeys.forEach((k) => {
        newWeights[k] = ((weights[k] || 0) / sumOther) * remaining
      })
    } else {
      // Even fallback distribution
      otherKeys.forEach((k) => {
        newWeights[k] = remaining / otherKeys.length
      })
    }

    setWeights(newWeights)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/jobs/preferences', {
        opportunityWeights: weights,
        salaryMin: Number(salaryMin),
        remotePreference,
      })
      router.push('/jobs')
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Calculate sum as a safety check for the UI
  const totalPercentage = Math.round(
    Object.values(weights).reduce((acc, val) => acc + val, 0) * 100,
  )

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden pb-16">
      {/* Background radial effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/jobs"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Board
        </Link>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold font-display tracking-tight text-white">
            AI JOB HUNTER
          </span>
        </div>
      </header>

      {/* Preferences view */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Opportunity Priority Weights
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Calibrate how the recommendation engine scores new job listings relative to your
            priorities.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Target Benchmarks (Salary and Location Preference) */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-5">
            <h2 className="text-base font-bold font-display text-white border-b border-white/5 pb-3">
              1. Target Career Benchmarks
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salary Target */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Minimum Salary (INR or USD equivalents)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold"
                    placeholder="e.g. 1200000"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Calculated against the midpoint of job posting ranges to yield Salary
                  Attractiveness.
                </p>
              </div>

              {/* Remote Preference */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Workplace Strategy Preference
                </label>
                <select
                  value={remotePreference}
                  onChange={(e) => setRemotePreference(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer font-semibold"
                >
                  <option value="any">Flexible (No remote penalty)</option>
                  <option value="remote">Prefer Fully Remote</option>
                  <option value="hybrid">Prefer Hybrid</option>
                  <option value="onsite">Prefer Onsite</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Mismatched location listings will be soft-penalized to prioritize your preference.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Normalizing Weights Sliders */}
          <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold font-display text-white">
                2. Opportunity Score Weights
              </h2>
              <div
                className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                  totalPercentage === 100
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-destructive/10 border-destructive/20 text-red-400'
                }`}
              >
                Total Allocation: {totalPercentage}%
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              Adjusting any slider will dynamically and proportionally re-normalize the remaining
              parameters so they always sum to exactly 100% total allocation.
            </div>

            <div className="flex flex-col gap-6">
              {/* Weight 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Match Score (Resume Fit)</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.matchWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.matchWeight * 100)}
                  onChange={(e) => handleWeightChange('matchWeight', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Weight 2 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Salary Attractiveness</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.salaryWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.salaryWeight * 100)}
                  onChange={(e) => handleWeightChange('salaryWeight', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Weight 3 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Company Quality (Funding & Glassdoor)</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.companyQualityWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.companyQualityWeight * 100)}
                  onChange={(e) =>
                    handleWeightChange('companyQualityWeight', Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Weight 4 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Company Hiring Momentum</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.hiringVelocityWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.hiringVelocityWeight * 100)}
                  onChange={(e) =>
                    handleWeightChange('hiringVelocityWeight', Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Weight 5 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Remote Location strategy Match</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.remoteWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.remoteWeight * 100)}
                  onChange={(e) => handleWeightChange('remoteWeight', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>

              {/* Weight 6 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Posting Freshness</span>
                  <span className="font-mono text-primary">
                    {Math.round(weights.freshnessWeight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(weights.freshnessWeight * 100)}
                  onChange={(e) => handleWeightChange('freshnessWeight', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-primary border border-white/5"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 justify-end">
            <Link
              href="/jobs"
              className="bg-white/5 hover:bg-white/10 border border-white/10 font-bold px-6 py-3.5 rounded-xl text-sm transition-all text-slate-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/95 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Recalculating ranks...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save & Score Feed
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
