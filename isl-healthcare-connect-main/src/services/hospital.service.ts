/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hospital, staff and facility analytics service with Supabase backend integration.
 */
import { supabase, from as dbFrom } from "@/integrations/supabase/client";
import {
  hospital as mockHospital,
  hospitalAnalytics as mockHospitalAnalytics,
  staff as mockStaff,
} from "./mock/data";
import type { Hospital, HospitalAnalytics, StaffMember } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function getHospital(hospitalId?: string): Promise<Hospital> {
  try {
    const query = dbFrom("hospitals").select("*");
    const { data, error } = hospitalId
      ? await query.eq("id", hospitalId).maybeSingle()
      : await query.limit(1).maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        city: data.city,
        state: data.state,
        readiness: data.readiness as Hospital["readiness"],
        departments_covered: data.departments_covered,
        departments_total: data.departments_total,
        last_training_at: "2 days ago",
      };
    }
  } catch (err) {
    console.warn("[HospitalService] getHospital fallback:", err);
  }

  return clone(mockHospital);
}

export async function listHospitals(): Promise<Hospital[]> {
  const primary = await getHospital();
  return [primary];
}

export async function listStaff(hospitalId?: string): Promise<StaffMember[]> {
  try {
    const query = dbFrom("hospital_staff").select("*");
    const { data, error } = hospitalId ? await query.eq("hospital_id", hospitalId) : await query;

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        role: row.role as StaffMember["role"],
        department: row.department,
        certification: row.certification as StaffMember["certification"],
        progress_percent: row.progress_percent,
        status: row.status as StaffMember["status"],
      }));
    }
  } catch (err) {
    console.warn("[HospitalService] listStaff fallback:", err);
  }

  return clone(mockStaff);
}

export async function getHospitalAnalytics(): Promise<HospitalAnalytics> {
  return clone(mockHospitalAnalytics);
}

export function certifiedCounts(members: StaffMember[]) {
  return {
    total: members.filter((m) => m.certification !== null).length,
    bronze: members.filter((m) => m.certification === "bronze").length,
    silver: members.filter((m) => m.certification === "silver").length,
    gold: members.filter((m) => m.certification === "gold").length,
  };
}

export async function addStaffMember(input: {
  hospitalId: string;
  fullName: string;
  role: string;
  department: string;
  certification?: string | null;
  progressPercent?: number;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await dbFrom("hospital_staff").insert({
      hospital_id: input.hospitalId,
      full_name: input.fullName,
      role: input.role,
      department: input.department,
      certification: input.certification || null,
      progress_percent: input.progressPercent || 0,
      status: "active",
    } as never);

    return { error: error?.message ?? null };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
