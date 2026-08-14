# ISL Setu Production Upgrade Plan

**Date**: August 14, 2026  
**Objective**: Transform ISL Setu from partial implementation to hackathon-ready healthcare ISL platform  
**Status**: 🚀 Execution Phase

---

## Executive Summary

### Current State
✅ Frontend deployed on Vercel  
✅ Backend deployed on Render  
✅ Supabase database configured  
✅ SignDisplay component exists (video player)  
✅ 50+ actual ISL videos available  
❌ **Videos NOT connected to lessons** ← CRITICAL ISSUE  
❌ Lesson experience incomplete (no slow-motion, quiz, step guidance)  
❌ Practice module incomplete  
❌ VoiceBridge incomplete  
❌ Assessment incomplete  

### Target State (by end of sprint)
✅ Real ISL videos showing in lessons  
✅ Full lesson experience (video controls, steps, quiz)  
✅ Working camera practice with AI feedback  
✅ Complete user journey: Learn → Practice → Communicate → Assess → Certify  
✅ Production-ready UI/UX  
✅ Mobile responsive  
✅ Accessible (WCAG)  
✅ Deployed and tested  

---

## Phase 1: Video Integration (4 hours)

### 1.1 Map Available Videos to Signs

**Available Videos in**: `dataset viedo/Sample Videos/`

**Mapping**:
```
HELLO → Hello.mp4
THANK YOU → Thank you.mp4
GOOD MORNING → Good morning.mp4
GOOD AFTERNOON → Good afternoon.mp4
FEVER → Fever.mp4
DRINK → Drink.mp4
STOP → (search alternative or demo mode)
WAIT → (search alternative or demo mode)
HELP → (search alternative or demo mode)
FOOD → (search alternative or demo mode)
WATER → Drink.mp4 (semantic match)
REST → (search alternative or demo mode)
MEDICINE → (search alternative or demo mode)
PAIN → (search alternative or demo mode)
YES → (search alternative or demo mode)
NO → (search alternative or demo mode)
DOCTOR → (search alternative or demo mode)
NURSE → (search alternative or demo mode)
EMERGENCY → (search alternative or demo mode)
NUMBERS → (search alternative or demo mode)
RECEPTION → (search alternative or demo mode)
PHARMACY → (search alternative or demo mode)
WARD → (search alternative or demo mode)
BATHROOM → (search alternative or demo mode)
WAITING ROOM → (search alternative or demo mode)
BLOOD → (search alternative or demo mode)
```

### 1.2 Update Mock Data

**File**: `src/services/mock/data.ts`

```typescript
video_url: "/dataset-viedo/Sample-Videos/Hello.mp4"  // Relative path for Vite
```

**Why relative paths**:
- Works in development and production
- Vite serves public assets automatically
- No hardcoded URLs
- Easy to migrate to Supabase Storage later

### 1.3 Test Video Loading

```
npm run dev
→ /learn/greetings-at-reception
→ Should see real HELLO video playing
→ Not gradient demo
```

---

## Phase 2: Enhance Lesson Player (6 hours)

### 2.1 SignDisplay Component Upgrades

**Current**: Basic video player with play/pause  
**Target**: Professional learning interface

**Add**:
- ✅ Replay button
- ✅ Slow-motion controls (0.5x, 0.75x, 1x, 1.25x)
- ✅ Progress bar with time display
- ✅ Volume control
- ✅ Fullscreen button
- ✅ Keyboard shortcuts (spacebar = play/pause)
- ✅ Mobile touch controls

**Code Changes**:
```typescript
// In SignDisplay.tsx, extend VideoPlayer features
- playbackRate state
- currentTime / duration tracking
- volume control
- fullscreen API
- keyboard event handlers
```

### 2.2 Step-by-Step Guidance

**Current**: Just text steps below  
**Target**: Interactive step visualization

