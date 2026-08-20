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

  useEffect(() => {
    // 1. Initialize manager with loaded data
    if (initialKpis && initialUsers.length > 0) {
      realtimeAdminManager.initialize(initialUsers, initialKpis, initialAuditLogs);
    }

    // 2. Subscribe to local state dispatcher
    const unsubscribeListener = realtimeAdminManager.subscribeListener(
      (nextState, eventType, eventDetail) => {
        setState(nextState);

        // Show non-blocking toast for relevant real-time events
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

    // 3. Connect Supabase Realtime channel
    const unsubscribeChannel = realtimeAdminManager.startRealtimeSubscription();

    return () => {
      unsubscribeListener();
      unsubscribeChannel();
    };
  }, []);

  return state;
}
