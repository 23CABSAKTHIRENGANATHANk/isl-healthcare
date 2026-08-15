/**
 * ISL Setu — Hospital Emergency SOS & Live Triage Event Bus
 * Broadcasts critical patient signs (Code Red / Code Blue) in real-time across tabs/stations
 * and synthesizes clinical siren alerts.
 */

export interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  roomBed: string;
  signGloss: string;
  severity: "critical_code_red" | "urgent_code_blue" | "priority_yellow";
  timestamp: string;
  status: "active" | "acknowledged" | "dispatched" | "resolved";
  tamilDescription: string;
  dispatchedTo?: string;
}

const STORAGE_KEY = "isl_setu_emergency_alerts";
const CHANNEL_NAME = "isl_emergency_triage_bus";

class EmergencyTriageService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((alerts: EmergencyAlert[]) => void)[] = [];
  private audioCtx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private isSirenPlaying = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === "EMERGENCY_ALERTS_UPDATED") {
          this.notifyListeners();
        }
      };
    }
  }

  public getAlerts(): EmergencyAlert[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return this.getDefaultAlerts();
      return JSON.parse(stored);
    } catch {
      return this.getDefaultAlerts();
    }
  }

  private getDefaultAlerts(): EmergencyAlert[] {
    return [
      {
        id: "alert-init-1",
        patientId: "PT-9042",
        patientName: "Deaf Patient (Bed 04)",
        roomBed: "Emergency Room • Bed 04",
        signGloss: "EMERGENCY",
        severity: "critical_code_red",
        timestamp: new Date(Date.now() - 3 * 60000).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "acknowledged",
        tamilDescription: "அவசர மருத்துவ உதவி கோரப்பட்டுள்ளது (Severe Respiratory Distress)",
        dispatchedTo: "Dr. Ananya / Nurse Priya",
      },
    ];
  }

  public triggerEmergency(
    signGloss: string = "EMERGENCY",
    roomBed: string = "Consultation Room 02",
    patientName: string = "Deaf Patient"
  ): EmergencyAlert {
    const isCodeRed = signGloss === "EMERGENCY" || signGloss === "HELP" || signGloss === "PAIN";
    const newAlert: EmergencyAlert = {
      id: `sos-${Date.now()}`,
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      roomBed,
      signGloss,
      severity: isCodeRed ? "critical_code_red" : "urgent_code_blue",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      status: "active",
      tamilDescription:
        signGloss === "EMERGENCY"
          ? "அவசர தீவிர சிகிச்சை தேவை (Code Red Emergency)"
          : signGloss === "HELP"
          ? "உடனடி உதவி கோரிக்கை (Immediate Nurse Assistance)"
          : `${signGloss} சைகை மூலம் அவசர உதவி கோரப்பட்டுள்ளது`,
    };

    const current = this.getAlerts();
    const updated = [newAlert, ...current.slice(0, 19)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Broadcast across tabs
    this.channel?.postMessage({ type: "EMERGENCY_ALERTS_UPDATED" });
    this.notifyListeners();

    // Play synthesized emergency hospital chime
    this.playEmergencySiren(3000);

    return newAlert;
  }

  public updateAlertStatus(alertId: string, status: EmergencyAlert["status"], dispatchedTo?: string) {
    const alerts = this.getAlerts().map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status,
          dispatchedTo: dispatchedTo || a.dispatchedTo || "Duty Nurse Dispatched",
        };
      }
      return a;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    this.channel?.postMessage({ type: "EMERGENCY_ALERTS_UPDATED" });
    this.notifyListeners();
  }

  public subscribe(callback: (alerts: EmergencyAlert[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getAlerts());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    const alerts = this.getAlerts();
    this.listeners.forEach((l) => l(alerts));
  }

  /**
   * Generates a pulse siren sound using Web Audio API
   */
  public playEmergencySiren(durationMs: number = 3000) {
    if (typeof window === "undefined") return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.6);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.9);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  }
}

export const emergencyTriageService = new EmergencyTriageService();
