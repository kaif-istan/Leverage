// ─── Enums ────────────────────────────────────────────────────────────────────

export type AtsPlatform = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'unknown' | 'none'

export type LocationType = 'remote' | 'hybrid' | 'onsite' | 'unknown'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'unknown'

export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'director' | 'unknown'

export type RemotePreference = 'remote' | 'hybrid' | 'onsite' | 'any'

export type CompanyType = 'public' | 'private' | 'nonprofit' | 'government' | 'unknown'

export type FundingStage =
  | 'bootstrapped'
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'public'
  | 'acquired'
  | 'unknown'

export type HiringVelocity = 'growing' | 'stable' | 'shrinking' | 'unknown'

export type DiscoverySource = 'yc_directory' | 'wellfound' | 'manual_seed' | 'self_referral' | 'github'

export type ProbeStatus = 'pending' | 'confirmed' | 'failed' | 'unknown'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'oa_received'
  | 'hr_screen_scheduled'
  | 'hr_screen_completed'
  | 'technical_screen_scheduled'
  | 'technical_screen_completed'
  | 'hiring_manager_scheduled'
  | 'hiring_manager_completed'
  | 'final_round_scheduled'
  | 'final_round_completed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected_after_oa'
  | 'rejected_after_hr'
  | 'rejected_after_technical'
  | 'rejected_after_hiring_manager'
  | 'rejected_after_final'
  | 'ghosted'
  | 'withdrawn'

export type RejectionStage = 'oa' | 'hr' | 'technical' | 'hiring_manager' | 'final' | 'unknown'

export type ApplicationPriority = 'low' | 'medium' | 'high'

export type CoverLetterType = 'cover_letter' | 'recruiter_message' | 'linkedin_connect' | 'thank_you'

export type CoverLetterTone = 'formal' | 'casual' | 'enthusiastic'

export type RecruiterSource = 'linkedin' | 'referral' | 'inbound' | 'conference' | 'other'

export type OutreachStatus =
  | 'not_contacted'
  | 'connected'
  | 'messaged'
  | 'replied'
  | 'referred'
  | 'interview_scheduled'
  | 'relationship_active'
  | 'inactive'

export type OutreachType = 'connection_request' | 'message' | 'email' | 'reply' | 'call' | 'referral'

export type OutreachPlatform = 'linkedin' | 'email' | 'phone' | 'other'

export type OutreachOutcome = 'no_response' | 'replied' | 'scheduled' | 'referred' | 'declined'

export type DigestStatus = 'pending' | 'sent' | 'failed'

export type ScrapeStatus = 'running' | 'success' | 'failed' | 'partial'

export type IngestionStage = 'raw' | 'normalized' | 'embedded' | 'scored'

export type SkillExtractionMethod = 'taxonomy' | 'hybrid'

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Skill {
  name: string
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  yearsUsed?: number
}

export interface WorkHistoryEntry {
  company: string
  title: string
  startDate: string
  endDate?: string
  isCurrent?: boolean
  description?: string
  technologies?: string[]
  achievements?: string[]
  location?: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year?: number
  gpa?: number
  field?: string
}

export interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  summary?: string
  totalYoe?: number
  skills: Skill[]
  technologies: string[]
  workHistory: WorkHistoryEntry[]
  education: EducationEntry[]
  certifications?: string[]
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
  timestamp: string
  path: string
}

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface JobSummary {
  id: string
  title: string
  company: CompanySummary
  location: string
  locationType: LocationType
  seniorityLevel: SeniorityLevel
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  postedAt?: string
  scrapedAt: string
  isActive: boolean
  applyUrl: string
  requiredSkills: string[]
  technologies: string[]
  matchScore?: number
  opportunityScore?: number
  opportunityRank?: number
}

export interface JobDetail extends JobSummary {
  descriptionText: string
  descriptionStructured?: Record<string, unknown>
  preferredSkills: string[]
  yearsExperienceRequired?: number
  employmentType: EmploymentType
  source: JobSourceSummary
  matchDetail?: JobMatchDetail
  atsAnalysis?: AtsAnalysisSummary
  companyIntelligence?: CompanyIntelligenceSummary
}

export interface JobMatchDetail {
  overallScore: number
  semanticScore: number
  keywordScore: number
  seniorityScore: number
  locationScore: number
  freshnessScore: number
  opportunityScore: number
  opportunityRank?: number
  salarySignal: number
  companyQualitySignal: number
  hiringVelocitySignal: number
  remoteSignal: number
  freshnessSignal: number
  matchedSkills: string[]
  missingRequiredSkills: string[]
  missingPreferredSkills: string[]
  matchReasons: MatchReason[]
  opportunityBoostReasons: OpportunityReason[]
  salaryEstimateMin?: number
  salaryEstimateMax?: number
}

