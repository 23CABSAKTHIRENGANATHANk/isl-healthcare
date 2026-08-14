"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({
  children,
  delayDuration,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function TooltipTrigger({
  children,
  className,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  asChild?: boolean;
}) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: string; align?: string }
>(({ className, children, side, align, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
