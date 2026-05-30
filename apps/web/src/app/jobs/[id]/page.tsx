'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, ExternalLink, Zap, Compass, Sparkles, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [job, setJob] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchDetail()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        <Link href="/jobs" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
          Return to Board
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/jobs" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to Board
        </Link>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold font-display tracking-tight text-white">AI JOB HUNTER</span>
        </div>
      </header>

      {/* Hero Header Card */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        <div className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl">
              {job.company?.name}
            </span>
            <span className="text-xs font-semibold capitalize bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg text-slate-400">
              {job.locationType}
            </span>
            <span className="text-xs font-semibold capitalize bg-slate-900 border border-white/5 px-3 py-1.5 rounded-lg text-slate-400">
              {job.seniority}
            </span>
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
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                Posted {new Date(job.postedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
            >
              Apply on ATS Page <ExternalLink className="h-4 w-4" />
            </a>

            <div className="bg-white/5 border border-white/10 text-slate-300 font-semibold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 select-none">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              Matching Metrics Pending (Sprint 3 Active)
            </div>
          </div>
        </div>

        {/* Technical Taxonomy Badges */}
        {(job.skills?.length > 0 || job.techStack?.length > 0) && (
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
              Stage 1 Detected Stack / Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill: string) => (
                <span key={skill} className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/5 px-3 py-1 rounded-lg">
                  {skill}
                </span>
              ))}
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
            dangerouslySetInnerHTML={{ __html: job.descriptionHtml || `<p>${job.descriptionText}</p>` }}
          />
        </div>
      </main>
    </div>
  )
}
