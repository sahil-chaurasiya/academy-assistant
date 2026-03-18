require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────────────────────
const User            = require('../models/User');
const Tag             = require('../models/Tag');
const RoadmapModule   = require('../models/RoadmapModule');
const RoadmapProgress = require('../models/RoadmapProgress');
const Student         = require('../models/Student');
const SessionNote     = require('../models/SessionNote');
const Topic           = require('../models/Topic');
const StudentTopic    = require('../models/StudentTopic');
const Announcement    = require('../models/Announcement');
const Visit           = require('../models/Visit');

// ── Helpers ──────────────────────────────────────────────────────────────────
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Return a Date that is `daysAgo` days before today */
const daysBack = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

// ── Clear flag ───────────────────────────────────────────────────────────────
const CLEAR = process.argv.includes('--clear');

// ════════════════════════════════════════════════════════════════════════════
//  DATA DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

// ── Tags ─────────────────────────────────────────────────────────────────────
const TAG_DEFS = [
  { name: 'hesitation',    type: 'weakness', color: 'bg-orange-100 text-orange-700 border-orange-200', colorSelected: 'bg-orange-500 text-white' },
  { name: 'grammar',       type: 'weakness', color: 'bg-blue-100 text-blue-700 border-blue-200',       colorSelected: 'bg-blue-600 text-white' },
  { name: 'vocabulary',    type: 'weakness', color: 'bg-purple-100 text-purple-700 border-purple-200', colorSelected: 'bg-purple-600 text-white' },
  { name: 'confidence',    type: 'weakness', color: 'bg-rose/10 text-rose border-rose/20',             colorSelected: 'bg-rose text-white' },
  { name: 'pronunciation', type: 'weakness', color: 'bg-emerald/10 text-emerald border-emerald/20',    colorSelected: 'bg-emerald text-white' },
  { name: 'fluency',       type: 'weakness', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', colorSelected: 'bg-yellow-500 text-white' },
  { name: 'listening',     type: 'custom',   color: 'bg-indigo-100 text-indigo-700 border-indigo-200', colorSelected: 'bg-indigo-600 text-white' },
  { name: 'eye contact',   type: 'custom',   color: 'bg-pink-100 text-pink-700 border-pink-200',       colorSelected: 'bg-pink-600 text-white' },
];

// ── Roadmap modules ───────────────────────────────────────────────────────────
const MODULE_DEFS = [
  { title: 'Self Introduction',    description: 'Learn to introduce yourself naturally — name, background, interests.', level: 'Beginner',     order: 0, isActive: true },
  { title: 'Daily Routine',        description: 'Describe your daily schedule using present simple and time expressions.', level: 'Beginner',     order: 1, isActive: true },
  { title: 'Basic Grammar',        description: 'Tenses, articles, prepositions — the building blocks of correct speech.', level: 'Beginner',     order: 2, isActive: true },
  { title: 'Asking Questions',     description: 'Form and answer WH-questions and yes/no questions confidently.', level: 'Beginner',     order: 3, isActive: true },
  { title: 'Conversations',        description: 'Hold a 2–3 minute casual conversation on everyday topics.', level: 'Intermediate', order: 4, isActive: true },
  { title: 'Storytelling',         description: 'Narrate a personal story with a clear beginning, middle, and end.', level: 'Intermediate', order: 5, isActive: true },
  { title: 'Interview Practice',   description: 'Answer common HR and behavioural interview questions fluently.', level: 'Advanced',     order: 6, isActive: true },
  { title: 'Public Speaking',      description: 'Deliver a 5-minute prepared speech to a small audience.', level: 'Advanced',     order: 7, isActive: true },
];

// ── Topics ────────────────────────────────────────────────────────────────────
const TOPIC_DEFS = [
  { title: 'My Favourite Movie',        level: 'Beginner',     description: 'Talk about a movie you love — plot, characters, why you like it.' },
  { title: 'Describe Your City',        level: 'Beginner',     description: 'Describe where you live — landmarks, culture, food, transport.' },
  { title: 'Your Daily Routine',        level: 'Beginner',     description: 'Walk through a typical day from morning to night.' },
  { title: 'Talk About Your Family',    level: 'Beginner',     description: 'Introduce your family members and describe their personalities.' },
  { title: 'My Favourite Food',         level: 'Beginner',     description: 'Describe a dish you love, how it is made, and where you eat it.' },
  { title: 'Your Dream Job',            level: 'Intermediate', description: 'Explain the career you want, why you want it, and how you plan to get there.' },
  { title: 'Talk About Your Friend',    level: 'Intermediate', description: 'Describe a close friend — how you met, what they are like, a memory together.' },
  { title: 'A Travel Experience',       level: 'Intermediate', description: 'Describe a trip you took — destination, highlights, challenges.' },
  { title: 'Social Media & Technology', level: 'Intermediate', description: 'Discuss how social media affects daily life and relationships.' },
  { title: 'Tell a Childhood Story',    level: 'Intermediate', description: 'Share a memorable story from your childhood using past tenses.' },
  { title: 'Tell Me About Yourself',    level: 'Advanced',     description: 'Classic HR opener — deliver a polished 2-minute self-summary.' },
  { title: 'Your Greatest Weakness',    level: 'Advanced',     description: 'Answer the tricky HR question honestly and positively.' },
  { title: 'Leadership Experience',     level: 'Advanced',     description: 'Describe a time you led a team or project using the STAR method.' },
  { title: 'Debate: Work-Life Balance', level: 'Advanced',     description: 'Argue both sides of whether work-life balance is achievable today.' },
  { title: 'Group Discussion: AI',      level: 'Advanced',     description: 'Participate in a group discussion on artificial intelligence in daily life.' },
];

// ── Students ──────────────────────────────────────────────────────────────────
const STUDENT_DEFS = [
  { name: 'Aarav Sharma',     phone: '9876543201', level: 'Beginner',     goal: 'Speak confidently in job interviews',         notes: 'Very shy initially but eager to learn' },
  { name: 'Priya Patel',      phone: '9876543202', level: 'Intermediate', goal: 'Improve fluency for office presentations',    notes: 'Good grammar but freezes while speaking' },
  { name: 'Rahul Verma',      phone: '9876543203', level: 'Beginner',     goal: 'Basic English for daily communication',       notes: 'Struggles with tense usage' },
  { name: 'Sneha Iyer',       phone: '9876543204', level: 'Advanced',     goal: 'Prepare for IELTS speaking module',           notes: 'Strong vocabulary, needs fluency work' },
  { name: 'Kiran Reddy',      phone: '9876543205', level: 'Intermediate', goal: 'Communicate with international clients',      notes: 'Good listening, hesitates when speaking' },
  { name: 'Divya Nair',       phone: '9876543206', level: 'Beginner',     goal: 'Converse comfortably at work',                notes: 'Very motivated, quick learner' },
  { name: 'Arjun Mehta',      phone: '9876543207', level: 'Advanced',     goal: 'Ace campus placement interviews',             notes: 'Engineering student, needs professional English' },
  { name: 'Meera Joshi',      phone: '9876543208', level: 'Beginner',     goal: 'Learn English from scratch',                  notes: 'Mother tongue is Hindi, no prior English education' },
  { name: 'Vikram Singh',     phone: '9876543209', level: 'Intermediate', goal: 'Get promoted to team lead role',              notes: 'Good at writing, weak at spoken expression' },
  { name: 'Pooja Gupta',      phone: '9876543210', level: 'Beginner',     goal: 'Help children with English homework',         notes: 'Homemaker, evening batch preference' },
  { name: 'Sanjay Kumar',     phone: '9876543211', level: 'Advanced',     goal: 'Deliver training sessions in English',        notes: 'Corporate trainer, polishing delivery style' },
  { name: 'Ananya Rao',       phone: '9876543212', level: 'Intermediate', goal: 'Speak without grammatical errors',            notes: 'Makes errors with plurals and articles' },
  { name: 'Rohit Desai',      phone: '9876543213', level: 'Beginner',     goal: 'Introduce himself in English at events',      notes: 'Sales background, high motivation' },
  { name: 'Lakshmi Suresh',   phone: '9876543214', level: 'Intermediate', goal: 'Improve pronunciation of English words',      notes: 'Tamil speaker, mispronounces vowel sounds' },
  { name: 'Nikhil Bhatia',    phone: '9876543215', level: 'Advanced',     goal: 'Transition into an MNC environment',          notes: 'Currently in mid-level management role' },
  { name: 'Kavya Menon',      phone: '9876543216', level: 'Beginner',     goal: 'Overcome fear of speaking English',           notes: 'Knows grammar theory but too afraid to speak' },
  { name: 'Aditya Tiwari',    phone: '9876543217', level: 'Intermediate', goal: 'Participate actively in team meetings',       notes: 'Tends to stay quiet when others speak fast' },
  { name: 'Ritu Saxena',      phone: '9876543218', level: 'Beginner',     goal: 'Simple English for travel abroad',            notes: 'Planning to visit UK for a family wedding' },
  { name: 'Suresh Pillai',    phone: '9876543219', level: 'Advanced',     goal: 'Work as a BPO quality analyst',               notes: 'Excellent pronunciation, needs formal vocabulary' },
  { name: 'Deepika Chauhan',  phone: '9876543220', level: 'Intermediate', goal: 'Present research papers at conferences',      notes: 'PhD student, confident writer, nervous speaker' },
];

// ── Session note observations pool ───────────────────────────────────────────
const OBSERVATIONS = {
  1: [
    'Student froze completely during the first exercise. Could barely complete a single sentence.',
    'Very low confidence today. Kept switching to mother tongue mid-sentence.',
    'Long pauses between every word. Vocabulary seemed completely blocked.',
    'Student appears very anxious. Could not maintain eye contact while speaking.',
    'Struggled significantly with basic sentence formation. Needs foundational work.',
  ],
  2: [
    'Some improvement in attempting full sentences but grammar errors are very frequent.',
    'Still hesitating but showed willingness to try. Made multiple tense errors.',
    'Pronunciation needs a lot of work. Few words were understandable on first attempt.',
    'Getting slightly more comfortable but still relies heavily on filler words like "um" and "uh".',
    'Completed the task but with major pauses. Confidence is slowly building.',
  ],
  3: [
    'Good session today. Student completed all speaking tasks with only minor errors.',
    'Noticeably better fluency compared to last week. Grammar still needs attention.',
    'Maintained a 2-minute monologue with some hesitation but overall decent delivery.',
    'Vocabulary is improving. Made some creative word choices today.',
    'Errors in article usage but the communication intent was clear throughout.',
  ],
  4: [
    'Excellent improvement this session. Spoke for 3 minutes with minimal pauses.',
    'Pronunciation has improved significantly. Most words clearly understandable.',
    'Student corrected their own mistakes twice today — great self-awareness.',
    'Held a back-and-forth conversation naturally. Very pleasing progress.',
    'Grammar is noticeably stronger. Only minor slips with past tense forms.',
  ],
  5: [
    'Outstanding session. Student held a 5-minute conversation without any major errors.',
    'Natural delivery, excellent vocabulary, and strong confidence. Ready for next level.',
    'Completed mock interview brilliantly. All answers were structured and fluent.',
    'Best session so far. Minimal hesitation, strong eye contact, and great vocabulary.',
    'Student is now speaking at a near-native flow. Highly impressed with progress.',
  ],
};

// ── Announcements ─────────────────────────────────────────────────────────────
const ANNOUNCEMENT_DEFS = [
  { message: '📣 Special speaking session this Saturday from 10am to 12pm. All students welcome!', daysAgo: 2 },
  { message: '🏖 Academy will remain closed on Sunday due to a public holiday. Classes resume Monday.', daysAgo: 5 },
  { message: '🎤 Group discussion event this Friday evening at 6pm. Topic: "The future of remote work". Prepare your points!', daysAgo: 9 },
  { message: '📝 Monthly assessment will be held in the last week of this month. All students must attend.', daysAgo: 14 },
  { message: '🌟 Congratulations to Sneha Iyer and Sanjay Kumar for completing the Advanced module! Keep going.', daysAgo: 21 },
];

// ════════════════════════════════════════════════════════════════════════════
//  SEED FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

async function dropStaleIndexes() {
  // Drop old index from v2 (moduleName field) — safe if it doesn't exist
  try {
    await RoadmapProgress.collection.dropIndex('student_1_moduleName_1');
    console.log('   ✓ Dropped stale index: student_1_moduleName_1');
  } catch (_) { /* already gone — fine */ }
}

async function clearData() {
  console.log('\n🗑  Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Tag.deleteMany({}),
    RoadmapModule.deleteMany({}),
    RoadmapProgress.deleteMany({}),
    Student.deleteMany({}),
    SessionNote.deleteMany({}),
    Topic.deleteMany({}),
    StudentTopic.deleteMany({}),
    Announcement.deleteMany({}),
    Visit.deleteMany({}),
  ]);
  console.log('   ✓ All collections cleared');
}

