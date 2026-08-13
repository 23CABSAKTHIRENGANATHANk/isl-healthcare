import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Platform",
    links: [
      { to: "/learn", label: "Learn" },
      { to: "/practice", label: "Practice with AI" },
      { to: "/voicebridge", label: "VoiceBridge" },
      { to: "/assessment", label: "Assessment" },
      { to: "/certification", label: "Certification" },
    ],
  },
  {
    title: "Organisations",
    links: [
      { to: "/hospital", label: "Hospital dashboard" },
      { to: "/admin", label: "Admin & trainer portal" },
      { to: "/about", label: "About & roadmap" },
    ],
  },
  {
    title: "Responsibility",
    links: [
      { to: "/accessibility", label: "Responsible AI" },
      { to: "/accessibility", label: "Accessibility statement" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Learn ISL. Practice with AI. Communicate without barriers. A healthcare-first Indian Sign Language
              learning, communication and certification platform.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            ISL Setu credentials are platform credentials issued by ISL Setu. They are not a government
            accreditation and carry no official regulatory status.
          </p>
          <p>
            AI-assisted recognition is currently in clearly labelled Demo Mode. It is an assistance tool and does not
            replace qualified interpreters or established clinical communication procedures.
          </p>
          <p>© {new Date().getFullYear()} ISL Setu. Built with the Deaf community in mind.</p>
        </div>
      </div>
    </footer>
  );
}
