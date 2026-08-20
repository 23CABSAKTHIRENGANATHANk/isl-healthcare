-- =============================================================================
-- ISL Setu — Supabase PostgreSQL Database Schema & Seed Data
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'nurse',
  avatar_url text,
  current_level text not null default 'bronze',
  learning_streak integer not null default 0,
  hospital_id text,
  sector text not null default 'healthcare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. SIGNS
-- -----------------------------------------------------------------------------
create table if not exists public.signs (
  id text primary key,
  gloss text not null,
  meaning text not null,
  category_id text not null,
  difficulty text not null default 'beginner',
  region_note text not null default 'Consistent across regions',
  steps jsonb not null default '[]'::jsonb,
  video_url text,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. LESSONS
-- -----------------------------------------------------------------------------
create table if not exists public.lessons (
  id text primary key,
  slug text not null unique,
  code text not null,
  title text not null,
  summary text not null,
  category_id text not null,
  duration_minutes integer not null default 10,
  difficulty text not null default 'beginner',
  thumbnail_tone text not null default 'primary',
  thumbnail_url text,
  video_url text,
  captions jsonb not null default '[]'::jsonb,
  sign_ids jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  order_index integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. LESSON PROGRESS
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  lesson_id text references public.lessons(id) on delete cascade not null,
  progress_percent integer not null default 0,
  completed boolean not null default false,
  last_position integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- 5. ASSESSMENTS & QUESTIONS
-- -----------------------------------------------------------------------------
create table if not exists public.assessments (
  id text primary key,
  tier text not null default 'bronze',
  title text not null,
  duration_minutes integer not null default 15,
  passing_score integer not null default 75,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_questions (
  id text primary key,
  assessment_id text references public.assessments(id) on delete cascade not null,
  prompt text not null,
  kind text not null default 'multiple_choice',
  options jsonb not null default '[]'::jsonb,
  answer text not null,
  target_sign text,
  hint text,
  order_index integer not null default 0
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  assessment_id text references public.assessments(id) on delete cascade not null,
  score integer not null,
  total integer not null,
  accuracy_percent integer not null,
  passed boolean not null default false,
  tier text not null default 'bronze',
  completed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 6. CERTIFICATES
-- -----------------------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tier text not null default 'bronze',
  title text not null default 'Bronze Healthcare ISL Credential',
  subtitle text not null default 'Foundation Healthcare Indian Sign Language Proficiency',
  certificate_number text not null unique,
  score integer not null default 80,
  status text not null default 'completed',
  issued_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. ACHIEVEMENTS & USER ACHIEVEMENTS
-- -----------------------------------------------------------------------------
create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null default 'Trophy',
  requirement text
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

-- -----------------------------------------------------------------------------
-- 8. HOSPITALS & HOSPITAL STAFF
-- -----------------------------------------------------------------------------
create table if not exists public.hospitals (
  id text primary key,
  name text not null,
  city text not null,
  state text not null,
  readiness text not null default 'in_progress',
  departments_covered integer not null default 6,
  departments_total integer not null default 8,
  created_at timestamptz not null default now()
);

create table if not exists public.hospital_staff (
  id uuid primary key default gen_random_uuid(),
  hospital_id text references public.hospitals(id) on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  full_name text not null,
  role text not null,
  department text not null,
  certification text,
  progress_percent integer not null default 0,
  status text not null default 'active',
  joined_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 9. AI PRACTICE ATTEMPTS (Privacy-first: No raw camera frames stored)
-- -----------------------------------------------------------------------------
create table if not exists public.ai_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  sign_id text not null,
  predicted_sign text,
  confidence numeric not null default 0,
  mode text not null default 'ai',
  model_version text not null default 'isl_v1',
  success boolean not null default false,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.signs enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_results enable row level security;
alter table public.certificates enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.hospitals enable row level security;
alter table public.hospital_staff enable row level security;
alter table public.ai_practice_attempts enable row level security;
alter table public.hospitals enable row level security;
alter table public.hospital_staff enable row level security;

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Signs & Lessons: Public read for published items
create policy "Anyone can view published signs" on public.signs
  for select using (is_published = true);

create policy "Anyone can view published lessons" on public.lessons
  for select using (is_published = true);

-- Lesson Progress: Users can view and manage their own progress
create policy "Users can view own lesson progress" on public.lesson_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own lesson progress" on public.lesson_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own lesson progress" on public.lesson_progress
  for update using (auth.uid() = user_id);

-- Assessments: Public read
create policy "Anyone can view assessments" on public.assessments
  for select using (true);

create policy "Anyone can view assessment questions" on public.assessment_questions
  for select using (true);

create policy "Users can view own assessment results" on public.assessment_results
  for select using (auth.uid() = user_id);

create policy "Users can insert own assessment results" on public.assessment_results
  for insert with check (auth.uid() = user_id);

-- Certificates: Users can view own certificates
create policy "Users can view own certificates" on public.certificates
  for select using (auth.uid() = user_id);

create policy "Users can insert own certificates" on public.certificates
  for insert with check (auth.uid() = user_id);

-- Achievements: Public read achievements, users view/insert own earned achievements
create policy "Anyone can view achievements" on public.achievements
  for select using (true);

create policy "Users can view own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);

create policy "Users can insert own achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);

-- Hospitals: Public read or authenticated staff read
create policy "Anyone can view hospitals" on public.hospitals
  for select using (true);

create policy "Anyone can view hospital staff" on public.hospital_staff
  for select using (true);

create policy "Authenticated users can insert hospital staff" on public.hospital_staff
  for insert with check (auth.role() = 'authenticated');

-- AI Practice Attempts: Users view and insert own attempts
create policy "Users can view own practice attempts" on public.ai_practice_attempts
  for select using (auth.uid() = user_id);

create policy "Users can insert own practice attempts" on public.ai_practice_attempts
  for insert with check (auth.uid() = user_id);

-- =============================================================================
-- AUTOMATED USER CREATION TRIGGER
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'healthcare_role', 'nurse')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Signs
insert into public.signs (id, gloss, meaning, category_id, difficulty, region_note, steps) values
('hello', 'HELLO', 'Greeting a patient or visitor at reception', 'basic', 'beginner', 'Widely consistent across regions', '["Open palm faces forward at shoulder height, fingers relaxed together.","Move the hand outward and slightly away from the forehead in one smooth arc.","Finish with the palm angled toward the person and hold briefly with eye contact."]'::jsonb),
('thank-you', 'THANK YOU', 'Expressing gratitude', 'basic', 'beginner', 'Minor regional variation in start position', '["Flat hand starts with fingertips near the chin, palm inward.","Move the hand forward and down toward the other person.","End with the palm open and a nod."]'::jsonb),
('yes', 'YES', 'Affirmation / Confirmation', 'basic', 'beginner', 'Consistent across regions', '["Make a loose fist, knuckles facing forward.","Bend the wrist down and up like a nodding head.","Repeat twice at a calm pace."]'::jsonb),
('no', 'NO', 'Negation / Refusal', 'basic', 'beginner', 'Consistent across regions', '["Extend index and middle finger with the thumb open.","Close the two fingers onto the thumb in one motion.","Hold the closed shape briefly."]'::jsonb),
('doctor', 'DOCTOR', 'Referring to a medical doctor / physician', 'healthcare', 'beginner', 'Two accepted variants in North and South India', '["Index and middle fingers touch the inside of the opposite wrist.","Tap twice, as if checking a pulse.","Return the hand to a neutral position."]'::jsonb),
('nurse', 'NURSE', 'Referring to a nurse or care assistant', 'healthcare', 'beginner', 'Regional variants exist; label locally', '["Two fingers tap the wrist as for DOCTOR.","Follow with a flat hand brushing across the forehead like a cap edge.","Hold the final position briefly."]'::jsonb),
('medicine', 'MEDICINE', 'Medicine, tablets or prescription', 'healthcare', 'beginner', 'Widely consistent', '["Middle finger touches the open palm of the other hand.","Rotate the finger in a small circle on the palm.","Lift the hand slightly to finish."]'::jsonb),
('pain', 'PAIN', 'Indicating pain, ache or hurt', 'healthcare', 'beginner', 'Location of sign follows the painful body part', '["Index fingers point toward each other, a short distance apart.","Twist both wrists inward with a tense expression.","Move the hands near the affected body part."]'::jsonb),
('fever', 'FEVER', 'High body temperature / fever', 'healthcare', 'beginner', 'Some regions add a shivering movement', '["Back of the flat hand touches the forehead.","Move the hand slightly away and back once.","Finish with a concerned facial expression."]'::jsonb),
('emergency', 'EMERGENCY', 'Urgent medical attention needed immediately', 'healthcare', 'beginner', 'Urgency conveyed through speed and facial tension', '["Form an E handshape with fingertips curled against thumb.","Shake the hand side to side quickly in front of the chest.","Maintain alert, focused facial expression."]'::jsonb),
('water', 'WATER', 'Requesting or offering drinking water', 'needs', 'beginner', 'Consistent across all Indian states', '["Make a W handshape with three middle fingers upright.","Tap index finger lightly against the corner of the lower lip twice.","Keep mouth relaxed."]'::jsonb),
('food', 'FOOD', 'Food, meal or hunger', 'needs', 'beginner', 'Consistent across regions', '["Bring all fingertips together touching the thumb in a closed pinch.","Tap the fingertips near the mouth twice.","Slight head tilt forward."]'::jsonb),
('wait', 'WAIT', 'Please wait / pause', 'navigation', 'beginner', 'Universal healthcare gesture', '["Both hands open, palms facing up at chest height.","Wiggle fingers gently while keeping palms still.","Calm, reassuring facial expression."]'::jsonb),
('stop', 'STOP', 'Halt or stop', 'navigation', 'beginner', 'Consistent across regions', '["One hand open palm flat horizontal.","Edge of other hand chops down vertically onto the palm.","Firm stop at point of contact."]'::jsonb),
('blood', 'BLOOD', 'Blood or blood sample', 'healthcare', 'intermediate', 'Location near arm vein or finger', '["Point index finger to inside of elbow or fingertip.","Move hand downward with fluttering fingers indicating flow.","Calm expression."]'::jsonb)
on conflict (id) do update set
  gloss = excluded.gloss,
  meaning = excluded.meaning,
  category_id = excluded.category_id,
  steps = excluded.steps;

-- Lessons
insert into public.lessons (id, slug, code, title, summary, category_id, duration_minutes, difficulty, thumbnail_tone, sign_ids, quiz, order_index) values
('greetings-at-reception', 'greetings-at-reception', 'BSC-01', 'Greetings at Reception', 'Learn basic welcoming signs for front desk and reception staff.', 'basic', 8, 'beginner', 'primary', '["hello","thank-you","yes","no","wait"]'::jsonb, '[{"id":"q1","prompt":"Which sign is made by tapping the fingertips near the chin moving forward?","kind":"multiple_choice","options":["HELLO","THANK YOU","YES","WAIT"],"answer":"THANK YOU"},{"id":"q2","prompt":"Identify the sign for nodding affirmation.","kind":"multiple_choice","options":["NO","WAIT","YES","DOCTOR"],"answer":"YES"}]'::jsonb, 1),
('asking-about-pain', 'asking-about-pain', 'MED-01', 'Asking About Pain', 'Assess patient pain location, intensity and urgency.', 'healthcare', 12, 'beginner', 'teal', '["pain","fever","emergency","doctor"]'::jsonb, '[{"id":"q1","prompt":"How is the sign for PAIN modified for location?","kind":"multiple_choice","options":["It stays at the chest always","It moves near the painful body part","It is performed above the head","It uses both feet"],"answer":"It moves near the painful body part"},{"id":"q2","prompt":"Which sign involves checking the wrist pulse?","kind":"multiple_choice","options":["NURSE","DOCTOR","MEDICINE","FEVER"],"answer":"DOCTOR"}]'::jsonb, 2),
('finding-the-doctor', 'finding-the-doctor', 'MED-02', 'Finding the Doctor', 'Guide patients to physician consultation rooms and duty doctors.', 'healthcare', 10, 'beginner', 'primary', '["doctor","nurse","wait","stop"]'::jsonb, '[{"id":"q1","prompt":"Which sign combines wrist pulse tap with forehead cap edge touch?","kind":"multiple_choice","options":["DOCTOR","NURSE","SECURITY","PHARMACIST"],"answer":"NURSE"}]'::jsonb, 3),
('medicine-communication', 'medicine-communication', 'MED-03', 'Medicine Communication', 'Instruct patients on dosage, pharmacy counters and taking tablets.', 'healthcare', 10, 'beginner', 'teal', '["medicine","water","food","stop"]'::jsonb, '[{"id":"q1","prompt":"Which movement represents MEDICINE?","kind":"multiple_choice","options":["Swirling finger in open palm","Waving goodbye","Pointing to eyes","Touching ears"],"answer":"Swirling finger in open palm"}]'::jsonb, 4),
('emergency-communication', 'emergency-communication', 'EMG-01', 'Emergency Communication', 'Rapid response signs for critical casualty and trauma reception.', 'healthcare', 15, 'beginner', 'gold', '["emergency","doctor","nurse","blood","pain"]'::jsonb, '[{"id":"q1","prompt":"What handshape is shaken side to side for EMERGENCY?","kind":"multiple_choice","options":["Open 5 palm","E handshape","Thumbs up","Index finger"],"answer":"E handshape"}]'::jsonb, 5),
('hospital-navigation', 'hospital-navigation', 'NAV-01', 'Hospital Navigation', 'Direct patients to OPD, pharmacy, diagnostics, and wards.', 'navigation', 10, 'beginner', 'primary', '["wait","stop","doctor","nurse"]'::jsonb, '[{"id":"q1","prompt":"Which gesture politely indicates Please Wait?","kind":"multiple_choice","options":["Two upward palms with gentle finger wiggles","Crossing arms","Clapping hands","Finger on lips"],"answer":"Two upward palms with gentle finger wiggles"}]'::jsonb, 6),
('basic-patient-needs', 'basic-patient-needs', 'PAT-01', 'Basic Patient Needs', 'Understand fundamental comfort requests: water, food, washroom, and rest.', 'needs', 8, 'beginner', 'success', '["water","food","help","pain"]'::jsonb, '[{"id":"q1","prompt":"Which sign uses the W handshape tapping the lower lip?","kind":"multiple_choice","options":["FOOD","WATER","MEDICINE","PAIN"],"answer":"WATER"}]'::jsonb, 7)
on conflict (id) do update set
  title = excluded.title,
  summary = excluded.summary,
  sign_ids = excluded.sign_ids,
  quiz = excluded.quiz;

-- Assessments
insert into public.assessments (id, tier, title, duration_minutes, passing_score) values
('bronze', 'bronze', 'Bronze Healthcare ISL Assessment', 15, 75)
on conflict (id) do update set
  title = excluded.title,
  passing_score = excluded.passing_score;

-- Assessment Questions
insert into public.assessment_questions (id, assessment_id, prompt, kind, options, answer, target_sign, hint, order_index) values
('bq-1', 'bronze', 'What is the correct sign for greeting a patient at the hospital entrance?', 'multiple_choice', '["HELLO","EMERGENCY","STOP","PAIN"]'::jsonb, 'HELLO', null, 'Open palm moving outward from forehead', 1),
('bq-2', 'bronze', 'Which sign is performed by tapping index and middle fingers on the opposite wrist like a pulse?', 'multiple_choice', '["MEDICINE","DOCTOR","NURSE","WATER"]'::jsonb, 'DOCTOR', 'DOCTOR', 'Think of feeling a radial pulse', 2),
('bq-3', 'bronze', 'A patient touches the back of their flat hand to their forehead with a concerned expression. What are they communicating?', 'multiple_choice', '["FEVER","HUNGER","HOSPITAL DISCHARGE","THANK YOU"]'::jsonb, 'FEVER', null, 'Checking forehead temperature', 3),
('bq-4', 'bronze', 'How should a receptionist sign "Please wait a moment"?', 'multiple_choice', '["Palms up with gentle finger wiggles","Wave both hands frantically","Point to the exit","Clap twice"]'::jsonb, 'Palms up with gentle finger wiggles', null, 'Reassuring open palms', 4),
('bq-5', 'bronze', 'Which sign involves rotating the middle finger in a circle on the open opposite palm?', 'multiple_choice', '["MEDICINE","FOOD","BLOOD","YES"]'::jsonb, 'MEDICINE', null, 'Grinding or placing a tablet on the palm', 5),
('bq-6', 'bronze', 'Demonstrate or identify the sign for emergency triage.', 'multiple_choice', '["Shake E handshape with urgent expression","Thumbs up sign","Open palm waving","Hand on chest"]'::jsonb, 'Shake E handshape with urgent expression', 'EMERGENCY', 'E handshape side to side', 6),
('bq-7', 'bronze', 'Which sign uses the W handshape tapped against the lower lip twice?', 'multiple_choice', '["WATER","FOOD","FEVER","MEDICINE"]'::jsonb, 'WATER', 'WATER', 'W letter near mouth', 7),
('bq-8', 'bronze', 'When a patient points index fingers toward each other with a tense facial expression near their chest, what are they indicating?', 'multiple_choice', '["Chest Pain","Hospital Registration","Thirst","Need for food"]'::jsonb, 'Chest Pain', 'PAIN', 'Pain sign located at chest', 8)
on conflict (id) do update set
  prompt = excluded.prompt,
  options = excluded.options,
  answer = excluded.answer;

-- Achievements
insert into public.achievements (id, name, description, icon, requirement) values
('first_lesson', 'First Step', 'Completed your first healthcare ISL lesson', 'BookOpen', 'Complete 1 lesson'),
('five_lessons', 'Dedicated Learner', 'Completed 5 lessons in healthcare communication', 'Award', 'Complete 5 lessons'),
('streak_7', 'Week-Long Streak', 'Maintained a 7-day active learning streak', 'Flame', 'Reach 7-day streak'),
('first_assessment', 'Assessed & Verified', 'Passed your first healthcare ISL assessment', 'ClipboardCheck', 'Pass any assessment'),
('bronze_certified', 'Bronze Healthcare Certified', 'Earned official Bronze ISL Setu platform credential', 'Sparkles', 'Pass Bronze assessment')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

-- Hospitals
insert into public.hospitals (id, name, city, state, readiness, departments_covered, departments_total) values
('apollo-delhi', 'Apollo Multi-Speciality Hospital', 'New Delhi', 'Delhi', 'isl_ready', 8, 8),
('max-mumbai', 'Max Healthcare Centre', 'Mumbai', 'Maharashtra', 'in_progress', 6, 8),
('fortis-bengaluru', 'Fortis Care Facility', 'Bengaluru', 'Karnataka', 'in_progress', 5, 8)
on conflict (id) do update set
  name = excluded.name,
  readiness = excluded.readiness;

-- Hospital Staff
insert into public.hospital_staff (hospital_id, full_name, role, department, certification, progress_percent, status) values
('apollo-delhi', 'Pooja Sharma', 'nurse', 'Emergency Triage', 'bronze', 100, 'active'),
('apollo-delhi', 'Rahul Verma', 'receptionist', 'Central Registration', 'bronze', 100, 'active'),
('apollo-delhi', 'Dr. Arvind Patel', 'doctor', 'General Medicine', 'silver', 100, 'active'),
('apollo-delhi', 'Sunita Rao', 'asha_anm', 'Community Health', 'bronze', 85, 'training'),
('apollo-delhi', 'Vikram Singh', 'security', 'Main Entrance', null, 45, 'training')
on conflict do nothing;

-- =============================================================================
-- 10. SUPABASE REALTIME REPLICATION CONFIGURATION
-- =============================================================================

-- Enable Realtime publication on critical admin-monitored tables
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.hospital_staff;
alter publication supabase_realtime add table public.certificates;
alter publication supabase_realtime add table public.lesson_progress;

-- Ensure profiles are visible to authenticated clinicians & administrators
create policy "Authenticated users can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

