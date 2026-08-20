import { describe, it, expect, vi } from "vitest";

// Mock Supabase client for pure unit test isolation
vi.mock("@/integrations/supabase/client", () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
  };

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "test-admin-id" } } },
        }),
      },
      from: vi.fn().mockReturnValue(chainable),
    },
    from: vi.fn().mockReturnValue(chainable),
  };
});

import {
  getAdminKPIs,
  listAdminUsers,
  updateAdminUserRole,
  listAuditLogs,
  recordAuditLog,
  performSystemHealthCheck,
  listVideoMediaAssets,
} from "./admin.service";

describe("Admin Service — Enterprise Telemetry & Governance Suite", () => {
  it("computes accurate Admin KPIs with non-zero curriculum and vocabulary stats", async () => {
    const kpis = await getAdminKPIs();
    expect(kpis).toBeDefined();
    expect(kpis.totalLessons).toBeGreaterThanOrEqual(1);
    expect(kpis.totalSigns).toBeGreaterThanOrEqual(10);
    expect(kpis.healthcareStaff).toBeGreaterThanOrEqual(1);
    expect(kpis.averageAccuracy).toBe(92);
  });

  it("lists administrative users with healthcare role and progress", async () => {
    const users = await listAdminUsers();
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty("role");
    expect(users[0]).toHaveProperty("hospital_name");
  });

  it("records immutable audit log entries", () => {
    const beforeCount = listAuditLogs().length;
    recordAuditLog({
      admin_name: "Test Admin",
      admin_email: "test@islsetu.org",
      action: "UNIT_TEST_ACTION",
      entity: "TestSuite",
      entity_id: "TEST-01",
      details: "Automated verification execution",
      result: "SUCCESS",
    });

    const logs = listAuditLogs();
    expect(logs.length).toBe(beforeCount + 1);
    expect(logs[0].action).toBe("UNIT_TEST_ACTION");
    expect(logs[0].result).toBe("SUCCESS");
  });

  it("scans and verifies video media library assets", () => {
    const videos = listVideoMediaAssets();
    expect(videos.length).toBe(8);
    expect(videos.map((v) => v.signGloss)).toContain("DOCTOR");
    expect(videos.map((v) => v.signGloss)).toContain("EMERGENCY");
    expect(videos.every((v) => v.fileSizeBytes > 0)).toBe(true);
  });

  it("performs real-time multi-service system health check", async () => {
    const health = await performSystemHealthCheck();
    expect(health).toHaveProperty("frontend");
    expect(health.frontend.status).toBe("ONLINE");
    expect(health).toHaveProperty("aiEngine");
    expect(health.aiEngine.status).toBe("ONLINE");
    expect(health).toHaveProperty("ttsAudio");
    expect(health.ttsAudio.status).toBe("ONLINE");
  });
});
