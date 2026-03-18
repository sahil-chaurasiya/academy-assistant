const Student         = require('../models/Student');
const SessionNote     = require('../models/SessionNote');
const Topic           = require('../models/Topic');
const Visit           = require('../models/Visit');
const RoadmapModule   = require('../models/RoadmapModule');
const RoadmapProgress = require('../models/RoadmapProgress');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama3-8b-8192';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback: if no Groq key, try local Ollama (non-streaming)
const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ── Build compact context ─────────────────────────────────────────────────────
async function buildContext() {
  const [students, topics, modules, recentNotes, recentVisits] = await Promise.all([
    Student.find().sort({ name: 1 }).lean(),
    Topic.find().sort({ level: 1, title: 1 }).lean(),
    RoadmapModule.find({ isActive: true }).sort({ order: 1 }).lean(),
    SessionNote.find().sort({ date: -1 }).limit(60).populate('student', 'name').lean(),
    Visit.find().sort({ visitedAt: -1 }).limit(100).populate('student', 'name').lean(),
  ]);

  const progressRecords = await RoadmapProgress.find().lean();
  const completedByStudent = {};
  progressRecords.forEach(p => {
    const sid = p.student.toString();
    if (!completedByStudent[sid]) completedByStudent[sid] = 0;
    if (p.status === 'completed') completedByStudent[sid]++;
  });

  const notesByStudent = {};
  recentNotes.forEach(n => {
    const sid = n.student?._id?.toString();
    if (!sid) return;
    if (!notesByStudent[sid]) notesByStudent[sid] = [];
    if (notesByStudent[sid].length < 2) notesByStudent[sid].push(n);
  });

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayIds = new Set(
    recentVisits.filter(v => new Date(v.visitedAt) >= todayStart)
      .map(v => v.student?._id?.toString()).filter(Boolean)
  );

  const lastVisit = {};
  recentVisits.forEach(v => {
    const sid = v.student?._id?.toString();
    if (sid && !lastVisit[sid]) lastVisit[sid] = v.visitedAt;
  });

  const levelCount = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  students.forEach(s => { if (levelCount[s.level] !== undefined) levelCount[s.level]++; });

  const weaknessFreq = {};
  students.forEach(s => s.weaknessTags?.forEach(t => { weaknessFreq[t] = (weaknessFreq[t]||0)+1; }));
  const topWeaknesses = Object.entries(weaknessFreq).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([t,c])=>`${t}(${c})`).join(', ');

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
  const newThisMonth = students.filter(s => new Date(s.createdAt) >= startOfMonth).length;

  const studentLines = students.map(s => {
    const sid = s._id.toString();
    const notes = notesByStudent[sid] || [];
    const avgRating = notes.length
      ? (notes.reduce((a,n)=>a+n.rating,0)/notes.length).toFixed(1) : null;
    const daysAgo = lastVisit[sid]
      ? Math.floor((Date.now()-new Date(lastVisit[sid]))/86400000) : 999;
    const completed = completedByStudent[sid] || 0;
    const latestNote = notes[0]?.observation?.slice(0,80) || 'no notes';
    const r = s.ratings;
    const rStr = (r?.confidence||r?.fluency||r?.grammar)
      ? `conf:${r.confidence??'?'} flu:${r.fluency??'?'} gram:${r.grammar??'?'}` : 'not rated';
    return `- ${s.name} [${s.level}] weakness:${s.weaknessTags?.join('+')||'none'} ${rStr} avgSession:${avgRating??'none'}/5 roadmap:${completed}/${modules.length} lastVisit:${daysAgo===999?'never':daysAgo+'d ago'} today:${todayIds.has(sid)?'YES':'no'} goal:"${(s.goal||'').slice(0,50)}" note:"${latestNote}"`;
  }).join('\n');

  return `You are an AI assistant for a Spoken English Academy. Use this live data to answer.
Be specific, name students, give actionable advice. Use bullet points for lists. Keep answers concise.

STATS: ${students.length} students (Beg:${levelCount.Beginner} Int:${levelCount.Intermediate} Adv:${levelCount.Advanced}) | today:${todayIds.size} | new this month:${newThisMonth} | top weaknesses: ${topWeaknesses||'none'}
ROADMAP: ${modules.map(m=>m.title).join(' → ')}
TOPICS: ${topics.map(t=>`[${t.level}] ${t.title}`).join(' | ')}
STUDENTS:
${studentLines}`.trim();
}

// ── POST /api/ai/chat — simple JSON response, no streaming ───────────────────
exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ message: 'messages required' });

    const context = await buildContext();
    const fullMessages = [{ role: 'system', content: context }, ...messages];

    // ── Try Groq first (fast, free) ──────────────────────────────────────────
    if (GROQ_API_KEY) {
      const groqRes = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: fullMessages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!groqRes.ok) {
        const err = await groqRes.text();
        return res.status(502).json({ message: `Groq error: ${err}` });
      }

      const data = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content || 'No response from Groq.';
      return res.json({ reply });
    }

    // ── Fallback: Ollama non-streaming ───────────────────────────────────────
    let ollamaRes;
    try {
      ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: fullMessages, stream: false }),
        signal: AbortSignal.timeout(120000),
      });
    } catch (e) {
      return res.status(502).json({
        message: `No AI provider available. Either add GROQ_API_KEY to .env (free at console.groq.com) or make sure Ollama is running.`,
      });
    }

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      return res.status(502).json({ message: `Ollama error: ${err}` });
    }

    const ollamaData = await ollamaRes.json();
    const reply = ollamaData.message?.content || 'No response from Ollama.';
    return res.json({ reply });

  } catch (err) { next(err); }
};

// ── GET /api/ai/context ──────────────────────────────────────────────────────
exports.getContext = async (req, res, next) => {
  try {
    const context = await buildContext();
    res.json({ context });
  } catch (err) { next(err); }
};

// ── GET /api/ai/export ───────────────────────────────────────────────────────
exports.exportData = async (req, res, next) => {
  try {
    const { type } = req.query;
    const [students, notes, topics] = await Promise.all([
      Student.find().sort({ name: 1 }).lean(),
      SessionNote.find().populate('student', 'name level').sort({ date: -1 }).lean(),
      Topic.find().sort({ level: 1, title: 1 }).lean(),
    ]);

    const toCSV = (rows) => rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n');

    if (type === 'excel') {
      const rows = [
        ['Name','Level','Phone','Goal','Weaknesses','Confidence','Fluency','Grammar','Joined','Notes'],
        ...students.map(s => [s.name,s.level,s.phone,s.goal||'',(s.weaknessTags||[]).join('; '),s.ratings?.confidence??'',s.ratings?.fluency??'',s.ratings?.grammar??'',new Date(s.joiningDate).toLocaleDateString(),(s.notes||'').replace(/,/g,';')]),
      ];
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename="academy-students.csv"');
      return res.send(toCSV(rows));
    }
    if (type === 'notes-csv') {
      const rows = [
        ['Student','Level','Date','Rating','Observation'],
        ...notes.map(n => [n.student?.name||'',n.student?.level||'',new Date(n.date).toLocaleDateString(),n.rating,(n.observation||'').replace(/,/g,';')]),
      ];
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename="academy-notes.csv"');
      return res.send(toCSV(rows));
    }
    if (type === 'topics-csv') {
      const rows = [['Title','Level','Description'], ...topics.map(t=>[t.title,t.level,t.description||''])];
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename="academy-topics.csv"');
      return res.send(toCSV(rows));
    }
    res.status(400).json({ message: 'type must be: excel | notes-csv | topics-csv' });
  } catch (err) { next(err); }
};