import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Filter,
  Hand,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShieldX,
  Trash2,
  Users,
  Video,
} from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { HEALTHCARE_ROLES } from "@/types";
import type { Assessment, Certificate, Hospital, Lesson, Sign, StaffMember } from "@/types";
import {
  createLesson,
  createSign,
  deleteLesson,
  deleteSign,
  updateLesson,
} from "@/services/content.service";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, roleFilter]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await addStaffMember({
      hospitalId: "apollo-delhi",
      fullName: name.trim(),
      role,
      department: dept.trim(),
      certification: "bronze",
      progressPercent: 100,
    });

    if (res.error) {
      toast.error("Failed to add user", { description: res.error });
    } else {
      toast.success(`Staff member ${name} registered successfully`);
      void queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
      setOpen(false);
      setName("");
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">Healthcare Staff Management</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage hospital clinicians, training statuses, and department rosters.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="font-bold">
              <Plus aria-hidden="true" className="mr-1.5 size-4" /> Register Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleInvite} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Register Healthcare Staff</DialogTitle>
                <DialogDescription>
                  Enroll a medical professional into the ISL facility training program.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name</Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Clinical Role</Label>
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
                <Label htmlFor="staff-dept">Hospital Department</Label>
                <Input
                  id="staff-dept"
                  value={dept}
                  placeholder="e.g. Emergency Triage, OPD, ICU"
                  onChange={(e) => setDept(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" variant="hero">
                  Register Staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or department..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-xs font-medium"
            >
              <option value="all">All Clinical Roles</option>
              {HEALTHCARE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <EmptyState
            icon={ShieldX}
            title="No staff members found"
            description="Try adjusting your search query or role filter."
          />
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead scope="col" className="font-bold">Staff Member</TableHead>
                  <TableHead scope="col" className="font-bold">Role</TableHead>
                  <TableHead scope="col" className="font-bold">Department</TableHead>
                  <TableHead scope="col" className="font-bold">Status</TableHead>
                  <TableHead scope="col" className="font-bold">Credential</TableHead>
                  <TableHead scope="col" className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-foreground">
                      {member.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium">
                      {roleLabel(member.role)}
                    </TableCell>
                    <TableCell className="text-foreground text-xs">
                      {member.department}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={staffStatus[member.status]} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {member.certification} Tier
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() =>
                          toast.info(`Staff Details: ${member.full_name}`, {
                            description: `Role: ${roleLabel(member.role)} | Dept: ${member.department} | Training Progress: ${member.progress_percent}%`,
                          })
                        }
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HospitalsSection({ hospital }: { hospital: Hospital | undefined }) {
  if (!hospital)
    return (
      <EmptyState
        icon={ShieldX}
        title="No hospital data"
        description="Facility record unavailable."
      />
    );
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
          status={
            hospital.readiness === "isl_ready"
              ? "completed"
              : hospital.readiness === "in_progress"
                ? "in_progress"
                : "not_started"
          }
          label={`ISL-Ready — ${hospital.readiness.replace("_", " ")}`}
        />
        <Badge variant="outline">
          {hospital.departments_covered} of {hospital.departments_total} departments covered
        </Badge>
        <Badge variant="outline">
          Last training {new Date(hospital.last_training_at).toLocaleDateString()}
        </Badge>
      </CardContent>
    </Card>
  );
}

export function LessonsSection({ lessons }: { lessons: Lesson[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const filteredLessons = useMemo(() => {
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase()) ||
        l.summary.toLowerCase().includes(search.toLowerCase()),
    );
  }, [lessons, search]);

  const handleDelete = async (id: string) => {
    const res = await deleteLesson(id);
    if (!res.error) {
      toast.success("Lesson deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
      void queryClient.invalidateQueries({ queryKey: ["lessons-by-category"] });
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">Curriculum Modules</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured clinical Indian Sign Language learning modules.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="hero" className="font-bold" onClick={() => setEditing(null)}>
              <Plus aria-hidden="true" className="mr-1.5 size-4" /> Add Lesson Module
            </Button>
          </DialogTrigger>
          <LessonFormDialog lesson={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons by title or code..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredLessons.length === 0 ? (
          <EmptyState
            icon={ShieldX}
            title="No lessons found"
            description="No lessons matched your search query."
          />
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead scope="col" className="font-bold">Code</TableHead>
                  <TableHead scope="col" className="font-bold">Lesson Title</TableHead>
                  <TableHead scope="col" className="font-bold">Difficulty</TableHead>
                  <TableHead scope="col" className="font-bold">Duration</TableHead>
                  <TableHead scope="col" className="font-bold">Signs Count</TableHead>
                  <TableHead scope="col" className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {lesson.code}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {lesson.title}
                    </TableCell>
                    <TableCell>
                      <DifficultyBadge difficulty={lesson.difficulty} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {lesson.duration_minutes} min
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {lesson.sign_ids.length} signs
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(lesson);
                            setOpen(true);
                          }}
                        >
                          <Pencil aria-hidden="true" className="size-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => void handleDelete(lesson.id)}
                        >
                          <Trash2 aria-hidden="true" className="size-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
    if (!title.trim()) return;
    if (lesson) {
      const res = await updateLesson(lesson.id, { title: title.trim(), summary: summary.trim(), category_id: category });
      if (res.error) toast.error("Error updating lesson", { description: res.error });
      else toast.success("Lesson updated successfully");
    } else {
      const res = await createLesson({
        title: title.trim(),
        summary: summary.trim(),
        category_id: category,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        code: `MED-0${Math.floor(Math.random() * 90) + 10}`,
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
          <DialogTitle>{lesson ? "Edit Lesson Module" : "Add Lesson Module"}</DialogTitle>
          <DialogDescription>
            Configure curriculum parameters and sign groupings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lesson-title">Module Title</Label>
          <Input
            id="lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
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
          <Label htmlFor="lesson-summary">Clinical Summary</Label>
          <Textarea
            id="lesson-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit" variant="hero">
            {lesson ? "Save Changes" : "Create Lesson"}
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredSigns = useMemo(() => {
    return signs.filter((s) => {
      const matchesSearch =
        s.gloss.toLowerCase().includes(search.toLowerCase()) ||
        s.meaning.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || s.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [signs, search, categoryFilter]);

  const handleAddSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gloss.trim()) return;
    const res = await createSign({
      gloss: gloss.trim().toUpperCase(),
      meaning: meaning.trim(),
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Verified ISL Signs Library</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {filteredSigns.length} of {signs.length} signs with verified MediaPipe kinematics.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="font-bold">
              <Plus aria-hidden="true" className="mr-1.5 size-4" /> Add Sign Gloss
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleAddSign} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add Sign Gloss</DialogTitle>
                <DialogDescription>
                  Register a new Indian Sign Language gloss to the clinical dictionary.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="sign-gloss">Gloss (Uppercase word)</Label>
                <Input
                  id="sign-gloss"
                  value={gloss}
                  onChange={(e) => setGloss(e.target.value)}
                  placeholder="e.g. INJECTION"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sign-meaning">Clinical Meaning / Usage</Label>
                <Input
                  id="sign-meaning"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="e.g. Administering medicine via syringe"
                  required
                />
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
                  Add Sign to Dictionary
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search sign gloss or meaning..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-xs font-medium"
          >
            <option value="all">All Categories</option>
            <option value="healthcare">Clinical Vocabulary</option>
            <option value="basic">Basic Communication</option>
            <option value="navigation">Hospital Navigation</option>
            <option value="needs">Patient Needs</option>
          </select>
        </div>
      </div>

      {filteredSigns.length === 0 ? (
        <EmptyState
          icon={ShieldX}
          title="No signs found"
          description="Try adjusting your search query or category filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSigns.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssessmentsSection({ assessment }: { assessment?: Assessment | null }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Clinical Assessments & Exam Bank</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Standardized certification quizzes with strict 75% passing threshold.
          </p>
        </div>
        <Button
          variant="hero"
          className="font-bold"
          onClick={() => toast.info("Bronze Clinical Assessment contains 8 active reviewed questions")}
        >
          <Plus aria-hidden="true" className="mr-1.5 size-4" /> Add Question to Bank
        </Button>
      </div>

      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Bronze Healthcare ISL Assessment
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              15-minute timed examination &bull; 8 Clinical triage and patient interaction questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-bold text-emerald-400 border-emerald-500/30">
              Pass Mark: 75%
            </Badge>
            <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
              Tier: Bronze
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {assessment && assessment.questions && assessment.questions.length > 0 ? (
            <div className="space-y-4">
              {assessment.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      <span className="font-mono text-primary font-bold mr-2">Q{idx + 1}.</span>
                      {q.prompt}
                    </p>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                      {q.kind.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Multiple choice options */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = opt === q.answer || optIdx.toString() === q.answer;
                      return (
                        <div
                          key={opt}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold"
                              : "bg-background/60 border-border/40 text-muted-foreground"
                          }`}
                        >
                          <span className="font-mono size-5 grid place-items-center rounded-lg bg-muted text-[11px]">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                          {isCorrect ? (
                            <CheckCircle2 className="size-3.5 ml-auto text-emerald-400 shrink-0" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  1. When asking a patient about their pain level in ISL, which facial expression is appropriate?
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="size-3.5" /> Correct Answer: Furrowed brows and concerned empathetic posture
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  2. What is the emergency triage sign for requesting immediate doctor presence?
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="size-3.5" /> Correct Answer: DOCTOR sign followed by urgent palms-open pulse gesture
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsSection() {
  const [facility, setFacility] = useState("Apollo Multi-Speciality Hospital");
  const [region, setRegion] = useState("Delhi NCR");
  const [lang, setLang] = useState("ta");
  const [strictness, setStrictness] = useState("balanced");

  const handleSave = () => {
    toast.success("Platform settings saved", {
      description: `Configured for ${facility} (${region}) with primary speech audio: ${lang.toUpperCase()}`,
    });
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">Facility & AI Platform Settings</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure hospital directory integration, AI kinematic threshold, and default VoiceBridge language.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inst-name">Facility Name</Label>
            <Input
              id="inst-name"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst-state">State / Region</Label>
            <Input
              id="inst-state"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inst-lang">Default VoiceBridge Speech Language</Label>
            <select
              id="inst-lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
            >
              <option value="ta">Tamil (தமிழ்) — Natural Native Audio</option>
              <option value="en">English (Indian Accent)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inst-strictness">AI Camera Landmark Strictness</Label>
            <select
              id="inst-strictness"
              value={strictness}
              onChange={(e) => setStrictness(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
            >
              <option value="balanced">Balanced (60% Confidence) — Recommended</option>
              <option value="strict">Strict (80% Confidence) — Clinical Examination</option>
              <option value="relaxed">Relaxed (45% Confidence) — Beginner Practice</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="hero" onClick={handleSave} className="font-bold">
            Save Facility Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
