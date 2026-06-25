import type { Role, GoodToCall, CandidateStatus, JobStatus, SendStatus } from "@prisma/client";

export type { Role, GoodToCall, CandidateStatus, JobStatus, SendStatus };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LLMEvaluationResult {
  name: string;
  email: string | null;
  mobile: string | null;
  overall_experience_years: number;
  relevant_experience_years: number;
  matched_must_have: string[];
  missing_must_have: string[];
  matched_nice_to_have: string[];
  strengths: string[];
  missing_skills: string[];
  domain_match: number;
  seniority_match: number;
  rationale: string;
  recruiter_mandatory_met?: boolean;
  recruiter_mandatory_gaps?: string[];
}

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: Array<{ company: string; role: string; years: number }>;
  education: Array<{ degree: string; institution: string }>;
  projects: string[];
  rawText: string;
}

export interface ScoreBreakdown {
  mustHaveScore: number;
  experienceScore: number;
  niceToHaveScore: number;
  domainScore: number;
  roleScore: number;
  total: number;
  totalMustHave: number;
  matchedMustHave: number;
  missingMustHave: number;
}

export interface MustHaveStats {
  totalMustHave: number;
  matchedMustHave: number;
  missingMustHave: number;
}

export interface ExperienceIntelligenceBreakdown {
  relevantRoleExperience: number;
  businessImpact: number;
  technicalComplexity: number;
  leadershipOwnership: number;
  companyRelevance: number;
  yearsExperience: number;
}

export interface AgencyExperienceDetail {
  agencyName: string;
  agencyType: string;
  role: string;
  responsibilities: string[];
  campaignTypes: string[];
  platforms: string[];
  benefitsForRole: string;
}

export interface CompanyExperienceDetail {
  companyName: string;
  industry: string;
  companyDescription: string;
  whatCompanyDoes: string;
  role: string;
  duration: string;
  companyUrl?: string | null;
  companyDomain?: string | null;
  keyResponsibilities: string[];
  projects: string[];
  technologies: string[];
  businessImpact: string;
  achievements: string[];
  leadershipResponsibilities: string[];
  relevantSkillsGained: string[];
  valueForHiringRole: string;
}

export interface ExperienceRoleTimeline {
  role: string;
  company: string;
  duration: string;
  order: number;
}

export interface ExperienceHiringValue {
  whyValuable: string;
  experienceTransfer: string;
  businessValue: string;
  technicalStrengths: string[];
  potentialRisks: string[];
  interviewFocus: string[];
}

export interface ExperienceIntelligenceResult {
  score: number;
  breakdown: ExperienceIntelligenceBreakdown;
  scoreRationale: string;
  currentCompany: string;
  currentRole: string;
  industry: string;
  experienceLevel: string;
  companyRating: string;
  impactRating: string;
  hasAgencyExperience: boolean;
  agencyBadgeType: string | null;
  /** True when agency experience received a modest EI boost for a marketing-relevant JD */
  agencyRelevantToJd?: boolean;
  overallRecommendation: string;
  aiExperienceSummary: string;
  hiringValue: ExperienceHiringValue;
  agencyExperience: AgencyExperienceDetail | null;
  companies: CompanyExperienceDetail[];
  previousRolesTimeline: ExperienceRoleTimeline[];
}

export interface JobFormData {
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  minExperience: number;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  jdText: string;
  scoreThreshold?: number;
  mandatoryRequirements?: string;
}

export interface ProcessingStatus {
  jobId: string;
  title?: string;
  minExperience?: number;
  scoreThreshold?: number;
  modelName?: string;
  total: number;
  parsed: number;
  evaluated: number;
  failed?: number;
  finished?: number;
  isComplete?: boolean;
  isActive?: boolean;
  currentStage: string;
  etaSeconds?: number;
  candidates: Array<{
    id: string;
    name: string | null;
    status: CandidateStatus;
    score: number | null;
    goodToCall?: GoodToCall | null;
    aiRationale?: string | null;
    strengths?: string[];
    relevantExperience?: number | null;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