**Add to learn.$lesson.tsx**:
```tsx
<div className="mt-8 space-y-4">
  <h3 className="text-lg font-semibold">How to perform this sign</h3>
  {current.steps.map((step, idx) => (
    <div key={idx} className="rounded-lg bg-blue-50 p-4 border-l-4 border-blue-500">
      <div className="font-semibold text-sm text-gray-600">Step {idx + 1}</div>
      <p className="mt-1 text-foreground">{step}</p>
    </div>
  ))}
</div>
```

### 2.3 Quick Quiz Integration

**Current**: Quiz exists but not shown  
**Target**: Interactive quiz after video

**Add**:
```tsx
if (step < items.length) {
  // Show video + steps
  // Then show quiz if available
  <QuizCard
    question={current.quiz?.[0]}
    onCorrect={handleQuizCorrect}
    onIncorrect={handleQuizIncorrect}
  />
}
```

**Create**: `src/components/common/QuizCard.tsx`

---

## Phase 3: Practice Module (5 hours)

### 3.1 Target Sign Pre-loading

**Route**: `/practice?sign=HELP`

**Implementation**:
```typescript
// In practice.$route.tsx
const searchParams = new URLSearchParams(location.search);
const targetSignGloss = searchParams.get("sign");

if (targetSignGloss) {
  // Fetch target sign
  const targetSign = await signByGloss(targetSignGloss);
  // Auto-populate camera
}
```

### 3.2 Camera Integration

**Current**: CameraPreview component exists  
**Target**: Full practice flow

**Flow**:
```
Camera Ready
  ↓
User shows sign
  ↓
AI processes frame
  ↓
Recognition result
  ↓
Compare to target
  ↓
Feedback & retry
```

### 3.3 AI Service Layer

**File**: `src/services/ai.service.ts`

**Current**:
```typescript
export async function predictSign(imageData: ArrayBuffer) {
  // POST to /api/predict-sign
  // Returns: { sign, confidence, mode: "demo" | "production" }
}
```

**Enhance**:
```typescript
// Clear demo vs real AI distinction
// Better error handling
// Timeout handling
// Retry logic
```

---

## Phase 4: Complete Flows (5 hours)

### 4.1 Dashboard Enhancement

**Add**:
```
- Quick stats (streak, level, accuracy)
- Continue learning card
- Recent practice attempts
- Certification progress
- Recommended lessons
```

### 4.2 VoiceBridge Flow

**Route**: `/voicebridge`

**Steps**:
1. User captures sign on camera
2. AI recognizes → text
3. Text-to-speech → audio
4. Play speaker output

**Components**:
- CameraPreview (already exists)
- Speech synthesis (browser API)
- Playback controls

### 4.3 Assessment Module

**Route**: `/assessment`

**Flow**:
1. Start assessment
2. Show sign (without gloss)
3. User practices camera
4. AI evaluation
5. Score + pass/fail
6. View certification option

### 4.4 Certification Module

**Route**: `/certification`

**Show**:
- Levels (Bronze, Silver, Gold)
- Progress
- Completed certificates
- Download option

**Important**: Clear labeling as ISL Setu Platform credential, not government certification

---

## Phase 5: Polish & Launch (4 hours)

### 5.1 Responsive Design

**Mobile breakpoints**:
- Bottom navigation instead of sidebar
- Larger touch targets (48px minimum)
- Fullscreen camera for practice
- Swipeable lesson cards

### 5.2 Accessibility (WCAG 2.1 Level AA)

- Keyboard navigation (Tab, Enter, Space)
- ARIA labels on all interactive elements
- Contrast ratios ≥ 4.5:1
- Focus states visible
- Captions on videos
- Reduced motion support

### 5.3 Error Handling

**Add error boundaries**:
- Network unavailable
- Backend service down
- Video not found
- Camera permission denied
- AI recognition failed
- Browser unsupported

**Each with user-friendly message**:
```
"We couldn't load that lesson. 
Check your connection and try again."
```

### 5.4 Performance Optimization

- Lazy load videos
- Image optimization (thumbnails)
- Bundle splitting
- Database query optimization
- Reduce API calls

### 5.5 Security & Privacy

- No camera footage stored by default
- Environment variables for all secrets
- Input validation
- Rate limiting on API
- RLS on Supabase

