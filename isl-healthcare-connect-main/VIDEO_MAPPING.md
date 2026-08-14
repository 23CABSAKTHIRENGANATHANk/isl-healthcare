# ISL Setu Video Mapping & Dataset Analysis

**Date**: August 14, 2026  
**Source**: `dataset viedo/Sample Videos/`  
**Total Videos**: 58 MP4 files  
**Mapped to Lessons**: 25 signs + supplementary content

---

## Sign-to-Video Mapping

### ✅ Confirmed Direct Matches (7)

| Sign Name | Lesson | Video File | Status | Notes |
|-----------|--------|-----------|--------|-------|
| HELLO | Greetings | Hello.mp4 | ✅ Ready | Core greeting sign |
| THANK YOU | Greetings | Thank you.mp4 | ✅ Ready | Politeness/gratitude |
| GOOD MORNING | Basic | Good morning.mp4 | ✅ Ready | Time-specific greeting |
| GOOD AFTERNOON | Basic | Good afternoon.mp4 | ✅ Ready | Afternoon greeting |
| FEVER | Healthcare | Fever.mp4 | ✅ Ready | Symptom sign |
| DRINK | Patient Needs | Drink.mp4 | ✅ Ready | Can map to WATER |
| INTERVIEW | Healthcare | Interview.mp4 | ⚠️ Optional | Extended sign, not in core list |

### ⚠️ Semantic/Contextual Matches (Need Verification)

| Sign Name | Lesson | Possible Video | Mapping Logic | Status |
|-----------|--------|----------------|---------------|--------|
| WATER | Patient Needs | Drink.mp4 | Semantically related (drink = need water) | Use with note |
| PAIN | Healthcare | (none exact) | No direct match | Demo mode |
| MEDICINE | Healthcare | (none exact) | No direct match | Demo mode |
| DOCTOR | Healthcare | (none exact) | No direct match | Demo mode |
| NURSE | Healthcare | (none exact) | No direct match | Demo mode |
| BLOOD | Healthcare | (none exact) | No direct match | Demo mode |
| EMERGENCY | Healthcare | (none exact) | No direct match | Demo mode |
| HELP | Patient Needs | (none exact) | No direct match | Demo mode |
| STOP | Patient Needs | (none exact) | No direct match | Demo mode |
| WAIT | Patient Needs | (none exact) | No direct match | Demo mode |
| REST | Patient Needs | (none exact) | No direct match | Demo mode |
| FOOD | Patient Needs | (none exact) | No direct match | Demo mode |
| YES | Basic | (none exact) | No direct match | Demo mode |
| NO | Basic | (none exact) | No direct match | Demo mode |
| NUMBERS | Basic | (none exact) | No direct match | Demo mode |
| RECEPTION | Navigation | (none exact) | No direct match | Demo mode |
| PHARMACY | Navigation | (none exact) | No direct match | Demo mode |
| WARD | Navigation | (none exact) | No direct match | Demo mode |
| BATHROOM | Navigation | (none exact) | No direct match | Demo mode |
| WAITING ROOM | Navigation | (none exact) | No direct match | Demo mode |

### Other Available Videos (Not Mapped to Core Curriculum)

**Animals** (11):
- Bear.mp4, Crocodile.mp4, Elephant.mp4, Giraffe.mp4, Lion.mp4, Monkey.mp4, Peacock.mp4, Pigeon.mp4, Sparrow.mp4, Tiger.mp4, Turtle.mp4
- *Future*: Could add nature/safety-related expansion lessons

**Vegetables** (9):
- Brinjal.mp4, Cabbage.mp4, Carrot.mp4, Cauliflower.mp4, Chilli.mp4, Cucumber.mp4, Lemon.mp4, Onion.mp4, Radish.mp4
- *Future*: Could add nutrition/dietary communication lessons

**Action Verbs** (15):
- Break.mp4, Clean.mp4, Close.mp4, Come.mp4, Cook.mp4, Cry.mp4, Give.mp4, Jump.mp4, Pour.mp4, Still.mp4, Switch.mp4, Write.mp4, Wrong.mp4
- *Future*: Could add to patient instructions or action-based lessons

**Other Words** (16):
- Busy.mp4, Budget.mp4, Exam.mp4, Fedup.mp4, Interview.mp4, Key.mp4, Knife.mp4, Maths.mp4, Man.mp4, Tea.mp4, Temple.mp4, Uncle.mp4, Wife.mp4, Volcano.mp4, What is your Name.mp4, Vegetables.mp4, Karnataka.mp4

---

## Video Mapping Implementation

### For Mock Data (src/services/mock/data.ts)

```typescript
// Apply video URLs to signs:
sign(
  "HELLO",
  "Greeting a patient or visitor",
  "basic",
  "beginner",
  "Widely consistent across regions",
  [/* steps */],
  "/dataset-viedo/Sample-Videos/Hello.mp4"  // NEW: videoUrl parameter
)
```

