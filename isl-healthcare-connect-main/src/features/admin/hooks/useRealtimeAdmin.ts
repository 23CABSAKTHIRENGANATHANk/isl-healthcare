import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  realtimeAdminManager,
  type RealtimeAdminState,
} from "../services/realtimeAdmin.service";
import type { AdminKPIs, AdminUser, AuditLogItem } from "../services/admin.service";

export function useRealtimeAdmin(
  initialUsers: AdminUser[] = [],
  initialKpis?: AdminKPIs,
  initialAuditLogs: AuditLogItem[] = [],
) {
  const [state, setState] = useState<RealtimeAdminState>(realtimeAdminManager.getState());

  // 1. Sync whenever async query data arrives or changes
  useEffect(() => {
    if (initialKpis && initialUsers.length > 0) {
      realtimeAdminManager.initialize(initialUsers, initialKpis, initialAuditLogs);
    }
  }, [initialUsers, initialKpis]);

  // 2. Subscribe to realtime events and connect channel
  useEffect(() => {
    const unsubscribeListener = realtimeAdminManager.subscribeListener(
      (nextState, eventType, eventDetail) => {
        setState(nextState);

        // Non-blocking toast notification for live events
        if (eventType === "USER_INSERT" && eventDetail) {
          toast.success("🟢 New Clinician Joined", {
            description: eventDetail,
            duration: 4000,
          });
        } else if (eventType === "CERT_ISSUED" && eventDetail) {
          toast.info("📜 Platform Credential Issued", {
            description: eventDetail,
            duration: 4000,
          });
        } else if (eventType === "CONNECTION_CHANGE" && eventDetail) {
          if (nextState.connectionState === "live") {
            toast.success("Realtime Gateway Connected", {
              description: "Live updates enabled across hospital network",
              duration: 3000,
            });
          }
        }
      },
    );

    const unsubscribeChannel = realtimeAdminManager.startRealtimeSubscription();

    return () => {
      unsubscribeListener();
      unsubscribeChannel();
    };
  }, []);

  return state;
}
