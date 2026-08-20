/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Assessment and certification service with Supabase backend integration.
 */
import { supabase, from as dbFrom } from "@/integrations/supabase/client";
import { bronzeAssessment, certificates as mockCertificates } from "./mock/data";
import { unlockAchievement } from "./progress.service";
import type { Assessment, AssessmentResult, Certificate, QuizQuestion } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

async function getAuthUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function getAssessment(tier = "bronze"): Promise<Assessment | null> {
  try {
    const { data: assessmentRow, error } = await dbFrom("assessments")
      .select("*")
      .eq("tier", tier)
      .maybeSingle();

    if (!error && assessmentRow) {
      const { data: questionRows } = await dbFrom("assessment_questions")
        .select("*")
        .eq("assessment_id", assessmentRow.id)
        .order("order_index", { ascending: true });

      const questions: QuizQuestion[] = (questionRows ?? []).map((q: any) => ({
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

export function scoreAssessment(
  assessment: Assessment,
  answers: Record<string, string>,
): AssessmentResult {
  const total = assessment.questions.length;
  const score = assessment.questions.filter(
    (question) => answers[question.id] === question.answer,
  ).length;
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
    await dbFrom("assessment_results").insert({
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

      await dbFrom("certificates").insert({
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
      await dbFrom("profiles")
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

  const tiersConfig = [
    {
      tier: "bronze" as const,
      title: "Bronze ISL Healthcare Certificate",
      subtitle: "Clinical Greetings & Patient Reception",
      requirements: [
        "Complete Healthcare Curriculum",
        "Pass Timed Assessment (>=75%)",
        "Adhere to Healthcare Communication Code",
      ],
      signsRequired: 10,
    },
    {
      tier: "silver" as const,
      title: "Silver ISL Healthcare Certificate",
      subtitle: "Clinical & Emergency Triage",
      requirements: [
        "Complete Clinical Triage Lesson",
        "Pass Timed Silver Assessment (>=75%)",
        "Demonstrate Real-Time AI Camera Accuracy",
      ],
      signsRequired: 25,
    },
    {
      tier: "gold" as const,
      title: "Gold ISL Healthcare Master Certificate",
      subtitle: "Comprehensive Clinical & Hospital Mastery",
      requirements: [
        "Master All 5 Healthcare Modules (70+ Signs)",
        "Pass Comprehensive Gold Clinical Assessment",
        "Complete 50+ Real-Time VoiceBridge Translations",
      ],
      signsRequired: 50,
    },
  ];

  try {
    let earnedCerts: any[] = [];
    let completedSignsCount = 0;

    if (userId) {
      const { data: certData } = await dbFrom("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });
      earnedCerts = certData ?? [];

      const { data: progData } = await dbFrom("lesson_progress")
        .select("*")
        .eq("user_id", userId);

      const completedProg = (progData ?? []).filter((p: any) => p.completed);
      completedSignsCount = completedProg.length * 5;
    }

    const bronzeEarned = earnedCerts.find((c: any) => c.tier === "bronze");
    const silverEarned = earnedCerts.find((c: any) => c.tier === "silver");
    const goldEarned = earnedCerts.find((c: any) => c.tier === "gold");

    return tiersConfig.map((cfg) => {
      const earned =
        cfg.tier === "bronze" ? bronzeEarned : cfg.tier === "silver" ? silverEarned : goldEarned;

      if (earned) {
        return {
          id: earned.id || `cert-${cfg.tier}`,
          tier: cfg.tier,
          title: cfg.title,
          subtitle: cfg.subtitle,
          requirements: cfg.requirements,
          signs_required: cfg.signsRequired,
          signs_completed: cfg.signsRequired,
          status: "completed" as const,
          issued_at: earned.issued_at,
          credential_id: earned.certificate_number || `ISL-SETU-${cfg.tier.toUpperCase()}-2026`,
        };
      }

      let status: "in_progress" | "locked" = "locked";
      let signsCompleted = 0;

      if (cfg.tier === "bronze") {
        status = "in_progress";
        signsCompleted = Math.min(cfg.signsRequired, completedSignsCount);
      } else if (cfg.tier === "silver") {
        if (bronzeEarned) {
          status = "in_progress";
          signsCompleted = Math.min(cfg.signsRequired, Math.max(0, completedSignsCount - 10));
        }
      } else if (cfg.tier === "gold") {
        if (silverEarned) {
          status = "in_progress";
          signsCompleted = Math.min(cfg.signsRequired, Math.max(0, completedSignsCount - 35));
        }
      }

      return {
        id: `cert-${cfg.tier}`,
        tier: cfg.tier,
        title: cfg.title,
        subtitle: cfg.subtitle,
        requirements: cfg.requirements,
        signs_required: cfg.signsRequired,
        signs_completed: signsCompleted,
        status,
        issued_at: null,
      };
    });
  } catch (err) {
    console.warn("[AssessmentService] listCertificates dynamic fallback:", err);
  }

  return tiersConfig.map((cfg) => ({
    id: `cert-${cfg.tier}`,
    tier: cfg.tier,
    title: cfg.title,
    subtitle: cfg.subtitle,
    requirements: cfg.requirements,
    signs_required: cfg.signsRequired,
    signs_completed: 0,
    status: cfg.tier === "bronze" ? ("in_progress" as const) : ("locked" as const),
    issued_at: null,
  }));
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const allCerts = await listCertificates();
  return allCerts.find((cert) => cert.id === id || cert.credential_id === id) ?? null;
}
