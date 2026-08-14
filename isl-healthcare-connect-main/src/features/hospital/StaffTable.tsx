import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingStates";
import { StatusBadge, type StatusKind } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HEALTHCARE_ROLES, type StaffMember } from "@/types";

const statusMap: Record<StaffMember["status"], StatusKind> = {
  active: "completed",
  training: "in_progress",
  inactive: "not_started",
};

const tierClasses: Record<string, string> = {
  bronze: "border-bronze/40 bg-bronze/15 text-bronze",
  silver: "border-silver/40 bg-silver/15 text-silver",
  gold: "border-gold/40 bg-gold/15 text-gold",
};

function roleLabel(role: StaffMember["role"]) {
  return HEALTHCARE_ROLES.find((r) => r.value === role)?.label ?? role;
}

export function StaffTable({ staff, isLoading }: { staff: StaffMember[]; isLoading: boolean }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const departments = useMemo(
    () => Array.from(new Set(staff.map((s) => s.department))).sort(),
    [staff],
  );

  const filtered = useMemo(() => {
    return staff.filter((member) => {
      const matchesQuery =
        query.trim().length === 0 ||
        member.full_name.toLowerCase().includes(query.trim().toLowerCase()) ||
        roleLabel(member.role).toLowerCase().includes(query.trim().toLowerCase());
      const matchesDept = department === "all" || member.department === department;
      return matchesQuery && matchesDept;
    });
  }, [staff, query, department]);

  if (isLoading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search staff by name or role…"
            aria-label="Search staff by name or role"
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff match your filters"
          description="Try a different search term or choose another department."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableCaption className="px-4 pb-4 text-left">
              ISL certification status for {filtered.length} of {staff.length} staff members.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Certification</TableHead>
                <TableHead scope="col">Progress</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">{member.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {roleLabel(member.role)}
                    <span className="block text-xs">{member.department}</span>
                  </TableCell>
                  <TableCell>
                    {member.certification ? (
                      <Badge variant="outline" className={tierClasses[member.certification]}>
                        {member.certification.charAt(0).toUpperCase() +
                          member.certification.slice(1)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not certified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={member.progress_percent}
                        className="h-2 w-24"
                        aria-label={`${member.full_name} progress: ${member.progress_percent}%`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {member.progress_percent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={statusMap[member.status]}
                      label={member.status === "training" ? "Training" : undefined}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
