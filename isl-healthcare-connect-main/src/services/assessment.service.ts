/**
 * Assessment and certification service with Supabase backend integration.
 */
import { supabase } from "@/integrations/supabase/client";
import { bronzeAssessment, certificates as mockCertificates } from "./mock/data";
import { unlockAchievement } from "./progress.service";
import type { Assessment, AssessmentResult, Certificate, QuizQuestion } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getAuthUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function getAssessment(tier = "bronze"): Promise<Assessment | null> {
  try {
    const { data: assessmentRow, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("tier", tier)
      .maybeSingle();

    if (!error && assessmentRow) {
      const { data: questionRows } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("assessment_id", assessmentRow.id)
        .order("order_index", { ascending: true });

      const questions: QuizQuestion[] = (questionRows ?? []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        kind: q.kind as QuizQuestion["kind"],
        options: (Array.isArray(q.options) ? q.options : []) as string[],
        answer: q.answer,
        target_sign: q.target_sign || undefined,
        hint: q.hint || undefined,
      }));

      return {
        id: assessmentRow.id,
        tier: assessmentRow.tier as Assessment["tier"],
        title: assessmentRow.title,
        duration_minutes: assessmentRow.duration_minutes,
        pass_percent: assessmentRow.passing_score,
        questions: questions.length > 0 ? questions : bronzeAssessment.questions,
      };
    }
  } catch (err) {
    console.warn("[AssessmentService] getAssessment fallback:", err);
  }

  return tier === "bronze" ? clone(bronzeAssessment) : null;
}

export function scoreAssessment(assessment: Assessment, answers: Record<string, string>): AssessmentResult {
  const total = assessment.questions.length;
  const score = assessment.questions.filter((question) => answers[question.id] === question.answer).length;
  const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);
  return {
    score,
    total,
    accuracy_percent: accuracy,
    passed: accuracy >= assessment.pass_percent,
    tier: assessment.tier,
  };
}

export async function submitAssessment({
  assessment,
  answers,
}: {
  assessment: Assessment;
  answers: Record<string, string>;
}): Promise<AssessmentResult & { certificateNumber?: string }> {
  const result = scoreAssessment(assessment, answers);
  const userId = await getAuthUserId();

  if (!userId) return result;

  try {
    // 1. Record result in database
    await supabase.from("assessment_results").insert({
      user_id: userId,
      assessment_id: assessment.id,
      score: result.score,
      total: result.total,
      accuracy_percent: result.accuracy_percent,
      passed: result.passed,
      tier: result.tier,
    } as never);

    // 2. If passed, generate certificate & achievements
    if (result.passed) {
      const certNumber = `ISL-${assessment.tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await supabase.from("certificates").insert({
        user_id: userId,
        tier: assessment.tier,
        title: `${assessment.tier.charAt(0).toUpperCase() + assessment.tier.slice(1)} Healthcare ISL Credential`,
        subtitle: "Foundation Healthcare Indian Sign Language Proficiency",
        certificate_number: certNumber,
        score: result.accuracy_percent,
        status: "completed",
      } as never);

      // Unlock achievements
      await unlockAchievement("first_assessment", userId);
      if (assessment.tier === "bronze") {
        await unlockAchievement("bronze_certified", userId);
      }

      // Update profile current_level
      await supabase
        .from("profiles")
        .update({ current_level: assessment.tier, updated_at: new Date().toISOString() } as never)
        .eq("id", userId);

      return { ...result, certificateNumber: certNumber };
    }
  } catch (err) {
    console.warn("[AssessmentService] submitAssessment recording:", err);
  }

  return result;
}

export async function listCertificates(): Promise<Certificate[]> {
  const userId = await getAuthUserId();

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const userCerts = userId ? data.filter((c) => c.user_id === userId) : data;
      if (userCerts.length > 0) {
        return userCerts.map((row) => ({
          id: row.id,
          tier: row.tier as Certificate["tier"],
          title: row.title,
          subtitle: row.subtitle,
          requirements: ["Complete Healthcare Curriculum", "Pass Timed Assessment (>=75%)", "Adhere to Responsible AI Code"],
          signs_required: row.tier === "bronze" ? 40 : row.tier === "silver" ? 150 : 300,
          signs_completed: row.tier === "bronze" ? 40 : row.tier === "silver" ? 150 : 300,
          status: row.status as Certificate["status"],
          issued_at: row.issued_at,
          credential_id: row.certificate_number,
        }));
      }
    }
  } catch (err) {
    console.warn("[AssessmentService] listCertificates fallback:", err);
  }

  return clone(mockCertificates);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const allCerts = await listCertificates();
  return allCerts.find((cert) => cert.id === id || cert.credential_id === id) ?? null;
}
