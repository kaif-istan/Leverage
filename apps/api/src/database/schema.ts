import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  real,
  time,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── pgvector custom type ────────────────────────────────────────────────────
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return `vector(${(config as { dimensions?: number }).dimensions ?? 768})`
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(',')
      .map((v) => parseFloat(v))
  },
})

// ─── Enums ───────────────────────────────────────────────────────────────────

export const atsPlatformEnum = pgEnum('ats_platform', [
  'greenhouse',
  'lever',
  'ashby',
  'workday',
  'unknown',
  'none',
])

export const locationTypeEnum = pgEnum('location_type', ['remote', 'hybrid', 'onsite', 'unknown'])

export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'unknown',
])

export const seniorityLevelEnum = pgEnum('seniority_level', [
  'intern',
  'junior',
  'mid',
  'senior',
  'staff',
  'director',
  'unknown',
])

export const remotePreferenceEnum = pgEnum('remote_preference', [
  'remote',
  'hybrid',
  'onsite',
  'any',
])

export const companyTypeEnum = pgEnum('company_type', [
  'public',
  'private',
  'nonprofit',
  'government',
  'unknown',
])

export const fundingStageEnum = pgEnum('funding_stage', [
  'bootstrapped',
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c',
  'series_d_plus',
  'public',
  'acquired',
  'unknown',
])

export const hiringVelocityEnum = pgEnum('hiring_velocity', [
  'growing',
  'stable',
  'shrinking',
  'unknown',
])

export const discoverySourceEnum = pgEnum('discovery_source', [
  'yc_directory',
  'wellfound',
  'manual_seed',
  'self_referral',
  'github',
])

export const probeStatusEnum = pgEnum('probe_status', ['pending', 'confirmed', 'failed', 'unknown'])

export const discoveryQueueStatusEnum = pgEnum('discovery_queue_status', [
  'pending',
  'probing',
  'confirmed',
  'failed',
  'skipped',
])

export const applicationStatusEnum = pgEnum('application_status', [
  'saved',
  'applied',
  'oa_received',
  'hr_screen_scheduled',
  'hr_screen_completed',
  'technical_screen_scheduled',
  'technical_screen_completed',
  'hiring_manager_scheduled',
  'hiring_manager_completed',
  'final_round_scheduled',
  'final_round_completed',
  'offer_received',
  'offer_accepted',
  'offer_declined',
  'rejected_after_oa',
  'rejected_after_hr',
  'rejected_after_technical',
  'rejected_after_hiring_manager',
  'rejected_after_final',
  'ghosted',
  'withdrawn',
])

export const rejectionStageEnum = pgEnum('rejection_stage', [
  'oa',
  'hr',
  'technical',
  'hiring_manager',
  'final',
  'unknown',
])

export const applicationPriorityEnum = pgEnum('application_priority', ['low', 'medium', 'high'])

export const coverLetterTypeEnum = pgEnum('cover_letter_type', [
  'cover_letter',
  'recruiter_message',
  'linkedin_connect',
  'thank_you',
])

export const coverLetterToneEnum = pgEnum('cover_letter_tone', ['formal', 'casual', 'enthusiastic'])

export const recruiterSourceEnum = pgEnum('recruiter_source', [
  'linkedin',
  'referral',
  'inbound',
  'conference',
  'other',
])

export const outreachStatusEnum = pgEnum('outreach_status', [
  'not_contacted',
  'connected',
  'messaged',
  'replied',
  'referred',
  'interview_scheduled',
  'relationship_active',
  'inactive',
])

export const outreachTypeEnum = pgEnum('outreach_type', [
  'connection_request',
  'message',
  'email',
  'reply',
  'call',
  'referral',
])

export const outreachPlatformEnum = pgEnum('outreach_platform', [
  'linkedin',
  'email',
  'phone',
  'other',
])

export const outreachOutcomeEnum = pgEnum('outreach_outcome', [
  'no_response',
  'replied',
  'scheduled',
  'referred',
  'declined',
])

export const scrapeStatusEnum = pgEnum('scrape_status', ['running', 'success', 'failed', 'partial'])

