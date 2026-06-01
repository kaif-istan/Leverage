import { MatchReason, OpportunityReason } from '@job-hunter/shared'

export class ExplanationBuilder {
  /**
   * Builds matching reasons based on scores.
   */
  static buildMatchExplanation(metrics: {
    semanticScore: number
    keywordScore: number
    seniorityScore: number
    matchedSkills: string[]
  }): MatchReason[] {
    const reasons: MatchReason[] = []

    // Semantic Description
    reasons.push({
      factor: 'Semantic Alignment',
      score: Math.round(metrics.semanticScore * 100),
      description:
        metrics.semanticScore >= 0.85
          ? 'Excellent role context match based on your professional experience and profile text.'
          : metrics.semanticScore >= 0.7
            ? 'Very strong alignment with your industry experience and target roles.'
            : 'Moderate semantic alignment with your career history.',
    })

    // Keyword / Skills Description
    reasons.push({
      factor: 'Skills & Tech Stack',
      score: Math.round(metrics.keywordScore * 100),
      description: `Detected ${metrics.matchedSkills.length} of your target skills/technologies in this job posting.`,
    })

    // Seniority Description
    reasons.push({
      factor: 'Seniority Level Fit',
      score: Math.round(metrics.seniorityScore * 100),
      description:
        metrics.seniorityScore >= 0.9
          ? 'Matches your target seniority level requirements.'
          : 'Seniority requirements vary slightly from your preferred levels.',
    })

    return reasons
  }

  /**
   * Builds opportunity boost and drag explanations based on sub-signals.
   */
  static buildOpportunityExplanation(data: {
    salarySignal: number
    companyQualitySignal: number
    hiringVelocitySignal: number
    remoteSignal: number
    freshnessSignal: number
    job: any
    companyIntel: any
    preferences: any
  }): OpportunityReason[] {
    const reasons: OpportunityReason[] = []
    const {
      salarySignal,
      companyQualitySignal,
      hiringVelocitySignal,
      remoteSignal,
      freshnessSignal,
      job,
      companyIntel,
      preferences,
    } = data

    // 1. Salary Boosts / Drags
    if (job.salaryMin || job.salaryMax) {
      const midpoint = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2
      const targetMin = preferences.salaryMin || 100000
      const pctOver = Math.round(((midpoint - targetMin) / targetMin) * 100)

      if (salarySignal > 0.75) {
        reasons.push({
          factor: 'Salary Attractiveness',
          direction: 'boost',
          description: `Highly competitive salary: ${pctOver > 0 ? `+${pctOver}%` : 'Above'} your minimum target.`,
        })
      } else if (salarySignal < 0.4) {
        reasons.push({
          factor: 'Salary Attractiveness',
          direction: 'drag',
          description: `Compensation midpoint is ${Math.abs(pctOver)}% below your target minimum.`,
        })
      }
    } else {
      reasons.push({
        factor: 'Salary Attractiveness',
        direction: 'neutral',
        description: 'Compensation not publicly listed (evaluated neutrally).',
      })
    }

    // 2. Company Quality
    if (companyIntel) {
      const rating = companyIntel.glassdoorRating
      const funding = companyIntel.fundingStage

      if (companyQualitySignal > 0.75) {
        let desc = 'Strong company credentials'
        if (funding && funding !== 'unknown') {
          desc += `, currently at ${funding.replace('_', ' ')} stage`
        }
        if (rating) {
          desc += ` with ${rating}★ Glassdoor rating`
        }
        reasons.push({
          factor: 'Company Quality',
          direction: 'boost',
          description: desc + '.',
        })
      } else if (companyQualitySignal < 0.4) {
        reasons.push({
          factor: 'Company Quality',
          direction: 'drag',
          description: 'Early/bootstrap stage company with higher risk profiles.',
        })
      }
    }

    // 3. Hiring Velocity
    if (companyIntel?.hiringVelocity === 'growing') {
      reasons.push({
        factor: 'Hiring Momentum',
        direction: 'boost',
        description: 'Fast-growing company with strong month-over-month hiring velocity.',
      })
    } else if (companyIntel?.hiringVelocity === 'shrinking') {
      reasons.push({
        factor: 'Hiring Momentum',
        direction: 'drag',
        description: 'Slightly slowing hiring velocity detected recently.',
      })
    }

    // 4. Remote Preference Match
    if (remoteSignal >= 0.9) {
      reasons.push({
        factor: 'Location Match',
        direction: 'boost',
        description: `Workplace structure matches your remote preference (${preferences.remotePreference || 'any'}).`,
      })
    } else if (remoteSignal <= 0.2) {
      reasons.push({
        factor: 'Location Match',
        direction: 'drag',
        description: `Onsite/Hybrid layout mismatches your preferred ${preferences.remotePreference} style.`,
      })
    }

    // 5. Freshness
    if (freshnessSignal >= 0.9) {
      reasons.push({
        factor: 'Posting Freshness',
        direction: 'boost',
        description: 'Very fresh posting - published within the last 24-72 hours.',
      })
    } else if (freshnessSignal <= 0.3) {
      reasons.push({
        factor: 'Posting Freshness',
        direction: 'drag',
        description: 'Active for over 14 days (increased competition).',
      })
    }

    return reasons
  }
}
