const fs = require('fs');

const categories = [
  {
    id: 'clinical',
    name: 'Clinical & Emergency Triage',
    description: 'Vital clinical vocabulary for symptoms, triage, fever, injury, diagnosis, and staff roles.',
    icon: 'Stethoscope',
    sector: 'healthcare',
  },
  {
    id: 'greetings',
    name: 'Clinical Greetings & Patient Intake',
    description: 'Everyday greetings, identity confirmation, intake requests, and calm bedside communication.',
    icon: 'MessageCircle',
    sector: 'healthcare',
  },
  {
    id: 'nutrition',
    name: 'Dietary Care & Patient Nutrition',
    description: 'Hospital meal plans, dietary restrictions, hydration, allergen checks, and post-op nutrition.',
    icon: 'Apple',
    sector: 'healthcare',
  },
  {
    id: 'pediatric',
    name: 'Pediatric Comfort & Reassurance',
    description: 'Calming pediatric patients, reassurance, play therapy signs, and child anxiety reduction.',
    icon: 'HandHeart',
    sector: 'healthcare',
  },
  {
    id: 'administration',
    name: 'Hospital Administration & Consent',
    description: 'Billing, next-of-kin contacts, diagnostics, documentation, and facility navigation.',
    icon: 'Building2',
    sector: 'healthcare',
  },
];

