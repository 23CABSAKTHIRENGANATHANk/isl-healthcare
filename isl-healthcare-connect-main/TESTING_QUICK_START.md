# VideoPlayer & Quiz Integration - Quick Start Testing Guide

## 🚀 Getting Started

### Prerequisites
- Dev server running: http://localhost:5174
- Terminal access for running verification script

### Step 1: Verify Server is Running
```bash
cd e:\project\project\isl-healthcare-connect-main\isl-healthcare-connect-main
npm run dev
```

Expected output:
```
VITE v8.2.1  ready in ~2000 ms
➜  Local:   http://localhost:5174/
```

### Step 2: Verify Routes (Optional)
```bash
node verify-integration.js
```

Expected output shows ✅ for all routes.

---

## 🧪 Manual Testing Scenarios

### Scenario 1: Basic VideoPlayer Test (5 minutes)

1. **Navigate to Lesson Page**
   - Open http://localhost:5174/learn/greetings-intake
   - First sign should load: **HELLO**

2. **Test Video Display**
   - ✓ Video displays in VideoPlayer component
   - ✓ Video source is `/dataset-videos/Hello.mp4`
   - ✓ No console errors (press F12 to open DevTools)

3. **Test Play/Pause Controls**
   - Hover over video to reveal controls
   - ✓ Click play button → video plays
   - ✓ Click pause button → video pauses
   - ✓ Time counter shows current/total duration (format: MM:SS)

4. **Test Volume Control**
   - Hover over video to see volume slider on the right
   - ✓ Drag volume slider left → volume decreases
   - ✓ Drag volume slider right → volume increases
   - ✓ Click volume icon → mute toggle
   - ✓ Icon changes to muted when volume=0

5. **Test Playback Speed**
   - Look for "1x" button on control bar
   - ✓ Click "1x" → dropdown shows speeds: 0.5x, 0.75x, 1x, 1.25x
   - ✓ Select 0.5x → video plays at half speed
   - ✓ Select 1.25x → video plays faster
   - ✓ Verify speed persists when pausing/playing

---

### Scenario 2: Full Screen Test (3 minutes)

1. **Enable Fullscreen**
   - Hover over video
   - ✓ Click fullscreen button (looks like ⊡ expand icon)
   - ✓ Video expands to full screen
   - ✓ Controls remain accessible

2. **Keyboard Shortcut: F for Fullscreen**
   - In fullscreen mode, press F
   - ✓ Video exits fullscreen
   - ✓ Returns to normal size

3. **Keyboard Shortcuts in General**
   - While video is visible, test these:
   - ✓ Press Space → play/pause
   - ✓ Press F → toggle fullscreen
   - ✓ Press M → toggle mute
   - ✓ Press Left Arrow (←) → seek back 5 seconds
   - ✓ Press Right Arrow (→) → seek forward 5 seconds
   - ✓ Press Up Arrow (↑) → increase volume 10%
   - ✓ Press Down Arrow (↓) → decrease volume 10%

---

### Scenario 3: Quiz Component Test (5 minutes)

1. **Display Sign Information**
   - Scroll down from video
   - ✓ Sign meaning displays: "A gesture to greet someone"
   - ✓ Regional note displays (if available)
   - ✓ Key steps display in numbered list (1, 2, 3...)

2. **Find Quiz Button**
   - Scroll further down
   - ✓ "Test your understanding" button visible
   - ✓ Button is clickable (not disabled)

3. **Take Quiz**
   - Click "Test your understanding"
   - ✓ Quiz appears (replaces sign info)
   - ✓ Quiz title shows: "Quick Check"
   - ✓ Progress bar shows question count (e.g., "Question 1 of 5")
   - ✓ First question displays with 4 answer options

4. **Answer Questions**
   - Click on first answer option
   - ✓ Selected option highlights in blue
   - ✓ After selection, wait 2 seconds
   - ✓ Feedback appears: "Correct!" or "Incorrect"
   - ✓ Quiz **automatically** advances to next question (auto-advance)
   - ✓ Progress updates: "Question 2 of 5"

