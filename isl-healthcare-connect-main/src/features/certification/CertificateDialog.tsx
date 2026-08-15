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
          className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-card p-8 shadow-lift"
        >
          <div
            className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-gold/30"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-6 text-center">
            <img src={logo} alt="ISL Setu logo" className="h-12 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Certificate of Achievement
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold text-foreground">
                {tierLabel[certificate.tier]} Healthcare ISL Certification
              </h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This certifies that</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">
                {user.full_name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                has successfully completed {certificate.subtitle} on the ISL Setu learning platform.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4 text-left text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Credential ID
                </p>
                <p className="font-medium text-foreground">
                  {certificate.credential_id ?? "Pending"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Issue Date</p>
                <p className="font-medium text-foreground">{issuedDate}</p>
              </div>
            </div>

            <div className="mt-4 flex w-full items-center justify-between border-t border-border pt-4 text-left text-sm">
              <div>
                <p className="font-display text-lg italic text-foreground">
                  Certified Deaf ISL Trainer
                </p>
                <p className="text-xs text-muted-foreground">ISL Setu Training Panel</p>
              </div>
              <p className="text-xs text-muted-foreground">Signed digitally</p>
            </div>

            <p className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-left text-xs text-warning">
              <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
              This is an ISL Setu platform learning credential, not a government accreditation or
              official interpreter licence.
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
