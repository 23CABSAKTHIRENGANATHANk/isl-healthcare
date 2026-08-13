# Agent Guidelines - ISL Setu (Healthcare Connect)

ISL Setu is an accessibility-first Indian Sign Language (ISL) healthcare learning, practice, and communication platform built with React, TypeScript, TanStack Start / Router, Tailwind CSS, and Supabase.

## Development Principles
- **Architecture**: Keep components modular (`src/components/`, `src/features/`, `src/routes/`, `src/services/`, `src/hooks/`, `src/lib/`, `src/types/`).
- **Data Layer**: All lesson, practice, sign, and assessment data flow through the service layer (`src/services/`) for seamless transition between mock and live Supabase queries.
- **Design System**: Use semantic tokens defined in `src/styles.css` (OKLCH color system, Sora and Plus Jakarta Sans typography).
- **Accessibility & Ethics**: Prioritize high contrast, screen-reader friendly markup, and clear Demo Mode disclosures for AI gesture simulation.