export const ingestionStageEnum = pgEnum('ingestion_stage', [
  'raw',
  'normalized',
  'embedded',
  'scored',
])

export const skillExtractionMethodEnum = pgEnum('skill_extraction_method', ['taxonomy', 'hybrid'])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  opportunityWeights: jsonb('opportunity_weights').notNull().default({
    matchWeight: 0.3,
    salaryWeight: 0.25,
    companyQualityWeight: 0.2,
    hiringVelocityWeight: 0.1,
    remoteWeight: 0.08,
    freshnessWeight: 0.07,
  }),
  salaryMin: integer('salary_min'),
  salaryCurrency: text('salary_currency').notNull().default('USD'),
  remotePreference: remotePreferenceEnum('remote_preference').notNull().default('any'),
  targetSeniority: text('target_seniority').array(),
  digestTime: time('digest_time').notNull().default('07:00'),
  digestEnabled: boolean('digest_enabled').notNull().default(true),
  minOpportunityScoreAlert: integer('min_opportunity_score_alert').notNull().default(85),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const candidateProfiles = pgTable('candidate_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  name: text('name').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone'),
  location: text('location'),
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  summary: text('summary'),
  totalYoe: real('total_yoe'),
  skills: jsonb('skills').notNull().default([]),
  technologies: text('technologies').array().notNull().default([]),
  education: jsonb('education').notNull().default([]),
  workHistory: jsonb('work_history').notNull().default([]),
  targetRoles: text('target_roles').array().notNull().default([]),
  targetLocations: text('target_locations').array().notNull().default([]),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  remotePreference: remotePreferenceEnum('remote_preference').notNull().default('any'),
  embedding: vector('embedding', { dimensions: 768 } as { dimensions: number }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull().default('application/pdf'),
  rawText: text('raw_text'),
  parsedData: jsonb('parsed_data'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain').unique(),
    logoUrl: text('logo_url'),
    industry: text('industry'),
    sizeRange: text('size_range'),
    hqLocation: text('hq_location'),
    description: text('description'),
    linkedinUrl: text('linkedin_url'),
    glassdoorUrl: text('glassdoor_url'),
    careerpageUrl: text('careerpage_url'),
    atsPlatform: atsPlatformEnum('ats_platform').notNull().default('unknown'),
    atsSlug: text('ats_slug'),
    atsVerifiedAt: timestamp('ats_verified_at', { withTimezone: true }),
    greenhouseSlug: text('greenhouse_slug'),
    leverSlug: text('lever_slug'),
    ashbySlug: text('ashby_slug'),
    discoverySource: discoverySourceEnum('discovery_source'),
    isMonitored: boolean('is_monitored').notNull().default(false),
    monitoringEnabledAt: timestamp('monitoring_enabled_at', { withTimezone: true }),
    probeStatus: probeStatusEnum('probe_status').notNull().default('pending'),
    probeLastAttemptedAt: timestamp('probe_last_attempted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('companies_name_idx').on(t.name),
    index('companies_domain_idx').on(t.domain),
    index('companies_is_monitored_idx').on(t.isMonitored),
    index('companies_ats_platform_idx').on(t.atsPlatform),
  ],
)

export const companyIntelligence = pgTable('company_intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' })
    .unique(),
  employeeCount: integer('employee_count'),
  employeeCountRange: text('employee_count_range'),
  employeeCountSource: text('employee_count_source'),
  fundingStage: fundingStageEnum('funding_stage'),
  totalFundingUsd: bigint('total_funding_usd', { mode: 'number' }),
  lastFundingDate: date('last_funding_date'),
  lastFundingRound: text('last_funding_round'),
  investors: text('investors').array(),
  fundingSource: text('funding_source'),
  glassdoorRating: real('glassdoor_rating'),
  glassdoorReviewsCount: integer('glassdoor_reviews_count'),
  glassdoorCeoApproval: real('glassdoor_ceo_approval'),
  industry: text('industry'),
  subIndustry: text('sub_industry'),
  companyType: companyTypeEnum('company_type'),
  foundedYear: integer('founded_year'),
  techStack: text('tech_stack').array(),
  techStackSource: text('tech_stack_source'),
  jobsPosted30d: integer('jobs_posted_30d'),
  jobsPosted90d: integer('jobs_posted_90d'),
  hiringVelocity: hiringVelocityEnum('hiring_velocity').notNull().default('unknown'),
  enrichmentSources: jsonb('enrichment_sources').notNull().default({}),
  enrichmentQualityScore: real('enrichment_quality_score').notNull().default(0),
  lastEnrichedAt: timestamp('last_enriched_at', { withTimezone: true }),
  nextEnrichmentDueAt: timestamp('next_enrichment_due_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const discoveredCompaniesQueue = pgTable(
  'discovered_companies_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: discoverySourceEnum('source').notNull(),
    companyName: text('company_name').notNull(),
    websiteUrl: text('website_url'),
    rawData: jsonb('raw_data').notNull().default({}),
    status: discoveryQueueStatusEnum('status').notNull().default('pending'),
    probeAttempts: integer('probe_attempts').notNull().default(0),
    lastProbeAt: timestamp('last_probe_at', { withTimezone: true }),
    nextProbeAt: timestamp('next_probe_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('dcq_status_idx').on(t.status), index('dcq_next_probe_idx').on(t.nextProbeAt)],
)

export const jobSources = pgTable('job_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  baseUrl: text('base_url').notNull(),
  adapterType: atsPlatformEnum('adapter_type').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  config: jsonb('config').notNull().default({}),
  lastScrapedAt: timestamp('last_scraped_at', { withTimezone: true }),
  scrapeIntervalMinutes: integer('scrape_interval_minutes').notNull().default(120),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => jobSources.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    externalId: text('external_id').notNull(),
    url: text('url').notNull().unique(),
    title: text('title').notNull(),
    descriptionRaw: text('description_raw'),
    descriptionText: text('description_text').notNull().default(''),
    descriptionStructured: jsonb('description_structured'),
    location: text('location'),
    locationType: locationTypeEnum('location_type').notNull().default('unknown'),
    employmentType: employmentTypeEnum('employment_type').notNull().default('unknown'),
    seniorityLevel: seniorityLevelEnum('seniority_level').notNull().default('unknown'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: text('salary_currency'),
    requiredSkills: text('required_skills').array().notNull().default([]),
    preferredSkills: text('preferred_skills').array().notNull().default([]),
    technologies: text('technologies').array().notNull().default([]),
    yearsExperienceRequired: real('years_experience_required'),
    applyUrl: text('apply_url').notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }).notNull().defaultNow(),
    embedding: vector('embedding', { dimensions: 768 } as { dimensions: number }),
    isActive: boolean('is_active').notNull().default(true),
    isDuplicate: boolean('is_duplicate').notNull().default(false),
    duplicateOfId: uuid('duplicate_of_id'),
    ingestionStage: ingestionStageEnum('ingestion_stage').notNull().default('raw'),
    skillsExtractedMethod: skillExtractionMethodEnum('skills_extracted_method'),
    seniorityDetectedMethod: text('seniority_detected_method'),
    urlHash: text('url_hash').notNull().unique(),
    fingerprintHash: text('fingerprint_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('jobs_company_id_idx').on(t.companyId),
    index('jobs_is_active_scraped_at_idx').on(t.isActive, t.scrapedAt),
    index('jobs_posted_at_idx').on(t.postedAt),
    index('jobs_seniority_idx').on(t.seniorityLevel),
    index('jobs_location_type_idx').on(t.locationType),
    index('jobs_fingerprint_hash_idx').on(t.fingerprintHash),
    index('jobs_ingestion_stage_idx').on(t.ingestionStage),
  ],
)

