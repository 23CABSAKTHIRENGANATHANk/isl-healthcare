# ISL Healthcare Connect

Build ISL Setu — an AI-assisted Indian Sign Language healthcare learning and

communication platform.

PRODUCT VISION

ISL Setu helps healthcare workers (receptionists, nurses, pharmacists,

ASHA/ANM workers, security staff, doctors, counsellors) learn Indian Sign

Language, practice signs with AI-assisted camera recognition, communicate

basic healthcare needs via Sign-to-Text-to-Voice, get assessed, and earn

certifications. It is a full learning + communication + certification

platform — NOT just a translator app. Core journey:

LEARN → PRACTICE → COMMUNICATE → ASSESS → CERTIFY → ADOPT

Initial sector: Healthcare. Architect it so Education, Government, Banking,

and Workplace sectors can be added later without a rewrite.

BRAND

Name: ISL Setu

Tagline: "Learn ISL. Practice with AI. Communicate without barriers."

Logo concept: combine a bridge shape + a hand/sign motif + a human

connection element. Use it consistently in the navbar, favicon, and footer.

DESIGN DIRECTION

Premium, modern, accessibility-first healthcare SaaS — not a generic admin

template. Duolingo-style learning warmth meets a clinical-grade dashboard.

- Light backgrounds by default; professional blue + teal accents; subtle

  gradients used sparingly

- Rounded cards, soft shadows, clean typography, high contrast, generous

  whitespace, large readable text

- Lucide icons throughout

- Subtle Framer Motion micro-interactions (hero entrance, scroll reveal,

  card hover, progress animation, AI scanning pulse, success animation,

  certificate reveal, dashboard counters, page transitions) — respect

  prefers-reduced-motion

- Reserve dark UI only for the camera/AI recognition sections, where it

  improves contrast against a live video feed

- Feeling: trustworthy, healthcare-grade, human, accessible — not flashy.

  Avoid excessive gradients, glassmorphism, random colours, or fake 3D.

TECH STACK

React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + Lucide
icons with Vite and TanStack Start. Use Supabase for auth, Postgres, and
storage (set this up for real, even though most data is mocked for now).

Structure the codebase clearly: components/, features/, pages/, hooks/,

lib/, services/, types/ — no giant single-file pages, and no data

hardcoded inline inside components. Route all lesson/sign/user/hospital

data through a thin service layer shaped like future Supabase tables

(users, lessons, signs, progress, assessments, certificates, hospitals,

staff, achievements), so mock data can later be swapped for real queries

without touching component code.

AI / CAMERA FEATURE ARCHITECTURE

There is no real sign-recognition model yet — everything camera-based is

an honest "Demo Mode" for now, never presented as a live AI prediction.

Create a single service function, e.g. `predictSign(imageInput)`, that

today returns simulated results shaped exactly like a future real

response: `{ sign: "HELP", confidence: 0.94 }`. This should be the only

place that needs to change when a real recognition endpoint (via a

Supabase Edge Function) is wired in later.

===========================================================

PAGES TO BUILD (all real, fully navigable — no placeholders)

===========================================================

1) LANDING PAGE ( / )

- Hero: headline "Breaking the Communication Barrier in Healthcare",

  subheadline "Learn Indian Sign Language, practice with AI, and

  communicate with confidence.", short description paragraph, two CTAs

  ("Start Learning", "Try VoiceBridge"), and an animated visual pipeline:

  Sign → AI → Text → Voice with animated connecting lines.

- Impact stats: 4 animated cards — "18M+ estimated hearing-impaired

  population in India" (clearly labeled as an estimate), "4 core platform

  capabilities", "50+ healthcare signs planned for MVP", "24/7 digital

  learning access". No fabricated deployment/adoption numbers.

- Problem section ("Healthcare Communication Should Never Be a Barrier"):

  4 cards — Communication Gap, Interpreter Availability, Rural Access,

  Professional Skill Gap.

- Solution section ("One Platform. Four Capabilities."): 4 interactive

  cards — Learn, Practice, Communicate, Certify.

