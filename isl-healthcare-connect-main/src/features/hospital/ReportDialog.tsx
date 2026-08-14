import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Hospital } from "@/types";

export function ReportDialog({
  hospital,
  counts,
}: {
  hospital: Hospital;
  counts: { total: number; bronze: number; silver: number; gold: number };
}) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open)
          toast("Report generated", { description: "A readiness summary is ready to review." });
      }}
    >
      <DialogTrigger asChild>
        <Button variant="hero">
          <FileText aria-hidden="true" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>ISL readiness report — {hospital.name}</DialogTitle>
          <DialogDescription>
            This is an ISL Setu platform status summary, not an official government accreditation.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Certified staff</dt>
            <dd className="text-lg font-semibold text-foreground">{counts.total}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Departments covered</dt>
            <dd className="text-lg font-semibold text-foreground">
              {hospital.departments_covered} of {hospital.departments_total}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bronze / Silver / Gold</dt>
            <dd className="text-lg font-semibold text-foreground">
              {counts.bronze} / {counts.silver} / {counts.gold}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last training</dt>
            <dd className="text-lg font-semibold text-foreground">
              {new Date(hospital.last_training_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