export const jobMatches = pgTable(
  'job_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: 'cascade' }),
    // Match signals
    overallScore: real('overall_score').notNull().default(0),
    semanticScore: real('semantic_score').notNull().default(0),
    keywordScore: real('keyword_score').notNull().default(0),
    seniorityScore: real('seniority_score').notNull().default(0),
    locationScore: real('location_score').notNull().default(0),
    freshnessScore: real('freshness_score').notNull().default(0),
    // Opportunity score signals
    opportunityScore: real('opportunity_score').notNull().default(0),
    opportunityRank: integer('opportunity_rank'),
    salarySignal: real('salary_signal').notNull().default(0.5),
    companyQualitySignal: real('company_quality_signal').notNull().default(0.5),
    hiringVelocitySignal: real('hiring_velocity_signal').notNull().default(0.5),
    remoteSignal: real('remote_signal').notNull().default(0.5),
    freshnessSignal: real('freshness_signal').notNull().default(0.5),
    weightsSnapshot: jsonb('weights_snapshot'),
    opportunityBoostReasons: jsonb('opportunity_boost_reasons').notNull().default([]),
    opportunityComputedAt: timestamp('opportunity_computed_at', { withTimezone: true }),
    // Skill analysis
    matchedSkills: text('matched_skills').array().notNull().default([]),
    missingRequiredSkills: text('missing_required_skills').array().notNull().default([]),
    missingPreferredSkills: text('missing_preferred_skills').array().notNull().default([]),
    matchReasons: jsonb('match_reasons').notNull().default([]),
    // Estimates
    salaryEstimateMin: integer('salary_estimate_min'),
    salaryEstimateMax: integer('salary_estimate_max'),
    salaryConfidence: real('salary_confidence'),
    // Meta
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
    profileVersion: integer('profile_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('job_matches_job_profile_idx').on(t.jobId, t.profileId),
    index('job_matches_opportunity_score_idx').on(t.opportunityScore),
    index('job_matches_overall_score_idx').on(t.overallScore),
    index('job_matches_profile_id_idx').on(t.profileId),
  ],
)

