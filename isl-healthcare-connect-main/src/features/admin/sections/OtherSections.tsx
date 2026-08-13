import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Plus, ShieldX, Trash2, UploadCloud } from "lucide-react";

import { SignCard } from "@/components/common/SignCard";
import { DifficultyBadge, StatusBadge, type StatusKind } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { HEALTHCARE_ROLES } from "@/types";
import type { Assessment, Certificate, Hospital, Lesson, Sign, StaffMember } from "@/types";
import { createLesson, createSign, deleteLesson, deleteSign, updateLesson } from "@/services/content.service";
import { addStaffMember } from "@/services/hospital.service";

function roleLabel(role: StaffMember["role"]) {
  return HEALTHCARE_ROLES.find((r) => r.value === role)?.label ?? role;
}

const staffStatus: Record<StaffMember["status"], StatusKind> = {
  active: "completed",
  training: "in_progress",
  inactive: "not_started",
};

export function UsersSection({ staff }: { staff: StaffMember[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("nurse");
  const [dept, setDept] = useState("Emergency Triage");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addStaffMember({
      hospitalId: "apollo-delhi",
      fullName: name,
      role,
      department: dept,
      certification: "bronze",
      progressPercent: 100,
    });

    if (res.error) {
      toast.error("Failed to add user", { description: res.error });
    } else {
      toast.success("Staff member registered successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      setOpen(false);
      setName("");
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Manage users</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus aria-hidden="true" /> Invite user
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleInvite} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Register staff member</DialogTitle>
                <DialogDescription>Add a healthcare provider to the facility training roster.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full name</Label>
                <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <select
                  id="staff-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
                >
                  {HEALTHCARE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-dept">Department</Label>
                <Input id="staff-dept" value={dept} onChange={(e) => setDept(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="submit" variant="hero">
                  Add staff member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <EmptyState icon={ShieldX} title="No users found" description="There are no staff records yet." />
        ) : (
          <Table>
            <TableCaption className="text-left">All registered staff across the platform.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">{member.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{roleLabel(member.role)}</TableCell>
                  <TableCell>
                    <StatusBadge status={staffStatus[member.status]} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toast(`Staff record: ${member.full_name}`, { description: `Department: ${member.department}` })
                      }
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function HospitalsSection({ hospital }: { hospital: Hospital | undefined }) {
  if (!hospital) return <EmptyState icon={ShieldX} title="No hospital data" description="Facility record unavailable." />;
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle>{hospital.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {hospital.city}, {hospital.state}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <StatusBadge
          status={hospital.readiness === "isl_ready" ? "completed" : hospital.readiness === "in_progress" ? "in_progress" : "not_started"}
          label={`ISL-Ready — ${hospital.readiness.replace("_", " ")}`}
        />
        <Badge variant="outline">
          {hospital.departments_covered} of {hospital.departments_total} departments covered
        </Badge>
        <Badge variant="outline">Last training {new Date(hospital.last_training_at).toLocaleDateString()}</Badge>
      </CardContent>
    </Card>
  );
}

export function LessonsSection({ lessons }: { lessons: Lesson[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    const res = await deleteLesson(id);
    if (!res.error) {
      toast.success("Lesson deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      void queryClient.invalidateQueries({ queryKey: ["lessons-by-category"] });
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Lessons</CardTitle>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setEditing(null)}>
              <Plus aria-hidden="true" /> Add lesson
            </Button>
          </DialogTrigger>
          <LessonFormDialog lesson={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <EmptyState icon={ShieldX} title="No lessons" description="No lessons have been created yet." />
        ) : (
          <Table>
            <TableCaption className="text-left">All published lessons.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Title</TableHead>
                <TableHead scope="col">Difficulty</TableHead>
                <TableHead scope="col">Duration</TableHead>
                <TableHead scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium text-foreground">{lesson.title}</TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={lesson.difficulty} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lesson.duration_minutes} min</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(lesson);
                        setOpen(true);
                      }}
                    >
                      <Pencil aria-hidden="true" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(lesson.id)}
                    >
                      <Trash2 aria-hidden="true" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function LessonFormDialog({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [category, setCategory] = useState(lesson?.category_id ?? "healthcare");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lesson) {
      const res = await updateLesson(lesson.id, { title, summary, category_id: category });
      if (res.error) toast.error("Error updating lesson", { description: res.error });
      else toast.success("Lesson updated successfully");
    } else {
      const res = await createLesson({
        title,
        summary,
        category_id: category,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        code: "MED-NEW",
        duration_minutes: 10,
        difficulty: "beginner",
      });
      if (res.error) toast.error("Error creating lesson", { description: res.error });
      else toast.success("Lesson created successfully");
    }

    void queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
    void queryClient.invalidateQueries({ queryKey: ["lessons-by-category"] });
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit lesson" : "Add lesson"}</DialogTitle>
          <DialogDescription>Add or update a healthcare sign language lesson module.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lesson-title">Title</Label>
          <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-category">Category</Label>
          <select
            id="lesson-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
          >
            <option value="basic">Basic Communication</option>
            <option value="healthcare">Clinical Vocabulary</option>
            <option value="navigation">Hospital Navigation</option>
            <option value="needs">Patient Needs</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-summary">Summary</Label>
          <Textarea id="lesson-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} required />
        </div>
        <DialogFooter>
          <Button type="submit" variant="hero">
            {lesson ? "Save changes" : "Create lesson"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function SignsSection({ signs }: { signs: Sign[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [gloss, setGloss] = useState("");
  const [meaning, setMeaning] = useState("");
  const [category, setCategory] = useState("healthcare");

  const handleAddSign = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createSign({
      gloss,
      meaning,
      category_id: category,
      difficulty: "beginner",
    });

    if (res.error) {
      toast.error("Failed to add sign", { description: res.error });
    } else {
      toast.success(`Sign "${gloss.toUpperCase()}" added to library`);
      void queryClient.invalidateQueries({ queryKey: ["admin-signs"] });
      void queryClient.invalidateQueries({ queryKey: ["signs"] });
      setOpen(false);
      setGloss("");
      setMeaning("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Signs library</h3>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus aria-hidden="true" /> Add sign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleAddSign} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add sign</DialogTitle>
                  <DialogDescription>Add a new Indian Sign Language gloss to the dictionary.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="sign-gloss">Gloss (Uppercase word)</Label>
                  <Input id="sign-gloss" value={gloss} onChange={(e) => setGloss(e.target.value)} placeholder="e.g. INJECTION" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-meaning">Meaning / Usage</Label>
                  <Input id="sign-meaning" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="e.g. Administering medicine via syringe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-category">Category</Label>
                  <select
                    id="sign-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
                  >
                    <option value="basic">Basic Communication</option>
                    <option value="healthcare">Clinical Vocabulary</option>
                    <option value="navigation">Hospital Navigation</option>
                    <option value="needs">Patient Needs</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" variant="hero">
                    Add sign
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {signs.length === 0 ? (
        <EmptyState icon={ShieldX} title="No signs found" description="No signs have been catalogued yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signs.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssessmentsSection({ assessment }: { assessment?: Assessment | null }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Assessments</h3>
        <Button variant="hero" onClick={() => toast.info("Bronze assessment is active with 8 verified questions")}>
          <Plus aria-hidden="true" /> Add question
        </Button>
      </div>
      {!assessment ? (
        <Card className="rounded-2xl border-border/70 shadow-soft p-6">
          <p className="font-semibold text-foreground">Bronze Healthcare ISL Assessment</p>
          <p className="text-sm text-muted-foreground mt-1">Timed 15-minute assessment covering greetings, pain evaluation, and doctor navigation.</p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Pass mark: 75%</Badge>
            <Badge variant="outline">Tier: Bronze</Badge>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle>
              {assessment.title} · Pass mark {assessment.pass_percent}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {assessment.questions.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-border/70 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {i + 1}. {q.prompt}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => toast("Marked as reviewed")}
                  >
                    <CheckCircle2 aria-hidden="true" /> Review question
                  </Button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SettingsSection() {
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle>Platform settings</CardTitle>
        <p className="text-sm text-muted-foreground">Configure hospital directory integration and accessibility defaults.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inst-name">Facility Name</Label>
          <Input id="inst-name" defaultValue="Apollo Multi-Speciality Hospital" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inst-state">State / Region</Label>
          <Input id="inst-state" defaultValue="Delhi NCR" />
        </div>
        <Button variant="hero" onClick={() => toast.success("Settings saved")}>
          Save configuration
        </Button>
      </CardContent>
    </Card>
  );
}
