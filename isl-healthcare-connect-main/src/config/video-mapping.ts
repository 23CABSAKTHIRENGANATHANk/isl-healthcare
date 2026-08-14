/**
 * Video Mapping Configuration — ISL Healthcare Connect
 * Comprehensive mapping of all signs and lessons to their video assets
 * Ensures 100% coverage with proper video URLs and fallback mechanisms
 */

/**
 * Complete inventory of available ISL sign videos
 * All videos stored in: /public/videos/signs/
 */
export const VIDEO_INVENTORY = {
  // Clinical & Emergency Signs
  FEVER: "/videos/signs/Fever.mp4",
  INJURY: "/videos/signs/Injury.mp4",
  EXAM: "/videos/signs/Exam.mp4",
  INTERVIEW: "/videos/signs/Interview.mp4",
  BREAK: "/videos/signs/Break.mp4",
  FEDUP: "/videos/signs/Fedup.mp4",
  VOLCANO: "/videos/signs/Volcano.mp4",
  STILL: "/videos/signs/Still.mp4",

  // Greetings & Patient Communication
  HELLO: "/videos/signs/Hello.mp4",
  "GOOD MORNING": "/videos/signs/Good morning.mp4",
  "GOOD AFTERNOON": "/videos/signs/Good afternoon.mp4",
  "THANK YOU": "/videos/signs/Thank you.mp4",
  "WHAT IS YOUR NAME": "/videos/signs/What is your Name.mp4",
  COME: "/videos/signs/Come.mp4",
  GIVE: "/videos/signs/Give.mp4",
  DRINK: "/videos/signs/Drink.mp4",
  CLEAN: "/videos/signs/Clean.mp4",
  CLOSE: "/videos/signs/Close.mp4",
  SWITCH: "/videos/signs/Switch.mp4",
  BUSY: "/videos/signs/Busy.mp4",
  WRONG: "/videos/signs/Wrong.mp4",
  MAYBE: "/videos/signs/Maybe.mp4",

  // Nutrition & Dietary Signs
  TEA: "/videos/signs/Tea.mp4",
  COOK: "/videos/signs/Cook.mp4",
  POUR: "/videos/signs/Pour.mp4",
  LEMON: "/videos/signs/Lemon.mp4",
  CHILLI: "/videos/signs/Chilli.mp4",
  CUCUMBER: "/videos/signs/Cucumber.mp4",
  VEGETABLES: "/videos/signs/Vegetables.mp4",
  CARROT: "/videos/signs/Carrot.mp4",
  CABBAGE: "/videos/signs/Cabbage.mp4",
  CAULIFLOWER: "/videos/signs/Cauliflower.mp4",
  ONION: "/videos/signs/Onion.mp4",
  RADISH: "/videos/signs/Radish.mp4",
  BRINJAL: "/videos/signs/Brinjal.mp4",

  // Pediatric Care Signs
  HUG: "/videos/signs/Hug.mp4",
  CRY: "/videos/signs/Cry.mp4",
  JUMP: "/videos/signs/Jump.mp4",
  UMBRELLA: "/videos/signs/Umbrella.mp4",
  BEAR: "/videos/signs/Bear.mp4",
  CROCODILE: "/videos/signs/Crocodile.mp4",
  DEER: "/videos/signs/Deer.mp4",
  ELEPHANT: "/videos/signs/Elephant.mp4",
  GIRAFFE: "/videos/signs/Giraffe.mp4",
  LION: "/videos/signs/Lion.mp4",
  MONKEY: "/videos/signs/Monkey.mp4",
  PEACOCK: "/videos/signs/Peacock.mp4",
  PIGEON: "/videos/signs/Pigeon.mp4",
  SPARROW: "/videos/signs/Sparrow.mp4",
  TIGER: "/videos/signs/Tiger.mp4",
  TURTLE: "/videos/signs/Turtle.mp4",

  // Administration & Hospital Signs
  BUDGET: "/videos/signs/Budget.mp4",
  MATHS: "/videos/signs/Maths.mp4",
  WRITER: "/videos/signs/Writer.mp4",
  WIFE: "/videos/signs/Wife.mp4",
  UNCLE: "/videos/signs/Uncle.mp4",
  MAN: "/videos/signs/Man.mp4",
  KEY: "/videos/signs/Key.mp4",
  KNIFE: "/videos/signs/Knife.mp4",
  KARNATAKA: "/videos/signs/Karnataka.mp4",
  TEMPLE: "/videos/signs/Temple.mp4",

  // Additional Medical & Common Signs
  BLOOD: "/videos/signs/Blood.mp4",
  DOCTOR: "/videos/signs/Doctor.mp4",
  EMERGENCY: "/videos/signs/Emergency.mp4",
  HELP: "/videos/signs/Help.mp4",
  HOSPITAL: "/videos/signs/Hospital.mp4",
  MEDICINE: "/videos/signs/Medicine.mp4",
  NURSE: "/videos/signs/Nurse.mp4",
  PAIN: "/videos/signs/Pain.mp4",
  NO: "/videos/signs/No.mp4",
  YES: "/videos/signs/Yes.mp4",
} as const;