export const atsAnalyses = pgTable(
  'ats_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resumeId: uuid('resume_id')
      .notNull()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => candidateProfiles.id),
    // Stage 1 (algorithmic)
    atsScore: real('ats_score').notNull().default(0),
    keywordMatchRate: real('keyword_match_rate').notNull().default(0),
    matchedKeywords: text('matched_keywords').array().notNull().default([]),
    missingRequiredKeywords: text('missing_required_keywords').array().notNull().default([]),
    missingPreferredKeywords: text('missing_preferred_keywords').array().notNull().default([]),
    formatIssues: jsonb('format_issues').notNull().default([]),
    sectionScores: jsonb('section_scores').notNull().default({}),
    stage1CompletedAt: timestamp('stage1_completed_at', { withTimezone: true }),
    // Stage 2 (LLM, on demand)
    aiRecommendations: jsonb('ai_recommendations'),
    stage2CompletedAt: timestamp('stage2_completed_at', { withTimezone: true }),
    tailoredResumeId: uuid('tailored_resume_id'),
    cacheKey: text('cache_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ats_analyses_cache_key_idx').on(t.cacheKey),
    index('ats_analyses_job_id_idx').on(t.jobId),
    index('ats_analyses_resume_id_idx').on(t.resumeId),
  ],
)

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id),
    status: applicationStatusEnum('status').notNull().default('saved'),
    priority: applicationPriorityEnum('priority').notNull().default('medium'),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    notes: text('notes'),
    resumeVersionId: uuid('resume_version_id'),
    coverLetterId: uuid('cover_letter_id'),
    sourceChannel: text('source_channel'),
    referralContact: text('referral_contact'),
    rejectionStage: rejectionStageEnum('rejection_stage'),
    rejectionReason: text('rejection_reason'),
    rejectionReceivedAt: timestamp('rejection_received_at', { withTimezone: true }),
    daysInProcess: integer('days_in_process'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('applications_user_job_idx').on(t.userId, t.jobId),
    index('applications_user_status_idx').on(t.userId, t.status),
    index('applications_user_id_idx').on(t.userId),
  ],
)

export const applicationHistory = pgTable(
  'application_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromStatus: applicationStatusEnum('from_status'),
    toStatus: applicationStatusEnum('to_status').notNull(),
    rejectionStage: rejectionStageEnum('rejection_stage'),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('app_history_application_id_idx').on(t.applicationId)],
)

