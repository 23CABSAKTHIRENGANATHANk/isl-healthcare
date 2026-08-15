import { motion, useReducedMotion } from "framer-motion";
import { Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import logo from "@/assets/isl-setu-logo.png";
import { Button } from "@/components/ui/button";
import { downloadDirectCertificate } from "@/services/certificatePdf.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppUser, Certificate } from "@/types";

const tierLabel: Record<Certificate["tier"], string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

interface CertificateDialogProps {
  certificate: Certificate;
  user: AppUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificateDialog({
  certificate,
  user,
  open,
  onOpenChange,
}: CertificateDialogProps) {
  const reduceMotion = useReducedMotion();
  const issuedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tierLabel[certificate.tier]} Certificate</DialogTitle>
          <DialogDescription>
            Your ISL Setu learning credential for {certificate.subtitle}.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          id="certificate-print-area"
          {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.96 } })}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 shadow-lift"
        >
          <div
            className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-yellow-500/30"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-6 text-center">
            <img src={logo} alt="ISL Setu logo" className="h-12 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                National Healthcare Accessibility Council
              </p>
              <h3 className="mt-1.5 font-display text-2xl font-black text-yellow-400">
                Official Certificate of Achievement
              </h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                ★ {tierLabel[certificate.tier]} Clinical Healthcare Tier ★
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">This credential is proud to officially certify that</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-white tracking-wide">
                {user.full_name || "Healthcare Professional"}
              </p>
              <div className="mx-auto mt-1 h-1 w-32 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
              <p className="mt-2 text-xs text-slate-300">
                has successfully demonstrated required clinical mastery in Indian Sign Language (ISL) for {certificate.subtitle}.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 rounded-2xl border border-yellow-500/30 bg-slate-950/80 p-4 text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Credential ID
                </p>
                <p className="font-mono text-xs font-bold text-white">
                  {certificate.credential_id ?? "ISL-SETU-BRZ-2026"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Issue Date</p>
                <p className="text-xs font-bold text-white">{issuedDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Clinical Evaluation</p>
                <p className="text-xs font-bold text-emerald-400">92% (VERIFIED)</p>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 items-center border-t border-slate-800 pt-5 text-center">
              <div>
                <p className="text-xs font-bold text-cyan-400">
                  ISL Training Board
                </p>
                <p className="text-[10px] text-muted-foreground">National Clinical Panel</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="size-10 rounded-full border-2 border-yellow-400 bg-yellow-400/10 flex items-center justify-center text-[10px] font-black text-yellow-400 shadow-inner">
                  ★ SEAL ★
                </div>
                <span className="text-[9px] font-bold text-emerald-400 mt-1">OFFICIAL VERIFIED</span>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400">
                  Healthcare Authority
                </p>
                <p className="text-[10px] text-muted-foreground">Digitally Authenticated</p>
              </div>
            </div>

            <p className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2 text-left text-[11px] text-amber-300 border border-amber-500/20">
              <ShieldAlert className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
              Verified healthcare communication credential issued by ISL Setu Platform.
            </p>
          </div>
        </motion.div>

        <div className="flex justify-end gap-3 print:hidden">
          <Button
            variant="hero"
            className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-white shadow-md hover:from-emerald-600 hover:to-teal-600"
            onClick={async () => {
              try {
                toast.loading("Rendering high-definition certificate...");
                await downloadDirectCertificate(certificate, user);
                toast.dismiss();
                toast.success("Official Certificate downloaded successfully!");
              } catch (err) {
                toast.dismiss();
                toast.error("Certificate download failed. Please try again.");
                console.error("[Modal Certificate Download]", err);
              }
            }}
          >
            <Download className="size-4.5" aria-hidden="true" />
            Download Official Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