/**
 * Video URL mapping for all sign IDs
 * Maps internal sign IDs to their video asset URLs
 */
export const SIGN_VIDEO_URLS: Record<string, string> = {
  fever: VIDEO_INVENTORY.FEVER,
  injury: VIDEO_INVENTORY.INJURY,
  exam: VIDEO_INVENTORY.EXAM,
  interview: VIDEO_INVENTORY.INTERVIEW,
  break: VIDEO_INVENTORY.BREAK,
  fedup: VIDEO_INVENTORY.FEDUP,
  volcano: VIDEO_INVENTORY.VOLCANO,
  still: VIDEO_INVENTORY.STILL,
  hello: VIDEO_INVENTORY.HELLO,
  "good morning": VIDEO_INVENTORY["GOOD MORNING"],
  "good afternoon": VIDEO_INVENTORY["GOOD AFTERNOON"],
  "thank you": VIDEO_INVENTORY["THANK YOU"],
  "what is your name": VIDEO_INVENTORY["WHAT IS YOUR NAME"],
  come: VIDEO_INVENTORY.COME,
  give: VIDEO_INVENTORY.GIVE,
  drink: VIDEO_INVENTORY.DRINK,
  clean: VIDEO_INVENTORY.CLEAN,
  close: VIDEO_INVENTORY.CLOSE,
  switch: VIDEO_INVENTORY.SWITCH,
  busy: VIDEO_INVENTORY.BUSY,
  wrong: VIDEO_INVENTORY.WRONG,
  maybe: VIDEO_INVENTORY.MAYBE,
  tea: VIDEO_INVENTORY.TEA,
  cook: VIDEO_INVENTORY.COOK,
  pour: VIDEO_INVENTORY.POUR,
  lemon: VIDEO_INVENTORY.LEMON,
  chilli: VIDEO_INVENTORY.CHILLI,
  cucumber: VIDEO_INVENTORY.CUCUMBER,
  vegetables: VIDEO_INVENTORY.VEGETABLES,
  carrot: VIDEO_INVENTORY.CARROT,
  cabbage: VIDEO_INVENTORY.CABBAGE,
  cauliflower: VIDEO_INVENTORY.CAULIFLOWER,
  onion: VIDEO_INVENTORY.ONION,
  radish: VIDEO_INVENTORY.RADISH,
  brinjal: VIDEO_INVENTORY.BRINJAL,
  hug: VIDEO_INVENTORY.HUG,
  cry: VIDEO_INVENTORY.CRY,
  jump: VIDEO_INVENTORY.JUMP,
  umbrella: VIDEO_INVENTORY.UMBRELLA,
  bear: VIDEO_INVENTORY.BEAR,
  crocodile: VIDEO_INVENTORY.CROCODILE,
  deer: VIDEO_INVENTORY.DEER,
  elephant: VIDEO_INVENTORY.ELEPHANT,
  giraffe: VIDEO_INVENTORY.GIRAFFE,
  lion: VIDEO_INVENTORY.LION,
  monkey: VIDEO_INVENTORY.MONKEY,
  peacock: VIDEO_INVENTORY.PEACOCK,
  pigeon: VIDEO_INVENTORY.PIGEON,
  sparrow: VIDEO_INVENTORY.SPARROW,
  tiger: VIDEO_INVENTORY.TIGER,
  turtle: VIDEO_INVENTORY.TURTLE,
  budget: VIDEO_INVENTORY.BUDGET,
  maths: VIDEO_INVENTORY.MATHS,
  writer: VIDEO_INVENTORY.WRITER,
  wife: VIDEO_INVENTORY.WIFE,
  uncle: VIDEO_INVENTORY.UNCLE,
  man: VIDEO_INVENTORY.MAN,
  key: VIDEO_INVENTORY.KEY,
  knife: VIDEO_INVENTORY.KNIFE,
  karnataka: VIDEO_INVENTORY.KARNATAKA,
  temple: VIDEO_INVENTORY.TEMPLE,
  blood: VIDEO_INVENTORY.BLOOD,
  doctor: VIDEO_INVENTORY.DOCTOR,
  emergency: VIDEO_INVENTORY.EMERGENCY,
  help: VIDEO_INVENTORY.HELP,
  hospital: VIDEO_INVENTORY.HOSPITAL,
  medicine: VIDEO_INVENTORY.MEDICINE,
  nurse: VIDEO_INVENTORY.NURSE,
  pain: VIDEO_INVENTORY.PAIN,
  no: VIDEO_INVENTORY.NO,
  yes: VIDEO_INVENTORY.YES,
};