async function seedUser() {
  console.log('\n👤 Seeding admin user…');
  const existing = await User.findOne({ email: 'admin@academy.com' });
  if (existing) {
    console.log('   ℹ  Admin user already exists — skipping');
    return existing;
  }
  const user = await User.create({
    name: 'Academy Admin',
    email: 'admin@academy.com',
    password: 'admin123',   // hashed by pre-save hook
  });
  console.log(`   ✓ Admin user created  →  email: admin@academy.com  |  password: admin123`);
  return user;
}

async function seedTags() {
  console.log('\n🏷  Seeding tags…');
  const tags = await Tag.insertMany(TAG_DEFS);
  console.log(`   ✓ ${tags.length} tags inserted`);
  return tags;
}

async function seedRoadmapModules() {
  console.log('\n🗺  Seeding roadmap modules…');
  const modules = await RoadmapModule.insertMany(MODULE_DEFS);
  console.log(`   ✓ ${modules.length} modules inserted`);
  return modules;
}

async function seedTopics(adminUser) {
  console.log('\n💬 Seeding topics…');
  const topicsWithCreator = TOPIC_DEFS.map(t => ({ ...t, createdBy: adminUser._id }));
  const topics = await Topic.insertMany(topicsWithCreator);
  console.log(`   ✓ ${topics.length} topics inserted`);
  return topics;
}