- How It Works: animated 5-step scroll timeline — Learn, Practice,

  Communicate, Assess, Certify.

- Rural Accessibility ("Designed for Every India"): 4 cards — Offline

  Learning (PWA, planned), Mobile First, ASHA/ANM Friendly, District ISL

  Champions. Do not claim these are already deployed.

- Linguistic diversity note: ISL Setu uses credible ISL learning resources

  and clearly labels regional variations rather than presenting one form

  as universal.

2) /login and /signup

Clean forms wired to Supabase Auth, with a healthcare-role selector on

signup (Nurse, Receptionist, Pharmacist, ASHA/ANM Worker, Security Staff,

Doctor, Counsellor).

3) /dashboard — User dashboard

Greeting ("Good morning, [Name] 👋"), subtitle ("Ready to continue your

ISL journey?"), summary cards (Learning Progress %, Current Level, Daily

Streak, Accuracy), "Continue Learning" card, weekly progress chart, recent

activity feed, achievement badges, certification progress, recommended

lessons.

4) /learn — Learning dashboard

Header "Learn Indian Sign Language". Top summary cards: Overall Progress,

Current Level, Daily Goal, Learning Streak. Categories, each with lesson

cards (thumbnail, title, duration, difficulty, progress bar,

Start/Continue button):

- Basic Communication: Hello, Thank You, Yes, No, Numbers

- Healthcare: Doctor, Nurse, Medicine, Pain, Fever, Blood, Emergency

- Hospital Navigation: Reception, Pharmacy, Ward, Bathroom, Waiting Room

- Patient Needs: Help, Water, Food, Rest, Stop

Sample lessons: Greetings at Reception, Asking About Pain, Finding the

Doctor, Medicine Communication, Emergency Communication, Hospital

Navigation, Basic Patient Needs.

5) /learn/[lesson] — Lesson player

Example "Lesson 04 — Asking for Help": progress bar, ISL demonstration

video area with play/pause/replay/speed controls and captions/subtitles,

"Sign Breakdown" (Step 1 – Hand position, Step 2 – Movement, Step 3 –

Final sign), "Practice this sign" button linking to /practice, and a

quick quiz ("What does this sign mean?" multiple choice → "Correct! 🎉").

6) /practice — "Practice with AI"

Subtitle "Show the sign and get instant feedback." Large camera preview

(dark UI here for contrast). Camera states: Camera Ready → Scanning... →

Recognising... → Detected ✓. Target sign display (e.g. "SHOW: HELP").

Controls: Start Camera, Stop Camera, Try Again, Next Sign. Stats:

Recognition Confidence (e.g. 94%), Attempts, Accuracy. Success state

("Great job! ✓") and failure state ("Sign not recognised. Try again.")

with visual hand-position guidance. Camera permission flow: explain

before requesting, show "Your camera is used for sign practice. Camera

footage is not stored by default." Handle permission-denied and

camera-unavailable states. Include a clearly labeled "Try Demo" button

(simulates HELP, PAIN, DOCTOR, MEDICINE, EMERGENCY recognition, tagged

"Demo Mode").

7) /voicebridge — "VoiceBridge"

Subtitle "Turn selected ISL signs into spoken communication." Three-part

layout: camera preview (left) → AI processing animation (center) →

recognition result (right: detected sign, confidence %, generated text

like "I need help.", "🔊 Play Voice" button). Controls: Start Camera,

Speak, Repeat, Try Again. Animated pipeline: Camera → ISL Sign → AI

Recognition → Text → Voice. Vocabulary chips: HELP, PAIN, DOCTOR,

MEDICINE, EMERGENCY, WAIT, WATER, YES, NO. Same "Try Demo" mode as

/practice. Always-visible disclaimer: "VoiceBridge is an AI-assisted

communication aid and does not replace qualified interpreters or

established clinical communication procedures for complex or critical

interactions."

8) /assessment — "Healthcare ISL Assessment"

Header: Level (e.g. Bronze), Questions (20), Duration (15 minutes),

"Question 7 / 20" progress. Question types: identify-the-sign,

