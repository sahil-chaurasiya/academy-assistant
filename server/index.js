require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',            require('./routes/auth'));
app.use('/api/students',        require('./routes/students'));
app.use('/api/notes',           require('./routes/notes'));
app.use('/api/visits',          require('./routes/visits'));
app.use('/api/announcements',   require('./routes/announcements'));
app.use('/api/roadmap',         require('./routes/roadmap'));
app.use('/api/roadmap-modules', require('./routes/roadmapModules'));
app.use('/api/topics',          require('./routes/topics'));
app.use('/api/student-topics',  require('./routes/studentTopics'));
app.use('/api/tags',            require('./routes/tags'));
app.use('/api/tasks',           require('./routes/tasks'));
app.use('/api/ai',              require('./routes/ai'));

// ── Health check — used by the keep-alive cron ────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ── Keep-alive: ping self every 14 minutes so Render never idles ──────────────
// Only runs in production — no point pinging localhost in dev
if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
  const PING_URL = `${process.env.RENDER_EXTERNAL_URL}/health`;
  const INTERVAL = 14 * 60 * 1000; // 14 minutes

  setInterval(async () => {
    try {
      const res = await fetch(PING_URL);
      console.log(`[keep-alive] ping ${PING_URL} → ${res.status}`);
    } catch (err) {
      console.warn(`[keep-alive] ping failed: ${err.message}`);
    }
  }, INTERVAL);

  console.log(`[keep-alive] Pinging ${PING_URL} every 14 min`);
}

module.exports = server;