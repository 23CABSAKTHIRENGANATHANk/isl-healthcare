import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StaffMember } from "@/types";

export function ManageStaffDialog({ staff }: { staff: StaffMember[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus aria-hidden="true" />
          Manage Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage staff</DialogTitle>
          <DialogDescription>
            Add or remove staff from ISL training. This preview does not persist changes — it is not
            yet connected to a live staff directory.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {staff.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{member.full_name}</p>
                <p className="text-xs text-muted-foreground">{member.department}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.certification ? (
                  <Badge variant="outline" className="capitalize">
                    {member.certification}
                  </Badge>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${member.full_name} from training`}
                  onClick={() =>
                    toast(`${member.full_name} would be removed`, {
                      description: "Demo action only — no data was changed.",
                    })
                  }
                >
                  <UserMinus className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Button
          variant="hero"
          onClick={() =>
            toast("Invite sent (demo)", {
              description: "Staff invitations are not yet wired to a real directory.",
            })
          }
        >
          <UserPlus aria-hidden="true" />
          Invite new staff
        </Button>
      </DialogContent>
    </Dialog>
  );
}