match-sign-to-meaning, multiple choice, camera-based practice task (reuse

the practice camera component). Results screen: Score, Accuracy,

Pass/Fail, Correct Answers, "View Certification" button.

9) /certification — Certification dashboard

Three cards: Bronze (40 Essential Healthcare Signs), Silver (150 Clinical

Signs), Gold (Advanced Healthcare Communication) — each with status

(Completed/Locked), progress bar, requirements, certificate preview, View

button. Completed certs get "View Certificate" / "Download Certificate".

Professional certificate design — no fake government seals or official

accreditation claims (clearly an ISL Setu platform credential).

10) /hospital — Hospital ISL Accessibility Dashboard

Header with hospital name, "ISL-Ready — In Progress" status. Stat cards:

Certified Staff, Bronze/Silver/Gold counts. Staff table (Name, Role,

Certification, Progress, Status). Charts: certification progress,

department coverage, monthly training. Buttons: Manage Staff, Generate

Report. Premium "ISL-READY FACILITY" status card (Certified Staff,

Departments Covered, Last Training, Active status) — labeled as an ISL

Setu platform status, not government accreditation.

11) /admin — Admin/Trainer portal

Sidebar nav: Dashboard, Users, Hospitals, Lessons, Signs, Assessments,

Certificates, Analytics. Actions: Add Lesson, Upload Sign Video, Edit

Lesson, Add Sign, Create Quiz, Manage Users, Review Assessments, Manage

Certificates, View Analytics. Trainer profile with a "Certified Deaf ISL

Trainer" badge and verification indicator.

12) /about

Mission ("To make basic Indian Sign Language communication more

accessible across healthcare services."), Vision ("A healthcare system

where communication is not a barrier to receiving essential care."),

Problem, Solution, Healthcare Focus, Technology, Accessibility, Deaf

Community Involvement, Future Expansion. Include an animated roadmap

timeline: Phase 1 Healthcare MVP, Phase 2 Selected hospitals/PHCs, Phase 3

ASHA/ANM + Nursing Institutions, Phase 4 State expansion, Phase 5 National

expansion, Phase 6 Education/Government/Banking/Workplaces.

13) /accessibility — Responsible AI + Accessibility statement

Responsible AI content: AI is an assistance tool; the MVP recognizes a

limited vocabulary; AI can make mistakes; critical clinical communication

should follow appropriate professional procedures; the system does not

diagnose disease; camera data isn't stored by default; sign content

should be reviewed with Deaf ISL users/instructors. Use shield/security

visuals. Also implement — and actually apply site-wide — WCAG-aware

contrast, full keyboard navigation, visible focus states, ARIA labels, alt

text, captions on lesson videos, large touch targets, reduced-motion

support, and never using color alone to indicate status.

===========================================================

CROSS-CUTTING REQUIREMENTS

===========================================================

- Mobile: bottom navigation bar, large touch targets, camera-first layout

  for /practice and /voicebridge on small screens, swipeable lesson

  cards, simplified mobile dashboard — should feel like a native learning

  app, not a shrunk desktop site.

- Error/empty/loading states: loading skeletons, camera permission

  denied, camera unavailable, AI recognition failed ("We couldn't

  recognise that sign. Try again with better lighting and keep your hand

  inside the frame."), network unavailable, empty lessons, empty

  progress, certificate unavailable.

- Never expose secrets in frontend code — use environment variables.

- Never claim demo/mock AI results are real predictions.

- Never fabricate statistics, government logos, or official

  accreditation.

- Reusable design-system components throughout: Button, Card, Badge,

  Progress Bar, Modal, Toast, Tabs, Dropdown, Tooltip, Video Player,

  Camera Preview, Sign Card, Lesson Card, Certificate Card, Dashboard

  Card, Data Table, Chart, Navigation, Footer — consistent spacing,

  typography, radius, shadows, icons, colours across all of them.

Build the full application now, with working navigation between every

page listed above and realistic mock data everywhere a real backend

connection isn't wired in yet.

## Getting Started & Development

To run ISL Setu locally:

```sh
# Install dependencies
npm install  # or bun install / pnpm install

# Start the local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