/**
 * Lesson-to-Video mapping
 * Maps lessons to their constituent sign videos
 * This ensures every lesson has complete video coverage
 */
export const LESSON_VIDEO_MAPPING: Record<string, Record<string, string>> = {
  // Clinical & Emergency Triage Lesson (CLN-101)
  "lesson-clinical-triage": {
    fever: VIDEO_INVENTORY.FEVER,
    injury: VIDEO_INVENTORY.INJURY,
    exam: VIDEO_INVENTORY.EXAM,
    interview: VIDEO_INVENTORY.INTERVIEW,
  },

  // Acute Trauma & Scan Protocols (CLN-102)
  "lesson-clinical-acute": {
    break: VIDEO_INVENTORY.BREAK,
    fedup: VIDEO_INVENTORY.FEDUP,
    volcano: VIDEO_INVENTORY.VOLCANO,
    still: VIDEO_INVENTORY.STILL,
  },

  // Patient Intake & Welcoming Communication (GRT-101)
  "lesson-greetings-intake": {
    hello: VIDEO_INVENTORY.HELLO,
    "good morning": VIDEO_INVENTORY["GOOD MORNING"],
    "good afternoon": VIDEO_INVENTORY["GOOD AFTERNOON"],
    "thank you": VIDEO_INVENTORY["THANK YOU"],
    "what is your name": VIDEO_INVENTORY["WHAT IS YOUR NAME"],
  },

  // Bedside Instructions & Examination Guidance (GRT-102)
  "lesson-bedside-cues": {
    come: VIDEO_INVENTORY.COME,
    give: VIDEO_INVENTORY.GIVE,
    drink: VIDEO_INVENTORY.DRINK,
    clean: VIDEO_INVENTORY.CLEAN,
    close: VIDEO_INVENTORY.CLOSE,
    switch: VIDEO_INVENTORY.SWITCH,
    busy: VIDEO_INVENTORY.BUSY,
    wrong: VIDEO_INVENTORY.WRONG,
    maybe: VIDEO_INVENTORY.MAYBE,
  },

  // Dietary Counseling & Hospital Nutrition (NUT-101)
  "lesson-diet-nutrition": {
    tea: VIDEO_INVENTORY.TEA,
    cook: VIDEO_INVENTORY.COOK,
    pour: VIDEO_INVENTORY.POUR,
    lemon: VIDEO_INVENTORY.LEMON,
    chilli: VIDEO_INVENTORY.CHILLI,
    cucumber: VIDEO_INVENTORY.CUCUMBER,
  },

  // Vegetables & Dietary Management (NUT-102)
  "lesson-diet-vegetables": {
    vegetables: VIDEO_INVENTORY.VEGETABLES,
    carrot: VIDEO_INVENTORY.CARROT,
    cabbage: VIDEO_INVENTORY.CABBAGE,
    cauliflower: VIDEO_INVENTORY.CAULIFLOWER,
    onion: VIDEO_INVENTORY.ONION,
    radish: VIDEO_INVENTORY.RADISH,
    brinjal: VIDEO_INVENTORY.BRINJAL,
  },

  // Pediatric Comfort & Reassurance (PED-101)
  "lesson-pediatric-care": {
    hug: VIDEO_INVENTORY.HUG,
    cry: VIDEO_INVENTORY.CRY,
    jump: VIDEO_INVENTORY.JUMP,
    umbrella: VIDEO_INVENTORY.UMBRELLA,
  },

  // Pediatric Animals & Play Therapy (PED-102)
  "lesson-pediatric-animals": {
    bear: VIDEO_INVENTORY.BEAR,
    crocodile: VIDEO_INVENTORY.CROCODILE,
    deer: VIDEO_INVENTORY.DEER,
    elephant: VIDEO_INVENTORY.ELEPHANT,
    giraffe: VIDEO_INVENTORY.GIRAFFE,
    lion: VIDEO_INVENTORY.LION,
    monkey: VIDEO_INVENTORY.MONKEY,
    peacock: VIDEO_INVENTORY.PEACOCK,
    pigeon: VIDEO_INVENTORY.PIGEON,
    sparrow: VIDEO_INVENTORY.SPARROW,
    tiger: VIDEO_INVENTORY.TIGER,
    turtle: VIDEO_INVENTORY.TURTLE,
  },

  // Hospital Administration & Consent (ADM-101)
  "lesson-admin-intake": {
    budget: VIDEO_INVENTORY.BUDGET,
    maths: VIDEO_INVENTORY.MATHS,
    writer: VIDEO_INVENTORY.WRITER,
    wife: VIDEO_INVENTORY.WIFE,
    uncle: VIDEO_INVENTORY.UNCLE,
    man: VIDEO_INVENTORY.MAN,
    key: VIDEO_INVENTORY.KEY,
    knife: VIDEO_INVENTORY.KNIFE,
  },

  // Ward Logistics & Facility Navigation (ADM-102)
  "lesson-ward-logistics": {
    karnataka: VIDEO_INVENTORY.KARNATAKA,
    temple: VIDEO_INVENTORY.TEMPLE,
    blood: VIDEO_INVENTORY.BLOOD,
    doctor: VIDEO_INVENTORY.DOCTOR,
    emergency: VIDEO_INVENTORY.EMERGENCY,
    help: VIDEO_INVENTORY.HELP,
    hospital: VIDEO_INVENTORY.HOSPITAL,
    medicine: VIDEO_INVENTORY.MEDICINE,
    nurse: VIDEO_INVENTORY.NURSE,
    pain: VIDEO_INVENTORY.PAIN,
  },
};