5. **Complete Quiz**
   - Answer all 5 questions
   - ✓ After last question, results screen appears
   - ✓ Score displays (e.g., "80% - 4 out of 5 correct")
   - ✓ Pass/Fail badge appears:
     - Green badge if score ≥ 70% ("PASS")
     - Yellow badge if score < 70% ("NEEDS IMPROVEMENT")
   - ✓ "Retake Quiz" button visible at bottom

6. **Retake Quiz**
   - Click "Retake Quiz"
   - ✓ Quiz resets to Question 1
   - ✓ Previous answers cleared
   - ✓ Progress shows "1 of 5" again

---

### Scenario 4: Navigation Between Signs (5 minutes)

1. **View Current Sign**
   - Page shows: Sign #1 of 4 (example: HELLO)
   - Next sign button visible at bottom

2. **Navigate to Next Sign**
   - ✓ Click "Next sign" button
   - ✓ Page scrolls to top
   - ✓ New sign loads (example: THANK YOU)
   - ✓ New video plays (Thank you.mp4)
   - ✓ New quiz button available

3. **Navigate Back**
   - ✓ Click "Previous sign" button
   - ✓ Returns to previous sign (HELLO)
   - ✓ Video and quiz reset

4. **Reach Lesson End**
   - Keep clicking "Next sign" until last sign
   - ✓ "Next sign" button becomes "Finish lesson"
   - ✓ Click "Finish lesson"
   - ✓ Completion screen appears:
     - ✓ "Lesson completed! 🎉" message
     - ✓ Sign count: "You've learned all X signs"
     - ✓ "Next lesson" button (if available)
     - ✓ "Practice with AI" button
     - ✓ "Back to lessons" button

---

### Scenario 5: Test Multiple Lessons (8 minutes)

**Test 3 different lessons in sequence:**

1. **Lesson: Greetings Intake**
   - http://localhost:5174/learn/greetings-intake
   - Signs: HELLO, THANK YOU, GOOD MORNING, ...
   - ✓ Video plays for each
   - ✓ Quiz works for each
   - ✓ Navigation smooth

2. **Lesson: Clinical Triage**
   - Complete greetings lesson first
   - Click "Next lesson: Clinical Triage"
   - ✓ New lesson loads
   - ✓ First sign video displays
   - ✓ Quiz functional
   - ✓ Can complete full lesson

3. **Lesson: Pediatric Care**
   - Navigate via /learn route
   - Select "Pediatric Care" lesson
   - ✓ Loads correctly
   - ✓ All signs have videos
   - ✓ Quiz system works

---

### Scenario 6: Responsive Design Test (5 minutes)

**Desktop (1920x1080)**
1. Open http://localhost:5174/learn/greetings-intake
2. ✓ VideoPlayer takes full width of card
3. ✓ Controls clearly visible
4. ✓ Text readable
5. ✓ Quiz options align horizontally

**Tablet (768x1024)**
1. Press F12 in browser (open DevTools)
2. Click responsive design button
3. Set dimension: 768 x 1024
4. ✓ VideoPlayer scales appropriately
5. ✓ Controls remain accessible
6. ✓ Quiz options stack properly
7. ✓ Text still readable

**Mobile (375x667)**
1. Set responsive dimension: 375 x 667
2. ✓ VideoPlayer mobile-optimized
3. ✓ Fullscreen button works
4. ✓ Quiz fits on screen without horizontal scroll
5. ✓ Touch targets (buttons) large enough (≥44px)
6. ✓ No layout breaks

---

### Scenario 7: Error Handling (3 minutes)

1. **Open DevTools Console** (F12 → Console tab)
2. ✓ No red error messages
3. ✓ No undefined variable warnings
4. ✓ No "Cannot read property" errors

2. **Test Missing Video**
   - Edit URL to non-existent sign: http://localhost:5174/learn/fake-lesson
   - Expected: 404 page or "not found" message
   - ✓ No crash
   - ✓ Error is handled gracefully

