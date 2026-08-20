import { describe, it, expect, vi } from "vitest";
import { realtimeAdminManager } from "./realtimeAdmin.service";
import type { AdminKPIs, AdminUser, AuditLogItem } from "./admin.service";

describe("RealtimeAdminManager — Event-Driven State Synchronization", () => {
  const initialUsers: AdminUser[] = [
    {
      id: "u-1",
      full_name: "Dr. Ananya Rao",
      email: "ananya@hospital.org",
      role: "doctor",
      hospital_name: "Apollo Multi-Speciality",
      current_level: "gold",
      learning_streak: 7,
      progress_percent: 100,
      certification_status: "GOLD Certified",
      status: "active",
      created_at: "2026-08-01T10:00:00Z",
      last_active_at: new Date().toISOString(),
    },
  ];

  const initialKpis: AdminKPIs = {
    totalUsers: 1,
    activeUsers: 1,
    newUsers7Days: 1,
    healthcareStaff: 1,
    totalHospitals: 1,
    totalLessons: 5,
    totalSigns: 70,
    certificatesIssued: 1,
    bronzeCertified: 0,
    silverCertified: 0,
    goldCertified: 1,
    pendingAssessments: 0,
    averageProgress: 100,
    averageAccuracy: 95,
  };

  const initialLogs: AuditLogItem[] = [];

  it("initializes state and registers known user IDs", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);
    const state = realtimeAdminManager.getState();
    expect(state.users.length).toBe(1);
    expect(state.kpis.totalUsers).toBe(1);
  });

  it("handles realtime INSERT on profiles without reload", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);

    realtimeAdminManager.handleProfileChange({
      eventType: "INSERT",
      new: {
        id: "u-2",
        full_name: "Nurse Priya",
        email: "priya@hospital.org",
        role: "nurse",
        current_level: "bronze",
        learning_streak: 0,
        created_at: new Date().toISOString(),
      },
      old: null,
    });

    const state = realtimeAdminManager.getState();
    expect(state.users.length).toBe(2);
    expect(state.users[0].full_name).toBe("Nurse Priya");
    expect(state.kpis.totalUsers).toBe(2);
    expect(state.kpis.activeUsers).toBe(2);
    expect(state.activityFeed.length).toBeGreaterThan(0);
    expect(state.activityFeed[0].action).toBe("NEW_USER_REGISTRATION");
  });

  it("prevents duplicate INSERT events with identical user ID", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);

    // First insert
    realtimeAdminManager.handleProfileChange({
      eventType: "INSERT",
      new: { id: "u-dup", full_name: "Duplicate User", role: "nurse" },
      old: null,
    });
    expect(realtimeAdminManager.getState().users.length).toBe(2);

    // Duplicate insert attempt
    realtimeAdminManager.handleProfileChange({
      eventType: "INSERT",
      new: { id: "u-dup", full_name: "Duplicate User", role: "nurse" },
      old: null,
    });
    expect(realtimeAdminManager.getState().users.length).toBe(2);
  });

  it("handles realtime UPDATE on profiles instantly", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);

    realtimeAdminManager.handleProfileChange({
      eventType: "UPDATE",
      new: {
        id: "u-1",
        full_name: "Dr. Ananya Rao (Chief)",
        role: "doctor",
        current_level: "gold",
        learning_streak: 8,
      },
      old: { id: "u-1" },
    });

    const state = realtimeAdminManager.getState();
    const updated = state.users.find((u) => u.id === "u-1");
    expect(updated?.full_name).toBe("Dr. Ananya Rao (Chief)");
    expect(updated?.learning_streak).toBe(8);
  });

  it("handles realtime DELETE on profiles", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);

    realtimeAdminManager.handleProfileChange({
      eventType: "DELETE",
      new: null,
      old: { id: "u-1" },
    });

    const state = realtimeAdminManager.getState();
    expect(state.users.length).toBe(0);
    expect(state.kpis.totalUsers).toBe(0);
  });

  it("handles realtime certificate grant events and updates tier counts", () => {
    realtimeAdminManager.initialize(initialUsers, initialKpis, initialLogs);

    realtimeAdminManager.handleCertificateChange({
      eventType: "INSERT",
      new: {
        id: "cert-live-1",
        tier: "bronze",
        title: "Bronze Healthcare ISL Credential",
        score: 90,
        certificate_number: "ISL-BRONZE-LIVE",
      },
    });

    const state = realtimeAdminManager.getState();
    expect(state.kpis.certificatesIssued).toBe(2);
    expect(state.kpis.bronzeCertified).toBe(1);
    expect(state.activityFeed[0].action).toBe("CERTIFICATE_ISSUED");
  });
});