async function seedStudents(tagNames) {
  console.log('\n👩‍🎓 Seeding students…');

  // Spread joining dates over the past 8 months
  const students = await Student.insertMany(
    STUDENT_DEFS.map((s, i) => {
      const tagCount = rand(1, 3);
      const chosenTags = pickN(tagNames, tagCount);

      return {
        ...s,
        weaknessTags: chosenTags,
        joiningDate: daysBack(rand(10, 240)),
        ratings: {
          confidence: rand(2, 10),
          fluency:    rand(2, 10),
          grammar:    rand(2, 10),
        },
      };
    })
  );

  console.log(`   ✓ ${students.length} students inserted`);
  return students;
}

async function seedSessionNotes(students) {
  console.log('\n🧾 Seeding session notes…');

  const allNotes = [];

  for (const student of students) {
    const noteCount = rand(3, 6);
    // Space notes out over past 12 weeks
    let dayOffset = rand(5, 90);

    for (let n = 0; n < noteCount; n++) {
      const rating = rand(1, 5);
      const observation = pick(OBSERVATIONS[rating]);

      allNotes.push({
        student: student._id,
        observation,
        rating,
        date: daysBack(dayOffset),
      });

      dayOffset -= rand(5, 14);   // each note is 5-14 days earlier than the last
      if (dayOffset < 1) break;
    }
  }

  const notes = await SessionNote.insertMany(allNotes);
  console.log(`   ✓ ${notes.length} session notes inserted  (avg ${(notes.length / students.length).toFixed(1)} per student)`);
  return notes;
}