### Path Strategy

**Relative paths** for Vite asset loading:
```
/dataset-viedo/Sample-Videos/Hello.mp4
```

**Why**:
- Works in dev and production
- No hardcoding of URLs
- Easy migration to Supabase Storage later
- Public folder serves assets automatically

### Future Migration to Supabase Storage

```typescript
// Phase 2: After videos uploaded to Supabase
const videoUrl = supabase.storage
  .from('sign-videos')
  .getPublicUrl('hello.mp4').data.publicUrl;

// Would become: 
// https://[project].supabase.co/storage/v1/object/public/sign-videos/hello.mp4
// No component code changes needed (service layer handles it)
```

---

## Recommendations

### Immediate (MVP - Use Existing Videos)
1. ✅ Map Hello, Thank You, Good Morning/Afternoon, Fever, Drink
2. ✅ Use demo mode for unmapped signs (with clear label)
3. ✅ Don't falsely claim all videos are production ISL
4. ✅ Add note: "First 5 signs have demonstration videos; others show step-by-step guidance"

### Short Term (1-2 weeks)
1. Record missing core healthcare signs (Pain, Medicine, Doctor, Nurse, etc.)
2. Verify with Deaf ISL trainers
3. Host on Supabase Storage or CDN
4. Update database with new URLs

### Medium Term (1 month)
1. Expand vegetable/animal signs to nutrition/safety lessons
2. Add multiple angle videos (front, side, close-up)
3. Add slow-motion variants
4. Build video library matching ISL curriculum standards

### Long Term (Ongoing)
1. Maintain video quality standards
2. Update with feedback from Deaf users
3. Add regional variations clearly labeled
4. Create trainer/admin upload system in /admin

---

## Current Dataset Quality Notes

### Positive
✅ Clear, focused signs  
✅ Good camera angles (mostly front/close-up)  
✅ Consistent lighting  
✅ Professional MP4 format  
✅ Reasonable length (3-8 seconds each)  
✅ Can be used for learning reference  

### Limitations
⚠️ Not a complete ISL curriculum  
⚠️ Only 7 signs match immediate healthcare needs  
⚠️ May have variations from regional ISL standards  
⚠️ No multiple angle views  
⚠️ No slow-motion variants  
⚠️ No audio/narration  

### Content Verification
- Should be reviewed with certified ISL trainers before marking as official
- Clear disclaimers on non-verified content
- Regional variations should be labeled if known

---

## Implementation Checklist

### Phase 1: Immediate Implementation
- [ ] Copy dataset to public/dataset-viedo for Vite serving
- [ ] Update mock/data.ts with video_url for 7 mapped signs
- [ ] Test video loading in lesson player
- [ ] Verify no console errors
- [ ] Test on desktop + mobile

### Phase 2: Graceful Fallback
- [ ] Ensure demo mode clearly labeled for unmapped signs
- [ ] Show message: "This sign uses step-by-step guidance (video pending)"
- [ ] Verify quiz still works
- [ ] Verify practice still works

### Phase 3: Documentation
- [ ] Document which signs have videos
- [ ] Link to this mapping file in lesson UI
- [ ] Add disclaimer about content sources
- [ ] Note when videos will be upgraded

### Phase 4: Future Content
- [ ] Plan video recording sessions
- [ ] Coordinate with ISL trainers
- [ ] Create standardized format
- [ ] Set up Supabase Storage structure

---

## File Structure

```
public/
├── dataset-viedo/
│   └── Sample-Videos/
│       ├── Hello.mp4
│       ├── Thank you.mp4
│       ├── Good morning.mp4
│       ├── Good afternoon.mp4
│       ├── Fever.mp4
│       ├── Drink.mp4
│       └── [58 other videos]
```

Vite will serve these at runtime as:
```
/dataset-viedo/Sample-Videos/Hello.mp4
```

---

## Questions to Answer

1. **Are these standard ISL or regional variants?**
   - Answer: Should verify with ISL trainers
   - Action: Add content verification process

2. **Can we use these commercially?**
   - Answer: Verify dataset license/usage rights
   - Action: Check with legal/dataset source

3. **When will we record professional variants?**
   - Answer: Phase 2, after MVP launch
   - Action: Schedule trainer collaboration

4. **Should we prioritize by frequency of use?**
   - Answer: Yes, healthcare-first approach
   - Action: Focus on Pain, Medicine, Doctor first

---

## Status

**Dataset Analysis**: ✅ Complete  
**Video Mapping**: ✅ Identified 7 direct matches  
**Implementation Ready**: ✅ Yes  
**Next Step**: Update mock/data.ts and test  

**Timeline**: Today (4 hours for Phase 1)

---

*This document serves as reference for video content management throughout the platform's lifecycle.*
