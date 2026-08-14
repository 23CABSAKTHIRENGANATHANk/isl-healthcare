/**
 * Domain types for ISL Setu.
 * Shaped to mirror the future backend tables (users, lessons, signs, progress,
 * assessments, certificates, hospitals, staff, achievements) so the service
 * layer can swap mock data for real queries without touching components.
 */

export type Sector = "healthcare" | "education" | "government" | "banking" | "workplace";

export type HealthcareRole =
  "nurse" | "receptionist" | "pharmacist" | "asha_anm" | "security" | "doctor" | "counsellor";

export const HEALTHCARE_ROLES: { value: HealthcareRole; label: string }[] = [
  { value: "nurse", label: "Nurse" },
  { value: "receptionist", label: "Receptionist" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "asha_anm", label: "ASHA / ANM Worker" },
  { value: "security", label: "Security Staff" },
  { value: "doctor", label: "Doctor" },
  { value: "counsellor", label: "Counsellor" },
];

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type CertificationTier = "bronze" | "silver" | "gold";

/** users */
export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  role: HealthcareRole;
  hospital_id: string | null;
  sector: Sector;
  level: CertificationTier;
  created_at: string;
}

/** signs */
export interface Sign {
  id: string;
  gloss: string;
  meaning: string;
  category_id: string;
  difficulty: Difficulty;
  /** Regional variation label — ISL varies across regions; never presented as universal. */
  region_note: string;
  video_url: string | null;
  steps: string[];
}

/** lesson categories */
export interface SignCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sector: Sector;
}

/** lessons */
export interface Lesson {
  id: string;
  slug: string;
  code: string;
  title: string;
  summary: string;
  category_id: string;
  duration_minutes: number;
  difficulty: Difficulty;
  sign_ids: string[];
  thumbnail_tone: "primary" | "teal" | "gold" | "success";
  captions: { at: number; text: string }[];
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  kind: "identify" | "match" | "multiple_choice" | "camera_task";
  options: string[];
  answer: string;
  target_sign?: string | undefined;
  hint?: string | undefined;
}

/** progress */
export interface LessonProgress {
  lesson_id: string;
  user_id: string;
  percent: number;
  completed: boolean;
  last_opened_at: string;
}

export interface UserProgressSummary {
  overall_percent: number;
  level: CertificationTier;
  streak_days: number;
  accuracy_percent: number;
  daily_goal_minutes: number;
  daily_goal_done_minutes: number;
  signs_learned: number;
  weekly: { day: string; minutes: number; accuracy: number }[];
}

/** activity feed */
export interface ActivityItem {
  id: string;
  kind: "lesson" | "practice" | "assessment" | "certificate";
  title: string;
  detail: string;
  at: string;
}

/** achievements */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at: string | null;
}

/** assessments */
export interface Assessment {
  id: string;
  tier: CertificationTier;
  title: string;
  duration_minutes: number;
  questions: QuizQuestion[];
  pass_percent: number;
}

export interface AssessmentResult {
  score: number;
  total: number;
  accuracy_percent: number;
  passed: boolean;
  tier: CertificationTier;
}

/** certificates */
export interface Certificate {
  id: string;
  tier: CertificationTier;
  title: string;
  subtitle: string;
  requirements: string[];
  signs_required: number;
  signs_completed: number;
  status: "completed" | "in_progress" | "locked";
  issued_at: string | null;
  credential_id: string | null;
}

/** hospitals */
export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  readiness: "not_started" | "in_progress" | "isl_ready";
  departments_covered: number;
  departments_total: number;
  last_training_at: string;
}

/** staff */
export interface StaffMember {
  id: string;
  full_name: string;
  role: HealthcareRole;
  department: string;
  certification: CertificationTier | null;
  progress_percent: number;
  status: "active" | "training" | "inactive";
}

export interface HospitalAnalytics {
  certification_progress: { month: string; bronze: number; silver: number; gold: number }[];
  department_coverage: { department: string; covered: number }[];
  monthly_training: { month: string; hours: number }[];
}

/** AI recognition — the shape a real endpoint will return. */
export interface SignPrediction {
  sign: string;
  confidence: number;
  /** true whenever the result comes from simulated Demo Mode, not a real model. */
  demo: boolean;
}