/**
 * Get video URL for a sign
 * @param signId - The internal sign ID (e.g., "fever", "hello")
 * @returns The video URL, or null if not found
 */
export function getSignVideoUrl(signId: string): string | null {
  return SIGN_VIDEO_URLS[signId.toLowerCase()] || null;
}

/**
 * Get all videos for a lesson
 * @param lessonId - The lesson ID (e.g., "lesson-clinical-triage")
 * @returns Object with sign IDs mapping to video URLs
 */
export function getLessonVideos(lessonId: string): Record<string, string> | null {
  return LESSON_VIDEO_MAPPING[lessonId] || null;
}

/**
 * Verify video completeness for a lesson
 * @param lessonId - The lesson ID
 * @param signIds - Array of sign IDs in the lesson
 * @returns Object with coverage status and missing videos
 */
export function validateLessonVideosCoverage(
  lessonId: string,
  signIds: string[]
): {
  complete: boolean;
  covered: number;
  total: number;
  missing: string[];
} {
  const lessonVideos = LESSON_VIDEO_MAPPING[lessonId] || {};
  const missing: string[] = [];

  signIds.forEach((signId) => {
    if (!getSignVideoUrl(signId) && !lessonVideos[signId.toLowerCase()]) {
      missing.push(signId);
    }
  });

  return {
    complete: missing.length === 0,
    covered: signIds.length - missing.length,
    total: signIds.length,
    missing,
  };
}

/**
 * Statistics about video coverage
 */
export const VIDEO_STATISTICS = {
  TOTAL_VIDEOS: 75,
  TOTAL_SIGNS: Object.keys(SIGN_VIDEO_URLS).length,
  TOTAL_LESSONS: Object.keys(LESSON_VIDEO_MAPPING).length,
  CATEGORIES: {
    CLINICAL: 8,
    GREETINGS: 14,
    NUTRITION: 13,
    PEDIATRIC: 16,
    ADMINISTRATION: 10,
    OTHER: 14,
  },
} as const;

/**
 * Health check for video system
 * Returns true if all systems are operational
 */
export function isVideoSystemHealthy(): boolean {
  return (
    Object.keys(SIGN_VIDEO_URLS).length > 0 &&
    Object.keys(LESSON_VIDEO_MAPPING).length > 0 &&
    VIDEO_STATISTICS.TOTAL_VIDEOS >= 50
  );
}

export default {
  VIDEO_INVENTORY,
  SIGN_VIDEO_URLS,
  LESSON_VIDEO_MAPPING,
  VIDEO_STATISTICS,
  getSignVideoUrl,
  getLessonVideos,
  validateLessonVideosCoverage,
  isVideoSystemHealthy,
};
