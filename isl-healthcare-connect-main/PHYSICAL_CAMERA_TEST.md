# 📷 ISL SETU — PHYSICAL CAMERA TEST CHECKLIST & PROTOCOL

**Document:** Physical Device & Environmental Vision Validation Protocol  
**System:** ISL Setu (Indian Sign Language Healthcare Connect)  
**Standard:** WCAG 2.1 AA / Clinical Triage Usability Guidelines  
**Current Testing Mode:** `Responsive Browser Emulation Verified; Physical Test Matrix Specified Below`

---

## 1. DEVICE & HARDWARE MATRIX

| DEVICE TYPE | OPERATING SYSTEM | BROWSER | CAMERA TYPE | TEST STATUS |
| :--- | :--- | :--- | :--- | :---: |
| **Laptop Webcam** | Windows 11 / macOS / Ubuntu | Chrome 120+, Edge, Firefox | Integrated 720p/1080p | `READY FOR VERIFICATION` |
| **Android Smartphone** | Android 12, 13, 14 | Chrome Mobile | Front-Facing 12MP (Selfie) | `READY FOR VERIFICATION` |
| **iOS Smartphone (iPhone)** | iOS 16, 17 | Safari / Chrome iOS | TrueDepth Front Camera | `READY FOR VERIFICATION` |
| **Tablet / Clinical iPad** | iPadOS / Android Tablet | Safari / Chrome | Front-Facing Wide Angle | `READY FOR VERIFICATION` |

---

## 2. PHYSICAL CAMERA TEST CHECKLIST

Mark tests as they are physically verified on actual hardware:

### **A. Environmental Lighting Conditions**
- [ ] **Good Lighting:** Daylight / 400+ lux fluorescent clinical lighting (Expected: Status `POSITION_GOOD`, Quality `GOOD`)
- [ ] **Low Lighting:** Dim ambient light (< 50 lux) (Expected: Status `POOR_LIGHTING`, UI: *"Lighting is low or uneven. Move to a brighter area."*)
- [ ] **Backlighting:** Strong window or lamp behind user (Expected: Evaluates skin contrast, prompts adjustment)

### **B. Hand Distance & Sizing**
- [ ] **Near Hand:** Hand filling > 55% of video frame (Expected: Status `MOVE_FARTHER`, UI: *"Move your hand slightly farther away"*)
- [ ] **Far Hand:** Hand filling < 3.5% of video frame (Expected: Status `MOVE_CLOSER`, UI: *"Move your hand closer to the camera"*)
- [ ] **Optimal Distance:** Hand filling 10%–35% inside guide box (Expected: Status `POSITION_GOOD ✓`, Quality `GOOD`)

### **C. Hand Framing & Positioning**
- [ ] **Left Position:** Hand near left edge (< 5% margin) (Expected: Status `KEEP_INSIDE_FRAME`)
- [ ] **Right Position:** Hand near right edge (> 95% margin) (Expected: Status `KEEP_INSIDE_FRAME`)
- [ ] **Top Position:** Hand touching top edge (< 5% margin) (Expected: Status `KEEP_INSIDE_FRAME`)
- [ ] **Bottom Position:** Hand cut off at wrist (Expected: Status `KEEP_INSIDE_FRAME`)
- [ ] **Centered Position:** Hand fully within rounded guide frame (Expected: Status `POSITION_GOOD ✓`)

### **D. Motion & Movement Dynamics**
- [ ] **Static Gesture:** Hand held steady for 1.5 seconds (Expected: Temporal buffer confirms prediction $3/5$ matches)
- [ ] **Fast Rapid Movement:** High-speed waving (> 1.2 m/s) (Expected: Rejects blurred frames without triggering false predictions)
- [ ] **Partial Hand:** 2 fingers hidden outside lens (Expected: Rejects incomplete landmark geometry, status `KEEP_INSIDE_FRAME`)

### **E. Healthcare Vocabulary Sign Verification**
- [ ] **HELP:** Open palm over chest / distress sign (Expected: Recognized `HELP (91%+)` ➔ *"I need immediate help."*)
- [ ] **DOCTOR:** Index & middle finger pulse touch gesture (Expected: Recognized `DOCTOR (92%+)` ➔ *"Please call the doctor."*)
- [ ] **NURSE:** Caregiver badge tap gesture (Expected: Recognized `NURSE (90%+)` ➔ *"Please call the nurse."*)
- [ ] **PAIN:** Pointing to pain site / tension hand (Expected: Recognized `PAIN (93%+)` ➔ *"I am experiencing severe pain."*)
- [ ] **FEVER:** Back of hand to forehead (Expected: Recognized `FEVER (94%+)` ➔ *"I have a high fever."*)
- [ ] **MEDICINE:** Pill to mouth gesture (Expected: Recognized `MEDICINE (91%+)` ➔ *"Please administer medicine."*)
- [ ] **WATER:** Cup to mouth hydration gesture (Expected: Recognized `WATER (95%+)` ➔ *"Please provide drinking water."*)
- [ ] **EMERGENCY:** Waving urgent alert sign (Expected: Recognized `EMERGENCY (92%+)` ➔ *"Urgent medical emergency."*)

---

## 3. PHYSICAL VERIFICATION STEPS

1. Open [http://localhost:5174/practice?sign=DOCTOR](http://localhost:5174/practice?sign=DOCTOR) on physical device.
2. Permit camera access in browser popup.
3. Verify selfie camera is mirrored and 21 landmark dots align with physical fingertips.
4. Test guide box alerts by moving closer, farther, and left/right.
5. Execute the target gesture and verify recognition sound and TTS output.