export interface MatchReason {
  factor: string
  score: number
  description: string
}

export interface OpportunityReason {
  factor: string
  direction: 'boost' | 'neutral' | 'drag'
  description: string
}

export interface JobSourceSummary {
  id: string
  name: string
  displayName: string
}

// ─── Company Types ────────────────────────────────────────────────────────────

export interface CompanySummary {
  id: string
  name: string
  logoUrl?: string
  domain?: string
  hqLocation?: string
  atsPlatform?: AtsPlatform
}

export interface CompanyDetail extends CompanySummary {
  description?: string
  industry?: string
  size?: string
  linkedinUrl?: string
  glassdoorUrl?: string
  careerpageUrl?: string
  intelligence?: CompanyIntelligenceSummary
}

export interface CompanyIntelligenceSummary {
  employeeCount?: number
  employeeCountRange?: string
  fundingStage?: FundingStage
  totalFundingUsd?: number
  lastFundingDate?: string
  glassdoorRating?: number
  hiringVelocity?: HiringVelocity
  jobsPosted30d?: number
  jobsPosted90d?: number
  techStack?: string[]
  enrichmentQualityScore: number
  lastEnrichedAt?: string
}

// ─── ATS Types ────────────────────────────────────────────────────────────────

export interface AtsAnalysisSummary {
  id: string
  atsScore: number
  keywordMatchRate: number
  matchedKeywords: string[]
  missingRequiredKeywords: string[]
  missingPreferredKeywords: string[]
  formatIssues: AtsFormatIssue[]
  sectionScores: AtsSectionScores
  stage1CompletedAt: string
  aiRecommendations?: AtsAiRecommendation[]
  stage2CompletedAt?: string
}

export interface AtsFormatIssue {
  issue: string
  severity: 'high' | 'medium' | 'low'
  suggestion: string
}

export interface AtsSectionScores {
  experience?: number
  skills?: number
  education?: number
  keywords?: number
}

export interface AtsAiRecommendation {
  section: string
  originalText?: string
  suggestedText?: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

// ─── Application Types ────────────────────────────────────────────────────────

export interface ApplicationSummary {
  id: string
  job: JobSummary
  status: ApplicationStatus
  priority: ApplicationPriority
  appliedAt?: string
  notes?: string
  rejectionStage?: RejectionStage
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationHistoryEntry {
  id: string
  fromStatus?: ApplicationStatus
  toStatus: ApplicationStatus
  changedAt: string
  note?: string
}

// ─── Opportunity Score Weights ────────────────────────────────────────────────

export interface OpportunityWeights {
  matchWeight: number        // default: 0.30
  salaryWeight: number       // default: 0.25
  companyQualityWeight: number // default: 0.20
  hiringVelocityWeight: number // default: 0.10
  remoteWeight: number       // default: 0.08
  freshnessWeight: number    // default: 0.07
}

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = {
  matchWeight: 0.30,
  salaryWeight: 0.25,
  companyQualityWeight: 0.20,
  hiringVelocityWeight: 0.10,
  remoteWeight: 0.08,
  freshnessWeight: 0.07,
}

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPreferences {
  opportunityWeights: OpportunityWeights
  salaryMin?: number
  salaryCurrency: string
  remotePreference: RemotePreference
  targetSeniority?: SeniorityLevel[]
  digestTime: string          // HH:MM format
  digestEnabled: boolean
  minOpportunityScoreAlert: number
}

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'opportunityWeights'> = {
  salaryCurrency: 'USD',
  remotePreference: 'any',
  digestTime: '07:00',
  digestEnabled: true,
  minOpportunityScoreAlert: 85,
}

// ─── Rejection Analytics ──────────────────────────────────────────────────────

export interface RejectionFunnelStage {
  stage: string
  applied: number
  reached: number
  rejected: number
  eliminationRate: number
}

export interface RejectionAnalytics {
  totalApplications: number
  ghostingRate: number
  offerRate: number
  responseRate: number
  avgDaysToRejection: Record<RejectionStage, number>
  rejectionFunnel: RejectionFunnelStage[]
  mostCommonRejectionStage?: RejectionStage
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface JwtPayload {
  sub: string
  email: string
  iat?: number
  exp?: number
}
