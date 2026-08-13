import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Pencil, Plus, ShieldX, UploadCloud } from "lucide-react";

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

function roleLabel(role: StaffMember["role"]) {
  return HEALTHCARE_ROLES.find((r) => r.value === role)?.label ?? role;
}

const staffStatus: Record<StaffMember["status"], StatusKind> = {
  active: "completed",
  training: "in_progress",
  inactive: "not_started",
};

export function UsersSection({ staff }: { staff: StaffMember[] }) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Manage users</CardTitle>
        <Button
          variant="outline"
          onClick={() => toast("User invited (demo)", { description: "Not yet connected to a live directory." })}
        >
          <Plus aria-hidden="true" /> Invite user
        </Button>
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
                        toast(`Editing ${member.full_name} (demo)`, { description: "No changes are saved." })
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
                  <TableCell>
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

  return (
    <DialogContent className="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast(lesson ? "Lesson updated (demo)" : "Lesson created (demo)", {
            description: "This form does not persist data yet.",
          });
          onClose();
        }}
        className="space-y-4"
      >
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit lesson" : "Add lesson"}</DialogTitle>
          <DialogDescription>Changes here are not saved to a live database.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lesson-title">Title</Label>
          <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Signs library</h3>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UploadCloud aria-hidden="true" /> Upload sign video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast("Upload received (demo)", {
                    description: "Video uploads are not yet wired to storage.",
                  });
                }}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitle>Upload sign video</DialogTitle>
                  <DialogDescription>
                    Uploads are not yet connected to storage — this is a preview form only.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="sign-video">Video file</Label>
                  <Input id="sign-video" type="file" accept="video/*" />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="hero">
                    Upload
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus aria-hidden="true" /> Add sign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast("Sign added (demo)", { description: "This form does not persist data yet." });
                }}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitle>Add sign</DialogTitle>
                  <DialogDescription>Not yet connected to the live sign library.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="sign-gloss">Gloss</Label>
                  <Input id="sign-gloss" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-meaning">Meaning</Label>
                  <Input id="sign-meaning" required />
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

export function AssessmentsSection({ assessment }: { assessment: Assessment | null }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Assessments</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus aria-hidden="true" /> Create quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast("Quiz created (demo)", { description: "This form does not persist data yet." });
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Create quiz</DialogTitle>
                <DialogDescription>Draft a new assessment question set.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz title</Label>
                <Input id="quiz-title" required />
              </div>
              <DialogFooter>
                <Button type="submit" variant="hero">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {!assessment ? (
        <EmptyState icon={ShieldX} title="No assessment available" description="No assessment has been configured." />
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
                    onClick={() => toast("Marked as reviewed (demo)")}
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

export function CertificatesSection({ certificates }: { certificates: Certificate[] }) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle>Certificates</CardTitle>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <EmptyState icon={ShieldX} title="No certificates" description="No certificates have been issued yet." />
        ) : (
          <Table>
            <TableCaption className="text-left">Certificate issuance status.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Title</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Issued</TableHead>
                <TableHead scope="col">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium text-foreground">{cert.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={cert.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast(`${cert.title} issued (demo)`, { description: "No record was changed." })}
                    >
                      Issue
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast(`${cert.title} revoked (demo)`, { description: "No record was changed." })}
                    >
                      Revoke
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