export const resumeTailoredVersions = pgTable('resume_tailored_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  baseResumeId: uuid('base_resume_id')
    .notNull()
    .references(() => resumes.id),
  jobId: uuid('job_id')
    .notNull()
    .references(() => jobs.id),
  contentJson: jsonb('content_json').notNull().default({}),
  contentLatex: text('content_latex'),
  contentMarkdown: text('content_markdown'),
  addedKeywords: text('added_keywords').array().notNull().default([]),
  removedSections: text('removed_sections').array().notNull().default([]),
  atsRecommendations: jsonb('ats_recommendations').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const coverLetters = pgTable('cover_letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => jobs.id),
  type: coverLetterTypeEnum('type').notNull().default('cover_letter'),
  contentText: text('content_text').notNull(),
  contentMarkdown: text('content_markdown'),
  contentLatex: text('content_latex'),
  tone: coverLetterToneEnum('tone').notNull().default('formal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const recruiterContacts = pgTable(
  'recruiter_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    title: text('title'),
    companyId: uuid('company_id').references(() => companies.id),
    companyNameRaw: text('company_name_raw'),
    email: text('email'),
    linkedinUrl: text('linkedin_url'),
    phone: text('phone'),
    notes: text('notes'),
    source: recruiterSourceEnum('source').notNull().default('linkedin'),
    outreachStatus: outreachStatusEnum('outreach_status').notNull().default('not_contacted'),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    nextFollowupAt: timestamp('next_followup_at', { withTimezone: true }),
    relatedApplicationId: uuid('related_application_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('recruiter_contacts_user_id_idx').on(t.userId),
    index('recruiter_contacts_outreach_status_idx').on(t.outreachStatus),
  ],
)

export const recruiterOutreachHistory = pgTable(
  'recruiter_outreach_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recruiterId: uuid('recruiter_id')
      .notNull()
      .references(() => recruiterContacts.id, { onDelete: 'cascade' }),
    type: outreachTypeEnum('type').notNull(),
    platform: outreachPlatformEnum('platform').notNull(),
    contentSummary: text('content_summary'),
    outcome: outreachOutcomeEnum('outcome'),
    contactedAt: timestamp('contacted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('outreach_history_recruiter_id_idx').on(t.recruiterId)],
)

export const digests = pgTable(
  'digests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    digestDate: date('digest_date').notNull(),
    newJobsCount: integer('new_jobs_count').notNull().default(0),
    topMatches: jsonb('top_matches').notNull().default([]),
    actionsRequired: jsonb('actions_required').notNull().default([]),
    recommendedApplications: jsonb('recommended_applications').notNull().default([]),
    skillRecommendations: jsonb('skill_recommendations').notNull().default([]),
    contentHtml: text('content_html'),
    contentMarkdown: text('content_markdown'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('digests_user_date_idx').on(t.userId, t.digestDate)],
)

export const scrapeLogs = pgTable(
  'scrape_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => jobSources.id),
    companyId: uuid('company_id').references(() => companies.id),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: scrapeStatusEnum('status').notNull().default('running'),
    jobsFound: integer('jobs_found').notNull().default(0),
    jobsNew: integer('jobs_new').notNull().default(0),
    jobsUpdated: integer('jobs_updated').notNull().default(0),
    jobsDuplicate: integer('jobs_duplicate').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('scrape_logs_source_id_idx').on(t.sourceId),
    index('scrape_logs_started_at_idx').on(t.startedAt),
  ],
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(candidateProfiles, { fields: [users.id], references: [candidateProfiles.userId] }),
  preferences: one(userPreferences, { fields: [users.id], references: [userPreferences.userId] }),
  resumes: many(resumes),
  applications: many(applications),
  coverLetters: many(coverLetters),
  digests: many(digests),
  recruiterContacts: many(recruiterContacts),
}))

export const companiesRelations = relations(companies, ({ one, many }) => ({
  intelligence: one(companyIntelligence, {
    fields: [companies.id],
    references: [companyIntelligence.companyId],
  }),
  jobs: many(jobs),
  recruiterContacts: many(recruiterContacts),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  source: one(jobSources, { fields: [jobs.sourceId], references: [jobSources.id] }),
  matches: many(jobMatches),
  atsAnalyses: many(atsAnalyses),
  applications: many(applications),
  tailoredVersions: many(resumeTailoredVersions),
  coverLetters: many(coverLetters),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  history: many(applicationHistory),
}))
