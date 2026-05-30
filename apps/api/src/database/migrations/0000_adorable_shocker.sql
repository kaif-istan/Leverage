CREATE TYPE "public"."application_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('saved', 'applied', 'oa_received', 'hr_screen_scheduled', 'hr_screen_completed', 'technical_screen_scheduled', 'technical_screen_completed', 'hiring_manager_scheduled', 'hiring_manager_completed', 'final_round_scheduled', 'final_round_completed', 'offer_received', 'offer_accepted', 'offer_declined', 'rejected_after_oa', 'rejected_after_hr', 'rejected_after_technical', 'rejected_after_hiring_manager', 'rejected_after_final', 'ghosted', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."ats_platform" AS ENUM('greenhouse', 'lever', 'ashby', 'workday', 'unknown', 'none');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('public', 'private', 'nonprofit', 'government', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."cover_letter_tone" AS ENUM('formal', 'casual', 'enthusiastic');--> statement-breakpoint
CREATE TYPE "public"."cover_letter_type" AS ENUM('cover_letter', 'recruiter_message', 'linkedin_connect', 'thank_you');--> statement-breakpoint
CREATE TYPE "public"."discovery_queue_status" AS ENUM('pending', 'probing', 'confirmed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."discovery_source" AS ENUM('yc_directory', 'wellfound', 'manual_seed', 'self_referral', 'github');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."funding_stage" AS ENUM('bootstrapped', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d_plus', 'public', 'acquired', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."hiring_velocity" AS ENUM('growing', 'stable', 'shrinking', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."ingestion_stage" AS ENUM('raw', 'normalized', 'embedded', 'scored');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('remote', 'hybrid', 'onsite', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."outreach_outcome" AS ENUM('no_response', 'replied', 'scheduled', 'referred', 'declined');--> statement-breakpoint
CREATE TYPE "public"."outreach_platform" AS ENUM('linkedin', 'email', 'phone', 'other');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('not_contacted', 'connected', 'messaged', 'replied', 'referred', 'interview_scheduled', 'relationship_active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."outreach_type" AS ENUM('connection_request', 'message', 'email', 'reply', 'call', 'referral');--> statement-breakpoint
CREATE TYPE "public"."probe_status" AS ENUM('pending', 'confirmed', 'failed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."recruiter_source" AS ENUM('linkedin', 'referral', 'inbound', 'conference', 'other');--> statement-breakpoint
CREATE TYPE "public"."rejection_stage" AS ENUM('oa', 'hr', 'technical', 'hiring_manager', 'final', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."remote_preference" AS ENUM('remote', 'hybrid', 'onsite', 'any');--> statement-breakpoint
CREATE TYPE "public"."scrape_status" AS ENUM('running', 'success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."seniority_level" AS ENUM('intern', 'junior', 'mid', 'senior', 'staff', 'director', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."skill_extraction_method" AS ENUM('taxonomy', 'hybrid');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"rejection_stage" "rejection_stage",
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'saved' NOT NULL,
	"priority" "application_priority" DEFAULT 'medium' NOT NULL,
	"applied_at" timestamp with time zone,
	"notes" text,
	"resume_version_id" uuid,
	"cover_letter_id" uuid,
	"source_channel" text,
	"referral_contact" text,
	"rejection_stage" "rejection_stage",
	"rejection_reason" text,
	"rejection_received_at" timestamp with time zone,
	"days_in_process" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ats_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"ats_score" real DEFAULT 0 NOT NULL,
	"keyword_match_rate" real DEFAULT 0 NOT NULL,
	"matched_keywords" text[] DEFAULT '{}' NOT NULL,
	"missing_required_keywords" text[] DEFAULT '{}' NOT NULL,
	"missing_preferred_keywords" text[] DEFAULT '{}' NOT NULL,
	"format_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"section_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stage1_completed_at" timestamp with time zone,
	"ai_recommendations" jsonb,
	"stage2_completed_at" timestamp with time zone,
	"tailored_resume_id" uuid,
	"cache_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text,
	"location" text,
	"linkedin_url" text,
	"github_url" text,
	"portfolio_url" text,
	"summary" text,
	"total_yoe" real,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"education" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"work_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_roles" text[] DEFAULT '{}' NOT NULL,
	"target_locations" text[] DEFAULT '{}' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"remote_preference" "remote_preference" DEFAULT 'any' NOT NULL,
	"embedding" vector(768),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text,
	"logo_url" text,
	"industry" text,
	"size_range" text,
	"hq_location" text,
	"description" text,
	"linkedin_url" text,
	"glassdoor_url" text,
	"careerpage_url" text,
	"ats_platform" "ats_platform" DEFAULT 'unknown' NOT NULL,
	"ats_slug" text,
	"ats_verified_at" timestamp with time zone,
	"greenhouse_slug" text,
	"lever_slug" text,
	"ashby_slug" text,
	"discovery_source" "discovery_source",
	"is_monitored" boolean DEFAULT false NOT NULL,
	"monitoring_enabled_at" timestamp with time zone,
	"probe_status" "probe_status" DEFAULT 'pending' NOT NULL,
	"probe_last_attempted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "companies_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_count" integer,
	"employee_count_range" text,
	"employee_count_source" text,
	"funding_stage" "funding_stage",
	"total_funding_usd" bigint,
	"last_funding_date" date,
	"last_funding_round" text,
	"investors" text[],
	"funding_source" text,
	"glassdoor_rating" real,
	"glassdoor_reviews_count" integer,
	"glassdoor_ceo_approval" real,
	"industry" text,
	"sub_industry" text,
	"company_type" "company_type",
	"founded_year" integer,
	"tech_stack" text[],
	"tech_stack_source" text,
	"jobs_posted_30d" integer,
	"jobs_posted_90d" integer,
	"hiring_velocity" "hiring_velocity" DEFAULT 'unknown' NOT NULL,
	"enrichment_sources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enrichment_quality_score" real DEFAULT 0 NOT NULL,
	"last_enriched_at" timestamp with time zone,
	"next_enrichment_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_intelligence_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cover_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"type" "cover_letter_type" DEFAULT 'cover_letter' NOT NULL,
	"content_text" text NOT NULL,
	"content_markdown" text,
	"content_latex" text,
	"tone" "cover_letter_tone" DEFAULT 'formal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"digest_date" date NOT NULL,
	"new_jobs_count" integer DEFAULT 0 NOT NULL,
	"top_matches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions_required" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_applications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skill_recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_html" text,
	"content_markdown" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discovered_companies_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "discovery_source" NOT NULL,
	"company_name" text NOT NULL,
	"website_url" text,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "discovery_queue_status" DEFAULT 'pending' NOT NULL,
	"probe_attempts" integer DEFAULT 0 NOT NULL,
	"last_probe_at" timestamp with time zone,
	"next_probe_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"overall_score" real DEFAULT 0 NOT NULL,
	"semantic_score" real DEFAULT 0 NOT NULL,
	"keyword_score" real DEFAULT 0 NOT NULL,
	"seniority_score" real DEFAULT 0 NOT NULL,
	"location_score" real DEFAULT 0 NOT NULL,
	"freshness_score" real DEFAULT 0 NOT NULL,
	"opportunity_score" real DEFAULT 0 NOT NULL,
	"opportunity_rank" integer,
	"salary_signal" real DEFAULT 0.5 NOT NULL,
	"company_quality_signal" real DEFAULT 0.5 NOT NULL,
	"hiring_velocity_signal" real DEFAULT 0.5 NOT NULL,
	"remote_signal" real DEFAULT 0.5 NOT NULL,
	"freshness_signal" real DEFAULT 0.5 NOT NULL,
	"weights_snapshot" jsonb,
	"opportunity_boost_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"opportunity_computed_at" timestamp with time zone,
	"matched_skills" text[] DEFAULT '{}' NOT NULL,
	"missing_required_skills" text[] DEFAULT '{}' NOT NULL,
	"missing_preferred_skills" text[] DEFAULT '{}' NOT NULL,
	"match_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"salary_estimate_min" integer,
	"salary_estimate_max" integer,
	"salary_confidence" real,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"profile_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"base_url" text NOT NULL,
	"adapter_type" "ats_platform" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_scraped_at" timestamp with time zone,
	"scrape_interval_minutes" integer DEFAULT 120 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description_raw" text,
	"description_text" text DEFAULT '' NOT NULL,
	"description_structured" jsonb,
	"location" text,
	"location_type" "location_type" DEFAULT 'unknown' NOT NULL,
	"employment_type" "employment_type" DEFAULT 'unknown' NOT NULL,
	"seniority_level" "seniority_level" DEFAULT 'unknown' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text,
	"required_skills" text[] DEFAULT '{}' NOT NULL,
	"preferred_skills" text[] DEFAULT '{}' NOT NULL,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"years_experience_required" real,
	"apply_url" text NOT NULL,
	"posted_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(768),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"duplicate_of_id" uuid,
	"ingestion_stage" "ingestion_stage" DEFAULT 'raw' NOT NULL,
	"skills_extracted_method" "skill_extraction_method",
	"seniority_detected_method" text,
	"url_hash" text NOT NULL,
	"fingerprint_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_url_unique" UNIQUE("url"),
	CONSTRAINT "jobs_url_hash_unique" UNIQUE("url_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruiter_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"title" text,
	"company_id" uuid,
	"company_name_raw" text,
	"email" text,
	"linkedin_url" text,
	"phone" text,
	"notes" text,
	"source" "recruiter_source" DEFAULT 'linkedin' NOT NULL,
	"outreach_status" "outreach_status" DEFAULT 'not_contacted' NOT NULL,
	"last_contact_at" timestamp with time zone,
	"next_followup_at" timestamp with time zone,
	"related_application_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruiter_outreach_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"type" "outreach_type" NOT NULL,
	"platform" "outreach_platform" NOT NULL,
	"content_summary" text,
	"outcome" "outreach_outcome",
	"contacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_tailored_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"base_resume_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_latex" text,
	"content_markdown" text,
	"added_keywords" text[] DEFAULT '{}' NOT NULL,
	"removed_sections" text[] DEFAULT '{}' NOT NULL,
	"ats_recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text DEFAULT 'application/pdf' NOT NULL,
	"raw_text" text,
	"parsed_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrape_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"company_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "scrape_status" DEFAULT 'running' NOT NULL,
	"jobs_found" integer DEFAULT 0 NOT NULL,
	"jobs_new" integer DEFAULT 0 NOT NULL,
	"jobs_updated" integer DEFAULT 0 NOT NULL,
	"jobs_duplicate" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"opportunity_weights" jsonb DEFAULT '{"matchWeight":0.3,"salaryWeight":0.25,"companyQualityWeight":0.2,"hiringVelocityWeight":0.1,"remoteWeight":0.08,"freshnessWeight":0.07}'::jsonb NOT NULL,
	"salary_min" integer,
	"salary_currency" text DEFAULT 'USD' NOT NULL,
	"remote_preference" "remote_preference" DEFAULT 'any' NOT NULL,
	"target_seniority" text[],
	"digest_time" time DEFAULT '07:00' NOT NULL,
	"digest_enabled" boolean DEFAULT true NOT NULL,
	"min_opportunity_score_alert" integer DEFAULT 85 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_history" ADD CONSTRAINT "application_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ats_analyses" ADD CONSTRAINT "ats_analyses_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ats_analyses" ADD CONSTRAINT "ats_analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ats_analyses" ADD CONSTRAINT "ats_analyses_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_intelligence" ADD CONSTRAINT "company_intelligence_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digests" ADD CONSTRAINT "digests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recruiter_contacts" ADD CONSTRAINT "recruiter_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recruiter_contacts" ADD CONSTRAINT "recruiter_contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recruiter_outreach_history" ADD CONSTRAINT "recruiter_outreach_history_recruiter_id_recruiter_contacts_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter_contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_tailored_versions" ADD CONSTRAINT "resume_tailored_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_tailored_versions" ADD CONSTRAINT "resume_tailored_versions_base_resume_id_resumes_id_fk" FOREIGN KEY ("base_resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_tailored_versions" ADD CONSTRAINT "resume_tailored_versions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_history_application_id_idx" ON "application_history" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "applications_user_job_idx" ON "applications" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_user_status_idx" ON "applications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ats_analyses_cache_key_idx" ON "ats_analyses" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_analyses_job_id_idx" ON "ats_analyses" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_analyses_resume_id_idx" ON "ats_analyses" USING btree ("resume_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_domain_idx" ON "companies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_is_monitored_idx" ON "companies" USING btree ("is_monitored");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_ats_platform_idx" ON "companies" USING btree ("ats_platform");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "digests_user_date_idx" ON "digests" USING btree ("user_id","digest_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dcq_status_idx" ON "discovered_companies_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dcq_next_probe_idx" ON "discovered_companies_queue" USING btree ("next_probe_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_matches_job_profile_idx" ON "job_matches" USING btree ("job_id","profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_matches_opportunity_score_idx" ON "job_matches" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_matches_overall_score_idx" ON "job_matches" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_matches_profile_id_idx" ON "job_matches" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_is_active_scraped_at_idx" ON "jobs" USING btree ("is_active","scraped_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_posted_at_idx" ON "jobs" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_seniority_idx" ON "jobs" USING btree ("seniority_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_location_type_idx" ON "jobs" USING btree ("location_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_fingerprint_hash_idx" ON "jobs" USING btree ("fingerprint_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_ingestion_stage_idx" ON "jobs" USING btree ("ingestion_stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recruiter_contacts_user_id_idx" ON "recruiter_contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recruiter_contacts_outreach_status_idx" ON "recruiter_contacts" USING btree ("outreach_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outreach_history_recruiter_id_idx" ON "recruiter_outreach_history" USING btree ("recruiter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scrape_logs_source_id_idx" ON "scrape_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scrape_logs_started_at_idx" ON "scrape_logs" USING btree ("started_at");