### 5.6 Final Testing

**Test signs**:
- HELLO → video plays
- THANK YOU → video plays
- FEVER → video plays
- GOOD MORNING → video plays
- Others → demo mode (graceful)

**Test devices**:
- Desktop (Chrome, Edge, Firefox)
- Mobile (iOS Safari, Android Chrome)
- Tablet (iPad, Android tablet)

**Test connectivity**:
- Slow network (3G simulation)
- Offline (show message)
- Backend down (show message)

---

## Implementation Order

### Day 1: Video Integration + Enhanced Player
```
1. Map videos to signs (30 min)
2. Update mock data (30 min)
3. Test video loading (30 min)
4. Enhance SignDisplay component (2 hours)
5. Add step visualization (1.5 hours)
6. Add quiz UI (1.5 hours)
```

### Day 2: Practice & Features
```
1. Practice route with target sign (1 hour)
2. Camera integration (1.5 hours)
3. AI service enhancements (1 hour)
4. VoiceBridge basic flow (1.5 hours)
5. Dashboard enhancements (1 hour)
6. Assessment basics (1 hour)
```

### Day 3: Polish & Deploy
```
1. Mobile responsiveness (1.5 hours)
2. Accessibility audit (1.5 hours)
3. Error handling & edge cases (1.5 hours)
4. Performance optimization (1 hour)
5. Final testing (1.5 hours)
6. Deploy to Vercel + Render (30 min)
```

---

## File Changes Summary

### New Files
- `PRODUCTION_UPGRADE_PLAN.md` (this file)
- `VIDEO_MAPPING.md` (video → sign mapping)
- `src/components/common/QuizCard.tsx`
- `src/components/common/StepGuidance.tsx`
- `src/components/common/PlaybackControls.tsx`

### Modified Files
- `src/services/mock/data.ts` (add video_url)
- `src/components/common/SignDisplay.tsx` (enhance player)
- `src/routes/learn.$lesson.tsx` (add steps, quiz)
- `src/routes/practice.tsx` (target sign pre-loading)
- `src/services/ai.service.ts` (better error handling)
- `src/routes/voicebridge.tsx` (complete flow)
- `src/routes/assessment.tsx` (complete flow)
- `src/routes/certification.tsx` (UI improvements)
- `src/routes/dashboard.tsx` (add stats, cards)

### Updated Services
- `content.service.ts` (ready, no changes needed)
- `progress.service.ts` (add quiz tracking)
- `assessment.service.ts` (enhance scoring)
- `hospital.service.ts` (add staff tracking)

---

## Success Criteria

✅ All routes load without errors  
✅ Real ISL videos show in lessons (not demo gradient)  
✅ Video player has: play, pause, replay, 0.5x-1.25x speed  
✅ Steps show below video  
✅ Quiz works and tracks answers  
✅ Practice loads correct target sign  
✅ Camera recognizes demo signs with confidence  
✅ VoiceBridge converts sign → text → voice  
✅ Dashboard shows progress  
✅ Assessment scores correctly  
✅ Certification generates downloadable PDF  
✅ Mobile responsive (tested on iOS & Android)  
✅ Accessible (keyboard navigation, ARIA labels)  
✅ Error states handled gracefully  
✅ No console errors or warnings  
✅ Deployed to Vercel + Render successfully  
✅ Production URLs working  

---

## Rollback Plan

If critical issues arise:
1. Revert to last known good commit
2. Redeploy from Vercel dashboard
3. Disable problematic feature with feature flag
4. Debug locally before re-deploying

**Last stable commit**: `c1fa2fd` (hand sign video feature deployed)

---

## Team Notes

- Sign content verified with ISL standards ✓
- Regional variations clearly labeled ✓
- No fake AI predictions ✓
- No fake government accreditation ✓
- Accessible design first ✓
- Mobile-first approach ✓
- Service architecture maintained ✓
- Secrets never exposed ✓

---

**Next Action**: Execute Phase 1 - Video Integration (4 hours)
