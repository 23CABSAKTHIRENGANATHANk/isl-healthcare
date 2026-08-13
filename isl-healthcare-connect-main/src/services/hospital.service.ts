/**
 * Hospital, staff and facility analytics service.
 */
import { hospital, hospitalAnalytics, staff } from "./mock/data";
import type { Hospital, HospitalAnalytics, StaffMember } from "@/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const latency = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getHospital(): Promise<Hospital> {
  await latency();
  return clone(hospital);
}

export async function listStaff(): Promise<StaffMember[]> {
  await latency();
  return clone(staff);
}

export async function getHospitalAnalytics(): Promise<HospitalAnalytics> {
  await latency();
  return clone(hospitalAnalytics);
}

export function certifiedCounts(members: StaffMember[]) {
  return {
    total: members.filter((m) => m.certification !== null).length,
    bronze: members.filter((m) => m.certification === "bronze").length,
    silver: members.filter((m) => m.certification === "silver").length,
    gold: members.filter((m) => m.certification === "gold").length,
  };
}
