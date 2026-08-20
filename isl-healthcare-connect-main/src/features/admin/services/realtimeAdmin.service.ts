import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AdminKPIs, AdminUser, AuditLogItem } from "./admin.service";
import type { StaffMember } from "@/types";

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
   * Handle realtime INSERT / UPDATE / DELETE on profiles table
   */
  public handleProfileChange(payload: { eventType: string; new: any; old: any }) {
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === "INSERT" && newRow) {
      if (this.knownUserIds.has(newRow.id)) return; // Duplicate prevention
      this.knownUserIds.add(newRow.id);

      const newUser: AdminUser = {
        id: newRow.id,
        full_name: newRow.full_name || "New Healthcare Staff",
        email: newRow.email || `${newRow.id.slice(0, 8)}@hospital.org`,
        role: newRow.role || "nurse",
        hospital_name: newRow.hospital_id ? "Apollo Multi-Speciality Hospital" : "AIIMS Healthcare Network",
        current_level: newRow.current_level || "bronze",
        learning_streak: newRow.learning_streak || 0,
        progress_percent: 0,
        certification_status: "In Training",
        status: "active",
        created_at: newRow.created_at || new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      };

      this.state.users = [newUser, ...this.state.users];
      this.state.kpis = {
        ...this.state.kpis,
        totalUsers: this.state.kpis.totalUsers + 1,
        activeUsers: this.state.kpis.activeUsers + 1,
        newUsers7Days: this.state.kpis.newUsers7Days + 1,
      };

      const auditEvent: AuditLogItem = {
        id: `audit-${Date.now()}`,
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
    } else if (eventType === "UPDATE" && newRow) {
      this.state.users = this.state.users.map((u) => {
        if (u.id === newRow.id) {
          return {
            ...u,
            full_name: newRow.full_name || u.full_name,
            role: newRow.role || u.role,
            current_level: newRow.current_level || u.current_level,
            learning_streak: newRow.learning_streak ?? u.learning_streak,
            last_active_at: new Date().toISOString(),
          };
        }
        return u;
      });

      const auditEvent: AuditLogItem = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        admin_name: "Realtime Gateway",
        admin_email: "system@islsetu.org",
        action: "USER_PROFILE_UPDATE",
        entity: "UserProfile",
        entity_id: newRow.id,
        details: `Updated role to ${newRow.role || "staff"}`,
        result: "SUCCESS",
      };

      this.state.activityFeed = [auditEvent, ...this.state.activityFeed.slice(0, 20)];
      this.notify("USER_UPDATE", `Updated profile for ${newRow.full_name || "staff member"}`);
    } else if (eventType === "DELETE" && oldRow) {
      this.knownUserIds.delete(oldRow.id);
      this.state.users = this.state.users.filter((u) => u.id !== oldRow.id);
      this.state.kpis = {
        ...this.state.kpis,
        totalUsers: Math.max(0, this.state.kpis.totalUsers - 1),
        activeUsers: Math.max(0, this.state.kpis.activeUsers - 1),
      };

      const auditEvent: AuditLogItem = {
        id: `audit-${Date.now()}`,
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
      this.state.kpis = {
        ...this.state.kpis,
        healthcareStaff: this.state.kpis.healthcareStaff + 1,
      };
      this.notify("STAFF_INSERT", `Staff member ${newRow.full_name} enrolled`);
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
        id: `audit-${Date.now()}`,
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
        id: `audit-${Date.now()}`,
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