const fullSigns = [
  // Clinical & Emergency
  { gloss: 'FEVER', meaning: 'High body temperature or pyrexia', category_id: 'clinical', difficulty: 'intermediate', region_note: 'Back of flat hand touches forehead with concern', video_url: '/videos/signs/Fever.mp4', steps: ['Back of flat hand touches the forehead.', 'Move hand slightly away and back once.', 'Maintain clinical observation with calm expression.'] },
  { gloss: 'INJURY', meaning: 'Wound, trauma or physical injury', category_id: 'clinical', difficulty: 'intermediate', region_note: 'Point index fingers toward affected site', video_url: '/videos/signs/Injury.mp4', steps: ['Both index fingers point toward each other near wound area.', 'Twist wrists slightly with sharp, attentive posture.', 'Gesture gently toward the injury site for localization.'] },
  { gloss: 'PAIN', meaning: 'Physical discomfort or acute pain', category_id: 'clinical', difficulty: 'beginner', region_note: 'Location follows painful anatomical area', video_url: null, steps: ['Index fingers point toward each other a short distance apart.', 'Twist wrists inward with tense, sympathetic facial expression.', 'Indicate location of acute pain on body.'] },
  { gloss: 'DOCTOR', meaning: 'Physician or medical officer', category_id: 'clinical', difficulty: 'beginner', region_note: 'Two accepted variants in North and South India', video_url: null, steps: ['Index and middle fingers touch inside of opposite wrist.', 'Tap twice as if checking radial pulse rate.', 'Return hand to neutral open posture.'] },
  { gloss: 'NURSE', meaning: 'Nursing staff or caregiver', category_id: 'clinical', difficulty: 'beginner', region_note: 'Pulse tap followed by forehead sweep', video_url: null, steps: ['Two fingers tap the wrist as for DOCTOR.', 'Follow with flat hand brushing across forehead like cap edge.', 'Hold final position briefly with supportive eye contact.'] },
  { gloss: 'MEDICINE', meaning: 'Prescription drugs, tablets or syrup', category_id: 'clinical', difficulty: 'beginner', region_note: 'Widely consistent across all states', video_url: null, steps: ['Middle finger touches open palm of opposite hand.', 'Rotate finger in small circular grinding motion.', 'Lift hand slightly toward mouth to indicate dosage.'] },
  { gloss: 'BLOOD', meaning: 'Blood sample or hematology test', category_id: 'clinical', difficulty: 'intermediate', region_note: 'Consistent across major Indian hospitals', video_url: null, steps: ['Index finger touches lips indicating red color.', 'Open both hands and let fingers trickle downward gently.', 'Conclude with open palms lowered at waist level.'] },
  { gloss: 'EMERGENCY', meaning: 'Urgent immediate clinical care required', category_id: 'clinical', difficulty: 'advanced', region_note: 'Fast repetitive shake for urgency', video_url: null, steps: ['Form E-handshape with dominant hand.', 'Shake side to side rapidly at chest level.', 'Maintain alert facial expression indicating priority.'] },
  { gloss: 'HELP', meaning: 'Requesting or offering medical assistance', category_id: 'clinical', difficulty: 'beginner', region_note: 'Support hand lifting working hand', video_url: null, steps: ['Closed fist with thumb up rests on open palm of non-dominant hand.', 'Lift both hands upward together smoothly.', 'Nod head to signify supportive care.'] },
  { gloss: 'HOSPITAL', meaning: 'Healthcare facility or medical ward', category_id: 'clinical', difficulty: 'beginner', region_note: 'Cross sign on upper arm or chest', video_url: null, steps: ['Index and middle fingers trace cross on opposite upper arm.', 'Vertical stroke first, followed by horizontal stroke.', 'End with welcoming open hand posture.'] },

  // Clinical Greetings & Daily Patient Communication
  { gloss: 'HELLO', meaning: 'Welcoming a patient, visitor or caregiver', category_id: 'greetings', difficulty: 'beginner', region_note: 'Universal greeting across India', video_url: '/videos/signs/Hello.mp4', steps: ['Open palm faces forward at temple height.', 'Move hand outward and slightly away in a smooth welcoming arc.', 'Hold briefly while maintaining warm eye contact.'] },
  { gloss: 'GOOD MORNING', meaning: 'Morning clinical rounds greeting', category_id: 'greetings', difficulty: 'beginner', region_note: 'Sun rising gesture combined with good', video_url: '/videos/signs/Good morning.mp4', steps: ['Sign GOOD by bringing flat fingertips from chin outward.', 'Follow with non-dominant arm horizontal as dominant hand rises like sun.', 'Smile calmly to reassure patient.'] },
  { gloss: 'GOOD AFTERNOON', meaning: 'Midday patient check-in greeting', category_id: 'greetings', difficulty: 'beginner', region_note: 'Midday sun position gesture', video_url: '/videos/signs/Good afternoon.mp4', steps: ['Sign GOOD moving outward from chin.', 'Position dominant hand overhead pointing straight up for midday sun.', 'Lower hand smoothly to acknowledge patient.'] },
  { gloss: 'THANK YOU', meaning: 'Expressing gratitude or acknowledging patient cooperation', category_id: 'greetings', difficulty: 'beginner', region_note: 'Fingertips from chin outward', video_url: '/videos/signs/Thank you.mp4', steps: ['Flat hand fingertips touch chin, palm facing inward.', 'Extend hand forward and downward toward patient.', 'End with open palm and gentle head nod.'] },
  { gloss: 'WHAT IS YOUR NAME', meaning: 'Patient registration and identity check', category_id: 'greetings', difficulty: 'beginner', region_note: 'Two-finger name tap with question expression', video_url: '/videos/signs/What is your Name.mp4', steps: ['H-handshapes (index + middle fingers) tap together horizontally.', 'Follow with open palms facing upward tilted side to side.', 'Raise eyebrows slightly for question intonation.'] },
  { gloss: 'COME', meaning: 'Calling patient into consultation room or examination bed', category_id: 'greetings', difficulty: 'beginner', region_note: 'Inward wave motion', video_url: '/videos/signs/Come.mp4', steps: ['Open hand extended outward at chest height, palm facing inward.', 'Curl fingers inward smoothly twice toward torso.', 'Maintain welcoming inviting expression.'] },
  { gloss: 'GIVE', meaning: 'Handing over medical report, prescription or sample', category_id: 'greetings', difficulty: 'beginner', region_note: 'Forward delivery movement', video_url: '/videos/signs/Give.mp4', steps: ['Both hands in loose cupped shapes at waist height.', 'Extend hands forward smoothly toward recipient.', 'Open fingers slightly upon delivery.'] },
  { gloss: 'DRINK', meaning: 'Hydration, taking oral fluid or water medication', category_id: 'greetings', difficulty: 'beginner', region_note: 'C-handshape tipping toward mouth', video_url: '/videos/signs/Drink.mp4', steps: ['Form C-handshape resembling drinking cup.', 'Tip thumb side toward mouth smoothly as if sipping.', 'Repeat once calmly.'] },
  { gloss: 'CLEAN', meaning: 'Sanitizing, wound cleaning or hygienic wipe', category_id: 'greetings', difficulty: 'beginner', region_note: 'Palm sweeping motion across base hand', video_url: '/videos/signs/Clean.mp4', steps: ['Non-dominant palm flat facing upward.', 'Dominant flat palm brushes smoothly across non-dominant palm from heel to fingertips.', 'Repeat twice to emphasize sterile cleanliness.'] },
  { gloss: 'CLOSE', meaning: 'Closing consultation door, curtain or eyes during exam', category_id: 'greetings', difficulty: 'beginner', region_note: 'Palms coming together', video_url: '/videos/signs/Close.mp4', steps: ['Both palms open facing each other shoulder-width apart.', 'Bring index finger edges together briskly to close the space.', 'Hold closed position firmly.'] },
  { gloss: 'SWITCH', meaning: 'Operating room light switch or medical device toggle', category_id: 'greetings', difficulty: 'beginner', region_note: 'Thumb flicking upward/downward', video_url: '/videos/signs/Switch.mp4', steps: ['Form loose fist with thumb resting on side of index finger.', 'Flick thumb upward and downward as if toggling electrical switch.', 'Point toward device if relevant.'] },
  { gloss: 'BUSY', meaning: 'Doctor in OT, staff attending emergency triage', category_id: 'greetings', difficulty: 'intermediate', region_note: 'B-handshape sweeping back and forth', video_url: '/videos/signs/Busy.mp4', steps: ['Non-dominant arm extended across chest.', 'Dominant flat hand wipes back and forth across wrist rapidly.', 'Indicates high activity / engagement.'] },
  { gloss: 'WRONG', meaning: 'Incorrect symptom report or medication verification', category_id: 'greetings', difficulty: 'intermediate', region_note: 'Y-handshape knuckles touching chin', video_url: '/videos/signs/Wrong.mp4', steps: ['Form Y-handshape with thumb and pinky extended.', 'Touch middle knuckles of three folded fingers to chin.', 'Slight head shake to confirm mismatch.'] },
  { gloss: 'MAYBE', meaning: 'Uncertain diagnosis pending lab investigations', category_id: 'greetings', difficulty: 'intermediate', region_note: 'Alternating flat palms balance scale', video_url: '/videos/signs/Maybe.mp4', steps: ['Both palms open facing upward at chest height.', 'Raise and lower alternate hands in gentle teeter-totter motion.', 'Tilt head slightly to indicate pending confirmation.'] },
  { gloss: 'STILL', meaning: 'Asking patient to hold position during X-ray/MRI scan', category_id: 'greetings', difficulty: 'intermediate', region_note: 'Downward pressing Y-handshapes', video_url: '/videos/signs/Still.mp4', steps: ['Both hands in Y-handshape palms facing downward.', 'Move hands smoothly forward and down together.', 'Instructs patient to remain completely motionless.'] },
  { gloss: 'YES', meaning: 'Patient confirmation or symptom affirmation', category_id: 'greetings', difficulty: 'beginner', region_note: 'Nodding fist motion', video_url: null, steps: ['Make a loose fist with dominant hand.', 'Bend wrist up and down twice like a nodding head.', 'Maintain encouraging facial smile.'] },
  { gloss: 'NO', meaning: 'Patient denial or symptom negation', category_id: 'greetings', difficulty: 'beginner', region_note: 'Two fingers snapping shut on thumb', video_url: null, steps: ['Extend index and middle finger with thumb open.', 'Close the two fingers firmly onto the thumb in one motion.', 'Shake head subtly to indicate negation.'] },

  // Dietary & Nutrition Care
  { gloss: 'TEA', meaning: 'Hot beverage, oral dietary allowance', category_id: 'nutrition', difficulty: 'beginner', region_note: 'Teabag dipping circular motion', video_url: '/videos/signs/Tea.mp4', steps: ['Non-dominant hand forms O-shape like teacup rim.', 'Dominant thumb and index hold imaginary teabag string and circle gently above cup.', 'Tip hand slightly toward lips.'] },
  { gloss: 'COOK', meaning: 'Hospital diet kitchen preparation', category_id: 'nutrition', difficulty: 'beginner', region_note: 'Spatula flipping motion', video_url: '/videos/signs/Cook.mp4', steps: ['Non-dominant palm flat facing up as frying surface.', 'Dominant flat hand flips palm-down then palm-up repeatedly on base hand.', 'Indicates cooked meal preparation.'] },
  { gloss: 'POUR', meaning: 'Administering liquid medication or drinking water', category_id: 'nutrition', difficulty: 'beginner', region_note: 'Tilting container motion', video_url: '/videos/signs/Pour.mp4', steps: ['Dominant hand in loose fist tilted at wrist.', 'Rotate wrist downward as if pouring liquid from jug into cup.', 'Smooth steady stream gesture.'] },
  { gloss: 'VEGETABLES', meaning: 'High-fiber diabetic / cardiac dietary meal', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'V-handshape twisting at cheek', video_url: '/videos/signs/Vegetables.mp4', steps: ['Dominant hand in V-shape with index and middle finger extended.', 'Touch tips of V-fingers to cheek and twist wrist back and forth.', 'Follow with chewing expression.'] },
  { gloss: 'CARROT', meaning: 'Beta-carotene rich recovery diet', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Holding carrot and crunching at mouth', video_url: '/videos/signs/Carrot.mp4', steps: ['Dominant hand forms S-fist at mouth corner.', 'Mimic biting tip of carrot with small crunching teeth motion.', 'Pull hand slightly away.'] },
  { gloss: 'CABBAGE', meaning: 'Cruciferous vegetable nutrition', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Cupped hands showing layered round ball', video_url: '/videos/signs/Cabbage.mp4', steps: ['Both wrists touch at base of palms in round spherical shape.', 'Fingers curve inward like layers of cabbage leaves.', 'Rotate hands slightly to indicate vegetable head.'] },
  { gloss: 'CAULIFLOWER', meaning: 'Vegetable florets dietary item', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'White color sign + blossoming ball shape', video_url: '/videos/signs/Cauliflower.mp4', steps: ['Fingers bunch together and open outward like florets.', 'Both hands form clustered round crown at chest level.', 'Signifies fresh florets.'] },
  { gloss: 'ONION', meaning: 'Dietary seasoning / allergen check', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Twisting knuckle at eye corner', video_url: '/videos/signs/Onion.mp4', steps: ['Form X-handshape with bent index finger knuckle.', 'Twist knuckle gently near outer corner of eye as if cutting pungent onion.', 'Squint eyes slightly.'] },
  { gloss: 'RADISH', meaning: 'Root vegetable dietary nutrition', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Tapered root shape from wrist', video_url: '/videos/signs/Radish.mp4', steps: ['Non-dominant arm extended forward.', 'Dominant hand traces long tapering root shape down forearm to pointed tip.', 'Indicates white radish.'] },
  { gloss: 'LEMON', meaning: 'Vitamin C citrus supplement / hydration', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Squeezing L-handshape at mouth corner', video_url: '/videos/signs/Lemon.mp4', steps: ['Thumb of L-handshape touches corner of mouth.', 'Twist wrist forward and backward while making sour puckered face.', 'Denotes citrus lemon.'] },
  { gloss: 'BRINJAL', meaning: 'Eggplant / aubergine dietary vegetable', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Purple sign + elongated stem shape', video_url: '/videos/signs/Brinjal.mp4', steps: ['Dominant hand curls around non-dominant index finger resembling stem cap.', 'Hands form elongated smooth bulb shape downward.', 'Traditional Indian vegetable sign.'] },
  { gloss: 'CHILLI', meaning: 'Spicy food restriction / gastrointestinal check', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Small curved pepper shape + burning tongue reaction', video_url: '/videos/signs/Chilli.mp4', steps: ['Index and thumb pinch into small curved pointed pepper shape.', 'Bring near lips and fan mouth rapidly with other hand to indicate spicy heat.', 'Crucial for ulcer/GERD dietary counseling.'] },
  { gloss: 'CUCUMBER', meaning: 'Cooling hydrating vegetable for fever/recovery', category_id: 'nutrition', difficulty: 'intermediate', region_note: 'Cylindrical vegetable slicing gesture', video_url: '/videos/signs/Cucumber.mp4', steps: ['Non-dominant hand holds long cylindrical shape horizontally.', 'Dominant flat hand makes crisp slicing motions along cylinder.', 'Denotes crisp refreshing cucumber.'] },

  // Pediatric & Reassurance
  { gloss: 'HUG', meaning: 'Comforting pediatric patient or emotional reassurance', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Crossing arms over chest in self-hug', video_url: '/videos/signs/Hug.mp4', steps: ['Cross both arms over chest with fists resting on opposite shoulders.', 'Squeeze gently toward torso with warm caring facial expression.', 'Invaluable for comforting frightened child patients.'] },
  { gloss: 'CRY', meaning: 'Identifying distress, pediatric tears or sadness', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Index fingers tracing tears down cheeks', video_url: '/videos/signs/Cry.mp4', steps: ['Both index fingers point upward under eyes.', 'Draw fingers downward along cheeks in wavy falling paths like teardrops.', 'Sympathetic gentle expression.'] },
  { gloss: 'JUMP', meaning: 'Physiotherapy mobility / child pediatric engagement', category_id: 'pediatric', difficulty: 'beginner', region_note: 'V-fingers jumping on flat palm', video_url: '/videos/signs/Jump.mp4', steps: ['Non-dominant palm flat facing upward as ground.', 'Dominant inverted V-fingers (legs) bend knees and spring upward repeatedly.', 'Useful in pediatric physiotherapy and motor assessments.'] },
  { gloss: 'UMBRELLA', meaning: 'Rain protection / patient mobility aid', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Opening umbrella handle gesture', video_url: '/videos/signs/Umbrella.mp4', steps: ['Both fists stacked vertically as if gripping umbrella handle.', 'Slide dominant hand upward while opening fingers outward into domed canopy.', 'Protective sheltering gesture.'] },
  { gloss: 'BEAR', meaning: 'Pediatric story animal / reassurance toy', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Crossed arms scratching chest with claws', video_url: '/videos/signs/Bear.mp4', steps: ['Cross arms over chest with curved clawed fingers.', 'Scratch gently downward twice on opposite shoulders.', 'Friendly play gesture for young patients.'] },
  { gloss: 'DEER', meaning: 'Pediatric animal symbol / hearing test visual cue', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Open 5-handshapes as antlers at temples', video_url: '/videos/signs/Deer.mp4', steps: ['Thumbs of both open 5-hands touch temples.', 'Fingers spread wide like branching antlers.', 'Move hands upward and outward smoothly.'] },
  { gloss: 'ELEPHANT', meaning: 'Pediatric engagement / cultural symbol', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Curving trunk gesture from nose', video_url: '/videos/signs/Elephant.mp4', steps: ['Back of dominant hand touches nose.', 'Curve arm downward and forward in long undulating trunk swing.', 'Lift hand slightly at the end.'] },
  { gloss: 'GIRAFFE', meaning: 'Tall animal symbol in pediatric playroom', category_id: 'pediatric', difficulty: 'beginner', region_note: 'C-handshape sliding up tall neck', video_url: '/videos/signs/Giraffe.mp4', steps: ['Dominant C-handshape starts at neck base.', 'Glide hand upward high above head to indicate long slender neck.', 'Gentle playful gaze upward.'] },
  { gloss: 'LION', meaning: 'Courage symbol for brave pediatric patients', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Clawed hands pulling back mane', video_url: '/videos/signs/Lion.mp4', steps: ['Curved claw hands start near ears.', 'Comb fingers backward through imaginary lion mane with strong confident posture.', 'Used to praise brave children undergoing injections.'] },
  { gloss: 'MONKEY', meaning: 'Pediatric play animal / distraction technique', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Scratching armpits playfully', video_url: '/videos/signs/Monkey.mp4', steps: ['Both curved claw hands scratch upward along ribcage and armpits.', 'Lighthearted playful expression to ease pediatric anxiety.', 'Effective distraction during IV placement.'] },
  { gloss: 'PEACOCK', meaning: 'National bird / pediatric picture card', category_id: 'pediatric', difficulty: 'intermediate', region_note: 'Fanning tail feathers gesture', video_url: '/videos/signs/Peacock.mp4', steps: ['Wrist of open fan hand touches tailbone or lower back.', 'Spread all fingers wide and shimmer fingers like iridescent feathers.', 'Graceful royal movement.'] },
  { gloss: 'PIGEON', meaning: 'Bird sign in clinical hospital courtyard', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Beak pecking motion + fluttering wings', video_url: '/videos/signs/Pigeon.mp4', steps: ['Thumb and index tap together at chin like pecking beak.', 'Cross thumbs and flutter open fingers like soft wings.', 'Calming natural imagery.'] },
  { gloss: 'SPARROW', meaning: 'Small bird symbol in pediatric vision test', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Tiny beak chirping near cheek', video_url: '/videos/signs/Sparrow.mp4', steps: ['Index and thumb pinch into tiny beak at corner of mouth.', 'Tap fingertips rapidly twice while tilting head curiously.', 'Great for pediatric eye chart alignment.'] },
  { gloss: 'TIGER', meaning: 'Strength badge / brave pediatric patient reward', category_id: 'pediatric', difficulty: 'intermediate', region_note: 'Stripes drawn across cheeks with claw hands', video_url: '/videos/signs/Tiger.mp4', steps: ['Curved finger claw hands start at nose.', 'Pull hands outward across cheeks tracing bold tiger stripes.', 'Bold determined expression.'] },
  { gloss: 'TURTLE', meaning: 'Slow steady movement / physiotherapy pacing', category_id: 'pediatric', difficulty: 'intermediate', region_note: 'Thumb peeking out under cupped shell hand', video_url: '/videos/signs/Turtle.mp4', steps: ['Dominant cupped hand covers non-dominant fist like protective shell.', 'Thumb of lower fist pokes out and wiggles like turtle head.', 'Teaches patients to breathe slowly and steadily.'] },
  { gloss: 'CROCODILE', meaning: 'Pediatric tooth brushing / mouth opening prompt', category_id: 'pediatric', difficulty: 'beginner', region_note: 'Long clamping jaws with extended arms', video_url: '/videos/signs/Crocodile.mp4', steps: ['Both arms extended forward horizontally, palms facing each other.', 'Open arms wide vertically and snap hands together like giant jaws.', 'Prompts young dental patients to open mouth wide for inspection.'] },

  // Hospital Administration & Intake
  { gloss: 'BUDGET', meaning: 'Hospital billing, medical insurance & estimation', category_id: 'administration', difficulty: 'intermediate', region_note: 'Counting currency into palm', video_url: '/videos/signs/Budget.mp4', steps: ['Non-dominant palm open facing upward.', 'Dominant thumb and index rub together like banknotes over palm.', 'Signals financial counseling and treatment package estimates.'] },
  { gloss: 'INTERVIEW', meaning: 'Clinical anamnesis, nurse intake assessment', category_id: 'administration', difficulty: 'intermediate', region_note: 'I-handshapes speaking back and forth', video_url: '/videos/signs/Interview.mp4', steps: ['Both hands in I-handshape (pinky extended).', 'Move hands back and forth toward each other in front of mouth.', 'Signifies structured medical intake dialogue.'] },
  { gloss: 'EXAM', meaning: 'Diagnostic examination or clinical test', category_id: 'administration', difficulty: 'intermediate', region_note: 'Curled index fingers scanning paper/body', video_url: '/videos/signs/Exam.mp4', steps: ['Both index fingers bent into hooks.', 'Move hands downward in parallel scanning motion as if inspecting clinical chart.', 'Signals comprehensive health checkup.'] },
  { gloss: 'MATHS', meaning: 'Dosage calculation, BMI and medication metrics', category_id: 'administration', difficulty: 'intermediate', region_note: 'Crossing M-handshapes', video_url: '/videos/signs/Maths.mp4', steps: ['Both hands in M-handshape (three fingers over thumb).', 'Brush wrists across each other in intersecting cross motions.', 'Used in pharmacy dosage verification.'] },
  { gloss: 'WRITER', meaning: 'Medical scribe, transcriptionist or report drafting', category_id: 'administration', difficulty: 'beginner', region_note: 'Pen writing on palm + person marker', video_url: '/videos/signs/Writer.mp4', steps: ['Dominant hand in pinched pen grip scribbles across non-dominant palm.', 'Follow with flat hands moving downward along sides for PERSON marker.', 'Identifies documentation desk staff.'] },
  { gloss: 'WIFE', meaning: 'Spouse, next-of-kin emergency contact', category_id: 'administration', difficulty: 'beginner', region_note: 'Female chin stroke + clasping hands', video_url: '/videos/signs/Wife.mp4', steps: ['Thumb brushes along jawline indicating female.', 'Clasp both hands together at chest level in marriage bond.', 'Crucial for ICU consent and next-of-kin records.'] },
  { gloss: 'UNCLE', meaning: 'Extended family attendant / guardian', category_id: 'administration', difficulty: 'beginner', region_note: 'U-handshape shaking near temple', video_url: '/videos/signs/Uncle.mp4', steps: ['Form U-handshape with index and middle finger held together.', 'Twist hand twice near temple on male side of face.', 'Used in hospital visitor passes.'] },
  { gloss: 'KEY', meaning: 'Medicine cabinet key, locker or ward access', category_id: 'administration', difficulty: 'beginner', region_note: 'Key turning in palm lock', video_url: '/videos/signs/Key.mp4', steps: ['Bent index finger knuckle presses into open palm of other hand.', 'Twist knuckle clockwise as if turning key in physical lock.', 'Ward security and narcotics locker sign.'] },
  { gloss: 'KNIFE', meaning: 'Surgical scalpel, sharp instruments safety', category_id: 'administration', difficulty: 'beginner', region_note: 'Index finger whittling opposite index finger', video_url: '/videos/signs/Knife.mp4', steps: ['Non-dominant index finger extended horizontally.', 'Dominant index finger slices downward along non-dominant finger twice.', 'Signifies sharps disposal protocol / OT surgical cut.'] },
  { gloss: 'BREAK', meaning: 'Staff duty break / fracture alert', category_id: 'administration', difficulty: 'beginner', region_note: 'Breaking imaginary stick in half', video_url: '/videos/signs/Break.mp4', steps: ['Both fists side-by-side with knuckles touching.', 'Snap wrists outward and twist hands apart as if snapping wooden stick.', 'Used for bone fracture diagnosis and shift relief.'] },
  { gloss: 'FEDUP', meaning: 'Patient emotional fatigue, burnout counseling', category_id: 'administration', difficulty: 'intermediate', region_note: 'Hand chopped up to chin level', video_url: '/videos/signs/Fedup.mp4', steps: ['Flat hand palm-down strikes underneath chin sharply.', 'Exhale with weary facial expression.', 'Signals psychiatric/counseling support needed.'] },
  { gloss: 'KARNATAKA', meaning: 'State healthcare referral / regional language hub', category_id: 'administration', difficulty: 'intermediate', region_note: 'K-handshape arc gesture', video_url: '/videos/signs/Karnataka.mp4', steps: ['Form K-handshape with index, middle and thumb.', 'Move hand smoothly in gentle horizontal arc across chest.', 'Identifies regional healthcare jurisdiction.'] },
  { gloss: 'TEMPLE', meaning: 'Hospital prayer room / meditation sanctuary', category_id: 'administration', difficulty: 'beginner', region_note: 'T-handshape tapping temple building base', video_url: '/videos/signs/Temple.mp4', steps: ['Non-dominant flat palm facing down.', 'Dominant T-handshape rests wrist on non-dominant hand and lifts slightly.', 'Directions to hospital spiritual care / chapel.'] },
  { gloss: 'VOLCANO', meaning: 'Sudden acute symptom eruption / emotional outburst', category_id: 'administration', difficulty: 'advanced', region_note: 'Lava exploding upward from mountain cone', video_url: '/videos/signs/Volcano.mp4', steps: ['Both hands form tapered mountain cone at base.', 'Fingers erupt upward and splay outward like volcanic explosion.', 'Used metaphorically in emergency crisis management.'] },
  { gloss: 'MAN', meaning: 'Male patient, attendant or male ward', category_id: 'administration', difficulty: 'beginner', region_note: 'Moustache stroking gesture at upper lip', video_url: '/videos/signs/Man.mp4', steps: ['Index and thumb stroke outward across upper lip as if shaping moustache.', 'Nod head calmly.', 'Used in hospital bed assignment and census.'] }
];

const mappedSigns = fullSigns.map(s => ({
  id: s.gloss.toLowerCase().replace(/\\s+/g, '-'),
  gloss: s.gloss,
  meaning: s.meaning,
  category_id: s.category_id,
  difficulty: s.difficulty,
  region_note: s.region_note,
  video_url: s.video_url,
  steps: s.steps,
}));

const lessons = [
  {
    id: 'lesson-clinical-triage',
    slug: 'clinical-triage',
    code: 'CLN-101',
    title: 'Emergency Triage & Vital Symptoms',
    summary: 'Master critical clinical signs for fever, trauma injury, acute pain, physician call and emergency response.',
    category_id: 'clinical',
    duration_minutes: 15,
    difficulty: 'beginner',
    sign_ids: ['fever', 'injury', 'pain', 'doctor', 'nurse', 'medicine', 'blood', 'emergency', 'help', 'hospital'],
    thumbnail_tone: 'primary',
    captions: [
      { at: 0, text: 'Clinical triage requires rapid assessment of body temperature, acute pain and injury sites.' },
      { at: 5, text: 'Signal DOCTOR or NURSE immediately when trauma or emergency care is detected.' },
      { at: 10, text: 'Observe patient facial expressions closely to confirm anatomical location of pain.' },
    ],
    quiz: [
      {
        id: 'q-cln-1',
        prompt: 'Which gesture accurately indicates high body temperature / pyrexia in ISL?',
        kind: 'multiple_choice',
        options: [
          'Back of flat hand touching the forehead with concerned expression',
          'Tapping the radial pulse point on opposite wrist',
          'Holding cups near the mouth',
          'Forming two fists snapping together'
        ],
        answer: 'Back of flat hand touching the forehead with concerned expression',
        hint: 'Think of how you manually feel for a fever on someone.'
      },
      {
        id: 'q-cln-2',
        prompt: 'How is DOCTOR represented in Indian Sign Language clinical context?',
        kind: 'multiple_choice',
        options: [
          'Brushing knuckles against the chin',
          'Two-finger pulse check tap on the inside of the opposite wrist',
          'Waving open palm over the shoulder',
          'Crossed arms over the chest'
        ],
        answer: 'Two-finger pulse check tap on the inside of the opposite wrist',
        hint: 'Think of checking a radial pulse on the wrist.'
      }
    ]
  },
  {
    id: 'lesson-greetings-intake',
    slug: 'greetings-intake',
    code: 'GRT-102',
    title: 'Patient Intake & Bedside Communication',
    summary: 'Welcome patients warmly, confirm names, provide clear procedural instructions (come, drink, clean, close, switch, still).',
    category_id: 'greetings',
    duration_minutes: 12,
    difficulty: 'beginner',
    sign_ids: ['hello', 'good-morning', 'good-afternoon', 'thank-you', 'what-is-your-name', 'come', 'give', 'drink', 'clean', 'close', 'switch', 'busy', 'wrong', 'maybe', 'still', 'yes', 'no'],
    thumbnail_tone: 'teal',
    captions: [
      { at: 0, text: 'Clear and respectful greetings build immediate trust with Deaf patients entering clinical areas.' },
      { at: 4, text: 'Always verify identity using WHAT IS YOUR NAME before administering treatments.' },
      { at: 8, text: 'Use STILL when instructing patients to remain motionless during radiologic imaging.' },
    ],
    quiz: [
      {
        id: 'q-grt-1',
        prompt: 'What is the standard ISL sign for patient registration and identity check?',
        kind: 'multiple_choice',
        options: [
          'H-fingertips tapping together horizontally followed by open palm questioning',
          'Sweeping palm across wrist',
          'Touching back of hand to forehead',
          'Flipping flat hands on open palm'
        ],
        answer: 'H-fingertips tapping together horizontally followed by open palm questioning',
        hint: 'Look for the two-finger name tag tap.'
      }
    ]
  },
  {
    id: 'lesson-diet-nutrition',
    slug: 'diet-nutrition',
    code: 'NUT-103',
    title: 'Dietary Counseling & Hospital Nutrition',
    summary: 'Instruct patients on therapeutic diets, diabetic food choices, vegetable nutrition, hydration and hot beverages.',
    category_id: 'nutrition',
    duration_minutes: 14,
    difficulty: 'intermediate',
    sign_ids: ['tea', 'cook', 'pour', 'vegetables', 'carrot', 'cabbage', 'cauliflower', 'onion', 'radish', 'lemon', 'brinjal', 'chilli', 'cucumber'],
    thumbnail_tone: 'gold',
    captions: [
      { at: 0, text: 'Dietary guidance is critical for managing postoperative recovery, diabetes, and hypertension.' },
      { at: 5, text: 'Identify allergen warnings or spicy food restrictions using CHILLI with clear caution gestures.' },
    ],
    quiz: [
      {
        id: 'q-nut-1',
        prompt: 'When counseling a patient with gastric ulcers, which sign indicates spicy food avoidance?',
        kind: 'multiple_choice',
        options: [
          'Pinching small curved pepper shape near lips followed by fanning mouth',
          'Teabag dipping circle above cup',
          'Sliding C-handshape up neck',
          'Scratching chest with clawed hands'
        ],
        answer: 'Pinching small curved pepper shape near lips followed by fanning mouth',
        hint: 'It mimics the shape of a chilli and heat.'
      }
    ]
  },
  {
    id: 'lesson-pediatric-care',
    slug: 'pediatric-care',
    code: 'PED-104',
    title: 'Pediatric Comfort & Play Therapy',
    summary: 'Calm frightened children, ease procedure anxiety, and build rapport using interactive reassurance and animal signs.',
    category_id: 'pediatric',
    duration_minutes: 16,
    difficulty: 'beginner',
    sign_ids: ['hug', 'cry', 'jump', 'umbrella', 'bear', 'deer', 'elephant', 'giraffe', 'lion', 'monkey', 'peacock', 'pigeon', 'sparrow', 'tiger', 'turtle', 'crocodile'],
    thumbnail_tone: 'gold',
    captions: [
      { at: 0, text: 'Pediatric encounters require engaging visual signs to distract young patients during examinations.' },
      { at: 6, text: 'Use HUG and play animal signs to establish reassurance before starting IV cannulation.' },
    ],
    quiz: [
      {
        id: 'q-ped-1',
        prompt: 'Which sign is best suited to comfort a crying child in the pediatric ward?',
        kind: 'multiple_choice',
        options: [
          'HUG: crossing arms over the chest with a warm, caring facial expression',
          'Tracing cross on the upper arm',
          'Counting currency notes in palm',
          'Striking under chin sharply'
        ],
        answer: 'HUG: crossing arms over the chest with a warm, caring facial expression',
        hint: 'A comforting self-hug gesture.'
      }
    ]
  },
  {
    id: 'lesson-admin-intake',
    slug: 'admin-intake',
    code: 'ADM-105',
    title: 'Hospital Administration & Consent',
    summary: 'Coordinate admission billing, next-of-kin documentation, ward locker keys, and clinical interviews.',
    category_id: 'administration',
    duration_minutes: 15,
    difficulty: 'intermediate',
    sign_ids: ['budget', 'interview', 'exam', 'maths', 'writer', 'wife', 'uncle', 'key', 'knife', 'break', 'fedup', 'karnataka', 'temple', 'volcano', 'man'],
    thumbnail_tone: 'success',
    captions: [
      { at: 0, text: 'Hospital administrative transparency ensures patients and families understand treatment plans.' },
      { at: 5, text: 'Document emergency contacts and next-of-kin using WIFE, UNCLE or family guardian signs.' },
    ],
    quiz: [
      {
        id: 'q-adm-1',
        prompt: 'Which sign is used at the billing and insurance desk for treatment package estimates?',
        kind: 'multiple_choice',
        options: [
          'BUDGET: rubbing thumb and index like banknotes over open palm',
          'Jumping inverted V-fingers on palm',
          'Fingertips fanning tail feathers',
          'Two fingers tapping wrist'
        ],
        answer: 'BUDGET: rubbing thumb and index like banknotes over open palm',
        hint: 'It mimics counting rupee notes.'
      }
    ]
  }
];

const mockDataContent = `/**
 * Mock records shaped exactly like the future backend tables.
 * Components never import this file directly — they go through src/services/*.
 */
import type {
  Achievement,
  ActivityItem,
  Assessment,
  Certificate,
  Hospital,
  HospitalAnalytics,
  Lesson,
  LessonProgress,
  Sign,
  SignCategory,
  StaffMember,
  UserProgressSummary,
} from \"@/types\";

export const categories: SignCategory[] = ${JSON.stringify(categories, null, 2)};

export const signs: Sign[] = ${JSON.stringify(mappedSigns, null, 2)};

export const lessons: Lesson[] = ${JSON.stringify(lessons, null, 2)};

export const achievements: Achievement[] = [
  {
    id: \"first-lesson\",
    name: \"First Step\",
    description: \"Completed your very first healthcare ISL lesson.\",
    icon: \"GraduationCap\",
    earned: true,
    earned_at: \"2026-03-01T10:00:00Z\",
  },
  {
    id: \"streak-3\",
    name: \"3-Day Streak\",
    description: \"Practiced 3 days in a row without breaking your learning streak.\",
    icon: \"Flame\",
    earned: true,
    earned_at: \"2026-03-03T11:30:00Z\",
  },
  {
    id: \"clinical-mastery\",
    name: \"Clinical ISL Specialist\",
    description: \"Mastered emergency triage and clinical symptom signs with 90%+ accuracy.\",
    icon: \"Stethoscope\",
    earned: false,
    earned_at: null,
  },
  {
    id: \"gold-certified\",
    name: \"Certified Healthcare Communicator\",
    description: \"Achieved verified Gold Certification on the ISL Setu national standard.\",
    icon: \"Sparkles\",
    earned: false,
    earned_at: null,
  },
];

export const progressSummary: UserProgressSummary = {
  overall_percent: 68,
  level: \"bronze\",
  streak_days: 5,
  accuracy_percent: 88,
  daily_goal_minutes: 15,
  daily_goal_done_minutes: 12,
  signs_learned: 24,
  weekly: [
    { day: \"Mon\", minutes: 15, accuracy: 85 },
    { day: \"Tue\", minutes: 20, accuracy: 92 },
    { day: \"Wed\", minutes: 12, accuracy: 80 },
    { day: \"Thu\", minutes: 18, accuracy: 90 },
    { day: \"Fri\", minutes: 15, accuracy: 88 },
    { day: \"Sat\", minutes: 10, accuracy: 84 },
    { day: \"Sun\", minutes: 22, accuracy: 94 },
  ],
};

export const lessonProgress: LessonProgress[] = [
  {
    lesson_id: \"lesson-clinical-triage\",
    user_id: \"demo-user\",
    percent: 100,
    completed: true,
    last_opened_at: \"2026-08-14T10:00:00Z\",
  },
  {
    lesson_id: \"lesson-greetings-intake\",
    user_id: \"demo-user\",
    percent: 75,
    completed: false,
    last_opened_at: \"2026-08-14T11:30:00Z\",
  },
];

export const activity: ActivityItem[] = [
  {
    id: \"act-1\",
    kind: \"lesson\",
    title: \"Completed Emergency Triage\",
    detail: \"Scored 100% on the quiz and practiced 10 triage signs.\",
    at: \"2 hours ago\",
  },
  {
    id: \"act-2\",
    kind: \"practice\",
    title: \"AI Camera Practice Session\",
    detail: \"Recognized FEVER and INJURY with 95% landmark confidence.\",
    at: \"Yesterday\",
  },
];

export const bronzeAssessment: Assessment = {
  id: \"assess-bronze\",
  tier: \"bronze\",
  title: \"Healthcare ISL Foundations Assessment\",
  duration_minutes: 10,
  pass_percent: 75,
  questions: [
    {
      id: \"q-assess-1\",
      prompt: \"Which gesture indicates high body temperature / pyrexia in ISL?\",
      kind: \"multiple_choice\",
      options: [
        \"Back of flat hand touching forehead with concern\",
        \"Tapping wrist radial pulse\",
        \"Fanning chest with two hands\",
        \"Curling fingers like claws\"
      ],
      answer: \"Back of flat hand touching forehead with concern\",
      hint: \"Forehead temperature check.\"
    },
    {
      id: \"q-assess-2\",
      prompt: \"How is DOCTOR represented in Indian Sign Language?\",
      kind: \"multiple_choice\",
      options: [
        \"Two-finger radial pulse check on opposite wrist\",
        \"Holding imaginary stethoscope\",
        \"Sweeping hand across chin\",
        \"Crossed arms over chest\"
      ],
      answer: \"Two-finger radial pulse check on opposite wrist\",
      hint: \"Checking wrist pulse.\"
    }
  ],
};

export const certificates: Certificate[] = [
  {
    id: \"cert-bronze-sample\",
    tier: \"bronze\",
    title: \"Bronze ISL Healthcare Certificate\",
    subtitle: \"Foundational Clinical Sign Language Competency\",
    requirements: [\"Complete 2 healthcare modules\", \"Pass Bronze Assessment >= 75%\", \"Recognize 10 signs via camera\"],
    signs_required: 10,
    signs_completed: 10,
    status: \"completed\",
    issued_at: \"2026-08-14T12:00:00Z\",
    credential_id: \"ISL-SETU-BRZ-2026-8891\",
  },
  {
    id: \"cert-silver-sample\",
    tier: \"silver\",
    title: \"Silver ISL Healthcare Certificate\",
    subtitle: \"Intermediate Clinical & Patient Intake Fluency\",
    requirements: [\"Complete 4 healthcare modules\", \"Pass Silver Assessment >= 80%\", \"Recognize 25 signs via camera\"],
    signs_required: 25,
    signs_completed: 18,
    status: \"in_progress\",
    issued_at: null,
    credential_id: null,
  },
  {
    id: \"cert-gold-sample\",
    tier: \"gold\",
    title: \"Gold ISL Healthcare Master Certificate\",
    subtitle: \"Advanced Clinical Triage & Specialized Hospital Care\",
    requirements: [\"Complete all modules\", \"Pass Gold Assessment >= 85%\", \"Recognize 50+ signs via camera\"],
    signs_required: 50,
    signs_completed: 24,
    status: \"locked\",
    issued_at: null,
    credential_id: null,
  },
];

export const staff: StaffMember[] = [
  {
    id: \"staff-1\",
    full_name: \"Staff Nurse Ananya Sharma\",
    role: \"nurse\",
    department: \"Emergency & Trauma\",
    certification: \"silver\",
    progress_percent: 85,
    status: \"active\",
  },
  {
    id: \"staff-2\",
    full_name: \"Dr. Rajesh Varma\",
    role: \"doctor\",
    department: \"Outpatient & Internal Medicine\",
    certification: \"gold\",
    progress_percent: 100,
    status: \"active\",
  },
  {
    id: \"staff-3\",
    full_name: \"Priya Sundaram\",
    role: \"receptionist\",
    department: \"Patient Registration & Intake\",
    certification: \"bronze\",
    progress_percent: 60,
    status: \"training\",
  },
];

export const hospital: Hospital = {
  id: \"hosp-apollo-delhi\",
  name: \"Apollo Indraprastha Medical Center\",
  city: \"New Delhi\",
  state: \"Delhi NCR\",
  readiness: \"isl_ready\",
  departments_covered: 8,
  departments_total: 10,
  last_training_at: \"2026-08-14T09:00:00Z\",
};

export const hospitalAnalytics: HospitalAnalytics = {
  certification_progress: [
    { month: \"Jan\", bronze: 10, silver: 4, gold: 2 },
    { month: \"Feb\", bronze: 18, silver: 8, gold: 4 },
    { month: \"Mar\", bronze: 25, silver: 15, gold: 7 },
    { month: \"Apr\", bronze: 32, silver: 22, gold: 12 },
    { month: \"May\", bronze: 42, silver: 28, gold: 18 },
  ],
  department_coverage: [
    { department: \"Emergency & Trauma\", covered: 94 },
    { department: \"Pediatrics & NICU\", covered: 88 },
    { department: \"Outpatient & Intake\", covered: 82 },
    { department: \"Pharmacy & Lab\", covered: 76 },
  ],
  monthly_training: [
    { month: \"Jan\", hours: 35 },
    { month: \"Feb\", hours: 48 },
    { month: \"Mar\", hours: 62 },
    { month: \"Apr\", hours: 78 },
    { month: \"May\", hours: 94 },
  ],
};
`;

fs.writeFileSync('src/services/mock/data.ts', mockDataContent, 'utf8');
console.log('Successfully generated src/services/mock/data.ts with all 71 signs, lessons, quizzes, and exports!');
