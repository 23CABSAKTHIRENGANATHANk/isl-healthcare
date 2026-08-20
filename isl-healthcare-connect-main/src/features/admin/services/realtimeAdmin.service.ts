import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AdminKPIs, AdminUser, AuditLogItem } from "./admin.service";

export type RealtimeConnectionState = "live" | "reconnecting" | "offline";

export interface RealtimeAdminState {
  users: AdminUser[];
  kpis: AdminKPIs;
  activityFeed: AuditLogItem[];
  connectionState: RealtimeConnectionState;
}

export type RealtimeEventListener = (state: RealtimeAdminState, eventType?: string, eventDetail?: string) => void;

class RealtimeAdminManager {
  private channel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<RealtimeEventListener> = new Set();
  private state: RealtimeAdminState = {
    users: [],
    kpis: {
      totalUsers: 12,
      activeUsers: 8,
      newUsers7Days: 3,
      healthcareStaff: 12,
      totalHospitals: 3,
      totalLessons: 5,
      totalSigns: 70,
      certificatesIssued: 0,
      bronzeCertified: 0,
      silverCertified: 0,
      goldCertified: 0,
      pendingAssessments: 0,
      averageProgress: 68,
      averageAccuracy: 92,
    },
    activityFeed: [],
    connectionState: "offline",
  };