3. **Test Video Load Failure** (simulated)
   - Open network tab (DevTools → Network)
   - Throttle network to "Slow 3G"
   - Navigate to lesson
   - ✓ Video loads progressively
   - ✓ Buffering shows while loading
   - ✓ Can still see sign info text

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] VideoPlayer loads and displays video
- [ ] Play/Pause works
- [ ] Volume control works
- [ ] Playback speed selection works (0.5x, 0.75x, 1x, 1.25x)
- [ ] Fullscreen toggle works
- [ ] Progress bar seeking works
- [ ] Keyboard shortcuts work (Space, F, M, arrows)

### Quiz Functionality
- [ ] Quiz button appears and is clickable
- [ ] Quiz displays questions with 4 options
- [ ] Answer selection highlights correctly
- [ ] Auto-advance to next question works (2 second delay)
- [ ] Progress bar updates correctly
- [ ] Results screen shows score and pass/fail badge
- [ ] Retake button works

### Navigation
- [ ] Previous sign button works (disabled on first sign)
- [ ] Next sign button works
- [ ] Next sign navigates correctly
- [ ] Lesson completion screen displays
- [ ] Next lesson button works (if available)

### Responsive Design
- [ ] Desktop layout (1920x1080) looks good
- [ ] Tablet layout (768x1024) looks good
- [ ] Mobile layout (375x667) looks good
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets large enough on mobile

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Video starts playing within 2 seconds
- [ ] No lag when clicking controls
- [ ] No stuttering during playback
- [ ] Smooth seeking on progress bar

### Console/Errors
- [ ] No red errors in console
- [ ] No undefined variable warnings
- [ ] No TypeScript type errors
- [ ] No missing image/video warnings

---

## 🎯 Success Criteria

**✅ Integration Successful if:**
1. All VideoPlayer controls work
2. Quiz displays and scores correctly
3. Navigation between signs works smoothly
4. No console errors
5. Responsive design works on all screen sizes
6. Performance acceptable (< 3s load)

**❌ Issues to Address if:**
- Video doesn't play (check console for 404)
- Quiz doesn't auto-advance (check setTimeout in Quiz.tsx)
- Navigation jumps incorrectly (check state management)
- Layout breaks on mobile (check Tailwind responsive classes)
- Console shows errors (trace and fix)

---

## 🔧 Debugging Tips

### If Video Doesn't Load
1. Check DevTools Network tab
2. Look for `/dataset-videos/[VideoName].mp4` requests
3. Verify files exist in `public/videos/dataset-videos/`
4. Check 404 errors in console

### If Quiz Doesn't Display
1. Check that `lesson.quiz` property exists in mock data
2. Open console and verify QuizQuestion type
3. Check that quiz questions array has items
4. Verify Quiz component is imported in learn.$lesson.tsx

### If Navigation Doesn't Work
1. Check browser history (back/forward)
2. Verify step/showQuiz state in React DevTools
3. Check that handleStepForward is called correctly
4. Verify lesson has multiple signs

### If Console Shows Errors
1. Take screenshot of error message
2. Note the line number and file
3. Check VideoPlayer.tsx or Quiz.tsx imports
4. Verify all props are passed correctly

---

## 📱 Test Sign Videos Available

| Sign | Video File | Status |
|------|-----------|--------|
| HELLO | Hello.mp4 | ✅ Ready |
| THANK YOU | Thank you.mp4 | ✅ Ready |
| FEVER | Fever.mp4 | ✅ Ready |
| COME | Come.mp4 | ✅ Ready |
| DRINK | Drink.mp4 | ✅ Ready |
| GOOD MORNING | Good morning.mp4 | ✅ Ready |
| MEDICINE | Medicine.mp4 | ✅ Ready |
| FOOD | Food.mp4 | ✅ Ready |
| STOP | Stop.mp4 | ✅ Ready |
| WATER | Water.mp4 | ✅ Ready |

**Total videos available**: 61 gesture classes in `/public/videos/dataset-videos/`

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review console errors
3. Check VIDEOPLAYER_QUIZ_INTEGRATION_TEST.md for detailed specs
4. Examine VideoPlayer.tsx and Quiz.tsx source code
5. Verify mock data in src/services/mock/data.ts

---

**Last Updated**: January 2025  
**Status**: 🟢 Ready for Testing  
**Build**: ✅ Passed
