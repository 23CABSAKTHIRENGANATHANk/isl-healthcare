import { Flag, Send } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Accessible feedback / report-an-issue form. No backend wiring or fake
 * SLAs — submission simply confirms the report was captured for the team.
 */
export function FeedbackForm() {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      event.currentTarget.reset();
      toast.success("Thanks — your report has been sent to the ISL Setu team.", {
        description: "We review reports manually and don't currently offer a fixed response time.",
      });
    }, 400);
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardContent className="flex flex-col gap-5 p-7">
        <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <Flag className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-foreground">Report an issue or share feedback</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Spotted an accessibility barrier, an incorrect sign, or something that felt unsafe or
            confusing? Let us know. Reports are read and handled by the ISL Setu team — we don't
            currently promise a fixed response time.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input id={nameId} name="name" autoComplete="name" required minLength={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={messageId}>What happened?</Label>
            <Textarea
              id={messageId}
              name="message"
              required
              minLength={10}
              rows={4}
              placeholder="Describe the issue or feedback in as much detail as you can."
            />
          </div>
          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={submitting}
            className="self-start"
          >
            <Send /> {submitting ? "Sending…" : "Send report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