async function seedRoadmapProgress(students, modules) {
  console.log('\n📊 Seeding roadmap progress…');

  const progressDocs = [];

  for (const student of students) {
    // Beginners get 1-3 modules, Intermediate 2-5, Advanced 3-7
    const maxModules = student.level === 'Beginner' ? rand(1, 3) : student.level === 'Intermediate' ? rand(2, 5) : rand(3, 7);
    const assignedModules = modules.slice(0, maxModules);

    assignedModules.forEach((mod, idx) => {
      let status, completedAt = null;

      if (idx < maxModules - 1) {
        // All but the last module are completed
        status = 'completed';
        completedAt = daysBack(rand(5, 60));
      } else {
        // The last one is in_progress or pending
        status = pick(['in_progress', 'pending']);
      }

      progressDocs.push({ student: student._id, module: mod._id, status, completedAt });
    });
  }

  const progress = await RoadmapProgress.insertMany(progressDocs);
  console.log(`   ✓ ${progress.length} roadmap progress records inserted`);
  return progress;
}

async function seedStudentTopics(students, topics) {
  console.log('\n🔗 Seeding student-topic assignments…');

  const assignments = [];
  const seen = new Set();

  for (const student of students) {
    // Filter topics that match or are below student level
    const eligible = topics.filter(t => {
      if (student.level === 'Beginner')     return t.level === 'Beginner';
      if (student.level === 'Intermediate') return t.level !== 'Advanced';
      return true;  // Advanced gets all
    });

    const count = rand(2, 3);
    const chosen = pickN(eligible, Math.min(count, eligible.length));

    for (const topic of chosen) {
      const key = `${student._id}-${topic._id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      assignments.push({
        student: student._id,
        topic: topic._id,
        status: pick(['pending', 'pending', 'completed']),  // 2:1 ratio pending:completed
        assignedAt: daysBack(rand(1, 30)),
      });
    }
  }

  const result = await StudentTopic.insertMany(assignments);
  console.log(`   ✓ ${result.length} student-topic assignments inserted`);
  return result;
}

async function seedAnnouncements(adminUser) {
  console.log('\n📢 Seeding announcements…');

  const docs = ANNOUNCEMENT_DEFS.map(a => ({
    message: a.message,
    createdBy: adminUser._id,
    createdAt: daysBack(a.daysAgo),
    updatedAt: daysBack(a.daysAgo),
  }));

  // Use insertMany with timestamps manually set
  const announcements = await Announcement.collection.insertMany(
    docs.map(d => ({ ...d, _id: new mongoose.Types.ObjectId() }))
  );
  console.log(`   ✓ ${announcements.insertedCount} announcements inserted`);
}

async function seedVisits(students) {
  console.log('\n📅 Seeding recent visits…');

  const visits = [];

  // Seed visits for the past 14 days
  for (let daysAgo = 0; daysAgo <= 14; daysAgo++) {
    // On each day, 4-10 random students visited
    const dailyStudents = pickN(students, rand(4, 10));
    for (const student of dailyStudents) {
      const visitDate = daysBack(daysAgo);
      visitDate.setHours(rand(9, 18), rand(0, 59), 0, 0);
      visits.push({ student: student._id, visitedAt: visitDate });
    }
  }

  const result = await Visit.collection.insertMany(
    visits.map(v => ({ ...v, _id: new mongoose.Types.ObjectId(), createdAt: v.visitedAt, updatedAt: v.visitedAt }))
  );
  console.log(`   ✓ ${result.insertedCount} visit records inserted  (14 days of history)`);
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   Academy Assistant — Database Seeder');
  console.log('═══════════════════════════════════════════');

  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI not found in .env file');
    process.exit(1);
  }

  console.log(`\n🔌 Connecting to MongoDB…`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('   ✓ Connected');

  // Always drop stale indexes from previous schema versions
  await dropStaleIndexes();

  if (CLEAR) {
    await clearData();
  } else {
    console.log('\nℹ  Running in append mode (use --clear to wipe first)');
  }

  // Run all seeders in dependency order
  const adminUser    = await seedUser();
  const tags         = await seedTags();
  const modules      = await seedRoadmapModules();
  const topics       = await seedTopics(adminUser);
  const tagNames     = tags.map(t => t.name);
  const students     = await seedStudents(tagNames);
  await seedSessionNotes(students);
  await seedRoadmapProgress(students, modules);
  await seedStudentTopics(students, topics);
  await seedAnnouncements(adminUser);
  await seedVisits(students);

  console.log('\n═══════════════════════════════════════════');
  console.log('   ✅  Seeding complete!');
  console.log('═══════════════════════════════════════════');
  console.log('\n📋 Summary:');
  console.log(`   • ${students.length} students`);
  console.log(`   • ${tags.length} weakness tags`);
  console.log(`   • ${modules.length} roadmap modules`);
  console.log(`   • ${topics.length} speaking topics`);
  console.log(`   • Session notes, roadmap progress, topic assignments, visits — all populated`);
  console.log('\n🔑 Login credentials:');
  console.log('   Email:    admin@academy.com');
  console.log('   Password: admin123');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Seeder failed:', err.message);
  process.exit(1);
});