  private knownUserIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel("isl-setu-realtime-admin");
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "USER_SIGNUP" && event.data?.payload) {
            this.handleDirectUserInsert(event.data.payload);
          } else if (event.data?.type === "USER_UPDATE" && event.data?.payload) {
            this.handleDirectUserUpdate(event.data.payload);
          }
        };
      } catch (e) {
        console.warn("[RealtimeAdminManager] BroadcastChannel init warning:", e);
      }
    }
  }

  public getState(): RealtimeAdminState {
    return { ...this.state };
  }

  public subscribeListener(listener: RealtimeEventListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(eventType?: string, eventDetail?: string) {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState, eventType, eventDetail));
  }

  public initialize(initialUsers: AdminUser[], initialKpis: AdminKPIs, initialAuditLogs: AuditLogItem[]) {
    this.state.users = [...initialUsers];
    this.state.kpis = { ...initialKpis };
    this.state.activityFeed = [...initialAuditLogs];
    this.knownUserIds = new Set(initialUsers.map((u) => u.id));
    this.notify();
  }

  public startRealtimeSubscription(): () => void {
    if (this.channel) {
      return () => this.stopRealtimeSubscription();
    }

    this.state.connectionState = "reconnecting";
    this.notify();

    try {
      this.channel = supabase
        .channel("admin-realtime-control-center")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          (payload) => this.handleProfileChange(payload),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "hospital_staff" },
          (payload) => this.handleStaffChange(payload),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "certificates" },
          (payload) => this.handleCertificateChange(payload),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lesson_progress" },
          (payload) => this.handleProgressChange(payload),
        )
        .on("broadcast", { event: "NEW_USER_SIGNUP" }, ({ payload }) => {
          if (payload) this.handleDirectUserInsert(payload);
        })
        .on("broadcast", { event: "USER_UPDATE" }, ({ payload }) => {
          if (payload) this.handleDirectUserUpdate(payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.state.connectionState = "live";
            this.notify("CONNECTION_CHANGE", "Live updates connected");
          } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
            this.state.connectionState = "reconnecting";
            this.notify("CONNECTION_CHANGE", "Live updates temporarily reconnecting...");
          } else if (status === "CLOSED") {
            this.state.connectionState = "offline";
            this.notify("CONNECTION_CHANGE", "Live updates offline");
          }
        });
    } catch (err) {
      console.warn("[RealtimeAdminManager] Subscription error:", err);
      this.state.connectionState = "offline";
      this.notify();
    }

    return () => this.stopRealtimeSubscription();
  }

  public stopRealtimeSubscription() {
    if (this.channel) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
      this.state.connectionState = "offline";
      this.notify();
    }
  }

  /**
   * Directly insert user into state with duplicate prevention & notification
   */
  public handleDirectUserInsert(user: Partial<AdminUser> & { id: string; full_name?: string; email?: string; role?: string }) {
    if (this.knownUserIds.has(user.id)) return;
    this.knownUserIds.add(user.id);

    const newUser: AdminUser = {
      id: user.id,
      full_name: user.full_name || "New Healthcare Staff",
      email: user.email || `${user.id.slice(0, 8)}@hospital.org`,
      role: (user.role as any) || "nurse",
      hospital_name: user.hospital_name || "Apollo Multi-Speciality Hospital",
      current_level: user.current_level || "bronze",
      learning_streak: user.learning_streak || 0,
      progress_percent: 0,
      certification_status: "In Training",
      status: "active",
      created_at: user.created_at || new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    this.state.users = [newUser, ...this.state.users];
    this.state.kpis = {
      ...this.state.kpis,
      totalUsers: this.state.kpis.totalUsers + 1,
      activeUsers: this.state.kpis.activeUsers + 1,
      newUsers7Days: this.state.kpis.newUsers7Days + 1,
      healthcareStaff: this.state.kpis.healthcareStaff + 1,
    };

    const auditEvent: AuditLogItem = {
      id: `audit-live-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin_name: "Realtime Gateway",
      admin_email: "system@islsetu.org",
      action: "NEW_USER_REGISTRATION",
      entity: "UserProfile",
      entity_id: newUser.id,
      details: `${newUser.full_name} joined as ${newUser.role.toUpperCase()}`,
      result: "SUCCESS",
    };

    this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
    this.notify("USER_INSERT", `${newUser.full_name} joined as ${newUser.role}`);
  }

  /**
   * Directly update existing user in state
   */
  public handleDirectUserUpdate(user: { id: string; role?: string; full_name?: string; status?: string; learning_streak?: number; current_level?: string }) {
    this.state.users = this.state.users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          full_name: user.full_name || u.full_name,
          role: (user.role as any) || u.role,
          status: (user.status as any) || u.status,
          learning_streak: user.learning_streak !== undefined ? user.learning_streak : u.learning_streak,
          current_level: user.current_level || u.current_level,
          last_active_at: new Date().toISOString(),
        };
      }
      return u;
    });

    const auditEvent: AuditLogItem = {
      id: `audit-live-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin_name: "Realtime Gateway",
      admin_email: "system@islsetu.org",
      action: "USER_PROFILE_UPDATE",
      entity: "UserProfile",
      entity_id: user.id,
      details: `Updated role to ${user.role || "staff"}`,
      result: "SUCCESS",
    };

    this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
    this.notify("USER_UPDATE", `Updated profile for ${user.full_name || "staff member"}`);
  }

  /**
   * Handle realtime Postgres Changes on profiles table
   */
  public handleProfileChange(payload: { eventType: string; new: any; old: any }) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === "INSERT" && newRow) {
      this.handleDirectUserInsert(newRow);
    } else if (eventType === "UPDATE" && newRow) {
      this.handleDirectUserUpdate(newRow);
    } else if (eventType === "DELETE" && oldRow) {
      this.knownUserIds.delete(oldRow.id);
      this.state.users = this.state.users.filter((u) => u.id !== oldRow.id);
      this.state.kpis = {
        ...this.state.kpis,
        totalUsers: Math.max(0, this.state.kpis.totalUsers - 1),
        activeUsers: Math.max(0, this.state.kpis.activeUsers - 1),
      };

      const auditEvent: AuditLogItem = {
        id: `audit-live-${Date.now()}`,
        timestamp: new Date().toISOString(),
        admin_name: "Realtime Gateway",
        admin_email: "system@islsetu.org",
        action: "USER_REMOVAL",
        entity: "UserProfile",
        entity_id: oldRow.id,
        details: `Removed user account #${oldRow.id}`,
        result: "SUCCESS",
      };

      this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
      this.notify("USER_DELETE", `User account removed`);
    }
  }

  /**
   * Handle realtime changes on hospital_staff
   */
  public handleStaffChange(payload: { eventType: string; new: any; old: any }) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === "INSERT" && newRow) {
      this.handleDirectUserInsert({
        id: newRow.user_id || newRow.id,
        full_name: newRow.full_name,
        role: newRow.role,
        hospital_name: "Apollo Multi-Speciality Hospital",
        current_level: newRow.certification || "bronze",
      });
    } else if (eventType === "DELETE" && oldRow) {
      this.state.kpis = {
        ...this.state.kpis,
        healthcareStaff: Math.max(0, this.state.kpis.healthcareStaff - 1),
      };
      this.notify("STAFF_DELETE", `Staff member removed from hospital roster`);
    }
  }

  /**
   * Handle realtime changes on certificates
   */
  public handleCertificateChange(payload: { eventType: string; new: any }) {
    const { eventType, new: newRow } = payload;
    if (eventType === "INSERT" && newRow) {
      this.state.kpis = {
        ...this.state.kpis,
        certificatesIssued: this.state.kpis.certificatesIssued + 1,
        bronzeCertified: newRow.tier === "bronze" ? this.state.kpis.bronzeCertified + 1 : this.state.kpis.bronzeCertified,
        silverCertified: newRow.tier === "silver" ? this.state.kpis.silverCertified + 1 : this.state.kpis.silverCertified,
        goldCertified: newRow.tier === "gold" ? this.state.kpis.goldCertified + 1 : this.state.kpis.goldCertified,
      };

      const auditEvent: AuditLogItem = {
        id: `audit-live-${Date.now()}`,
        timestamp: new Date().toISOString(),
        admin_name: "Certification Authority",
        admin_email: "system@islsetu.org",
        action: "CERTIFICATE_ISSUED",
        entity: "Certificate",
        entity_id: newRow.certificate_number || newRow.id,
        details: `Issued ${newRow.title || "ISL Credential"} (Score: ${newRow.score}%)`,
        result: "SUCCESS",
      };

      this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
      this.notify("CERT_ISSUED", `New credential issued: ${newRow.title}`);
    }
  }

  /**
   * Handle realtime changes on lesson_progress
   */
  public handleProgressChange(payload: { eventType: string; new: any }) {
    const { eventType, new: newRow } = payload;
    if ((eventType === "INSERT" || eventType === "UPDATE") && newRow && newRow.completed) {
      const auditEvent: AuditLogItem = {
        id: `audit-live-${Date.now()}`,
        timestamp: new Date().toISOString(),
        admin_name: "Learning Engine",
        admin_email: "system@islsetu.org",
        action: "LESSON_COMPLETED",
        entity: "LessonProgress",
        entity_id: newRow.lesson_id,
        details: `Clinician completed module #${newRow.lesson_id}`,
        result: "SUCCESS",
      };

      this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
      this.notify("PROGRESS_UPDATE");
    }
  }
}

export const realtimeAdminManager = new RealtimeAdminManager();
