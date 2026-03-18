<div align="center">

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/AI-Groq%20%2B%20Llama%203-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-000000?style=for-the-badge&logo=vercel" />

<br /><br />

```
   ╔═══════════════════════════════════════════╗
   ║                                           ║
   ║        🎓  ACADEMY  ASSISTANT             ║
   ║                                           ║
   ║   The smartest way to run a              ║
   ║   Spoken English Academy                  ║
   ║                                           ║
   ╚═══════════════════════════════════════════╝
```

**Stop juggling notebooks, WhatsApp, and spreadsheets.**  
Academy Assistant is a full-stack admin panel built for spoken English teachers —  
track every student's journey, weaknesses, roadmap, and progress in one place,  
with a built-in AI assistant that knows your entire academy by name.

<br />

🔗 **Live Demo:** [academy-assistant.vercel.app](https://academy-assistant.vercel.app)  
👤 **Demo login:** `admin@academy.com` / `admin123`

</div>

---

## ✨ What makes this different

Most academy software is built for large institutions — complex, bloated, expensive.  
This is built for **one teacher** who walks into class, remembers 20 students, and needs  
to know in 10 seconds: *who needs help today, what should we work on, and who's falling behind.*

---

## 🚀 Features

### 🧑‍🎓 Student Management
- Add students with level, goal, phone, joining date
- Tag weaknesses: `hesitation` `grammar` `vocabulary` `confidence` `pronunciation`
- Rate each student on **Confidence / Fluency / Grammar** (1–10 sliders)
- Advanced filters: level, weakness tags, rating range, join date
- **Bulk actions** — assign topics, add/remove tags, or delete multiple students at once

### 🗺️ Learning Roadmap
- Fully dynamic module system — create, reorder, activate/deactivate modules from Settings
- Students progress through modules: `Pending → In Progress → Completed`
- Visual stepper with overall progress bar per student
- Default path: Self Introduction → Daily Routine → Basic Grammar → Conversations → Storytelling → Interviews

### 📝 Session Notes & Timeline
- Add per-session observations with improvement rating (1–5)
- Full timeline per student, filterable by date range and rating
- Edit or delete any note inline
- Tracks the teacher's memory so nothing is forgotten

### 💬 Speaking Topics Library
- Reusable topic bank organized by level (Beginner / Intermediate / Advanced)
- Assign topics to individual students or in bulk
- Mark topics complete per student
- Manage entirely from the Settings panel — no code needed

### ✅ Today's Attendance
- One-click "Mark Present" on any page
- Dashboard shows who's here today in real time
- 14-day visit history, no double-counting
- Quick search on the Today page to mark any student present

### 🤖 AI Assistant (Context-Aware)
- Powered by **Groq + Llama 3.3 70B** — responses in ~2 seconds, completely free
- Knows **every student by name** — their ratings, weaknesses, last visit, session notes, roadmap progress
- Ask anything:
  - *"Which students need the most attention right now?"*
  - *"Who hasn't visited in 2 weeks?"*
  - *"Suggest topics for my intermediate students struggling with confidence"*
  - *"Who is close to completing the roadmap?"*
- **Export buttons** built into the AI panel — download Students, Session Notes, or Topics as CSV instantly

### ✅ Private Task Manager
- Personal task list — completely private, never visible to other users
- Priority levels (High / Medium / Low), due dates, notes
- Automatically grouped: **Overdue / Due Today / Upcoming**
- Separate completed tasks tab

### 📢 Announcements
- Post academy-wide notes and reminders
- Edit or delete any announcement inline
- Latest announcement highlighted

### ⚙️ Settings / Admin Panel
- **Manage Roadmap Modules** — add, edit, reorder (↑↓), toggle active/inactive
- **Manage Weakness Tags** — create tags with custom colors, delete cascades to all students
- **Manage Topics** — full CRUD with search and level filter
- Everything dynamic — zero hardcoded data, no developer needed

---

## 🖥️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 14 (App Router) · TypeScript · Tailwind CSS        │
│  Deployed on Vercel                                         │
├─────────────────────────────────────────────────────────────┤
│                         BACKEND                             │
│  Node.js · Express.js · REST API                            │
│  JWT Authentication · Deployed on Render                    │
├─────────────────────────────────────────────────────────────┤
│                        DATABASE                             │
│  MongoDB Atlas (Mongoose ODM)                               │
├─────────────────────────────────────────────────────────────┤
│                       AI LAYER                              │
│  Groq API (free) · Llama 3.3 70B · Ollama fallback          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
academy-assistant/
├── client/                         # Next.js frontend
│   ├── app/
│   │   ├── (app)/                  # Protected routes
│   │   │   ├── dashboard/          # Dashboard + drill-down pages
│   │   │   ├── students/           # List, profile, edit, new
│   │   │   ├── topics/             # Topics library
│   │   │   ├── tasks/              # Private task manager
│   │   │   ├── announcements/      # Announcements
│   │   │   └── settings/           # Admin control panel
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   │   ├── Sidebar.tsx             # Nav + AI panel trigger
│   │   ├── AiPanel.tsx             # Sliding AI assistant
│   │   └── WeaknessTagSelector.tsx # Dynamic tag chips
│   └── lib/
│       ├── api.ts                  # Axios instance
│       ├── AuthContext.tsx         # JWT auth state
│       ├── useTags.ts              # Cached tag fetcher
│       └── checkin.ts              # Attendance utility
│
└── server/                         # Express backend
    ├── models/                     # Mongoose schemas
    │   ├── Student.js
    │   ├── RoadmapModule.js        # Dynamic modules
    │   ├── RoadmapProgress.js      # Per-student progress
    │   ├── SessionNote.js
    │   ├── Topic.js
    │   ├── StudentTopic.js
    │   ├── Tag.js                  # Dynamic tags
    │   ├── Task.js                 # Private tasks
    │   ├── Visit.js
    │   ├── Announcement.js
    │   └── User.js
    ├── controllers/                # Business logic
    ├── routes/                     # Express routers
    ├── middleware/
    │   └── auth.js                 # JWT protect
    └── seed/
        └── seed.js                 # Demo data seeder
```

---

## 🏁 Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone
```bash
git clone https://github.com/sahil-chaurasiya/academy-assistant.git
cd academy-assistant
```

### 2. Backend
```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm install
npm run dev
# → http://localhost:5000
```

### 3. Frontend
```bash
cd client
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
# → http://localhost:3000
```

### 4. Seed demo data
```bash
cd server
npm run seed:fresh
```
```
Login → admin@academy.com / admin123
```

---

## 🌐 Deployment

### MongoDB Atlas
1. [cloud.mongodb.com](https://cloud.mongodb.com) → free cluster
2. Database Access → create user
3. Network Access → `0.0.0.0/0`
4. Connect → copy connection string

### Render (Backend)
1. New Web Service → connect repo
2. Root Directory: `server` · Build: `npm install` · Start: `node index.js`
3. Add environment variables (see table below)
4. Copy your Render URL

### Vercel (Frontend)
1. New Project → import repo
2. Root Directory: `client`
3. Add `NEXT_PUBLIC_API_URL` = your Render URL
4. Deploy → copy Vercel URL
5. Go back to Render → update `CLIENT_URL` = Vercel URL → redeploy

---

## 🔑 Environment Variables

### Server (Render)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `RENDER_EXTERNAL_URL` | `https://your-backend.onrender.com` |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

### Client (Vercel)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |

---

## ⚡ Keep-Alive

Render's free tier shuts down services after 15 minutes of inactivity.  
This project includes a built-in keep-alive that **pings its own `/health` endpoint every 14 minutes** — automatically, silently, in production only.

No third-party services needed. No config required.  
It activates automatically when `NODE_ENV=production` and `RENDER_EXTERNAL_URL` are set.

---

## 📊 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Register |
| `GET/POST` | `/api/students` | List / create students |
| `GET/PUT/DELETE` | `/api/students/:id` | Student CRUD |
| `POST` | `/api/students/bulk` | Bulk actions |
| `GET/POST` | `/api/notes` | Session notes |
| `PUT/DELETE` | `/api/notes/:id` | Edit / delete note |
| `POST` | `/api/visits/checkin` | Mark present |
| `GET` | `/api/visits/today` | Today's visitors |
| `GET/POST/DELETE` | `/api/topics` | Topics library |
| `GET/POST` | `/api/roadmap/:studentId` | Student roadmap |
| `GET/POST/PUT/DELETE` | `/api/roadmap-modules` | Manage modules |
| `GET/POST/PUT/DELETE` | `/api/tags` | Manage tags |
| `GET/POST/PUT/DELETE` | `/api/tasks` | Private tasks |
| `POST` | `/api/ai/chat` | AI assistant |
| `GET` | `/api/ai/export` | Export CSV |
| `GET` | `/health` | Keep-alive ping |

---

## 🙌 Built With

- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Express.js](https://expressjs.com/) — Backend framework
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Database
- [Groq](https://groq.com/) — AI inference (free tier)
- [Render](https://render.com/) — Backend hosting
- [Vercel](https://vercel.com/) — Frontend hosting

---

<div align="center">

Made with ☕ for spoken English teachers everywhere.

**[Live Demo](https://academy-assistant.vercel.app)** · **[Report Bug](https://github.com/sahil-chaurasiya/academy-assistant/issues)** · **[Request Feature](https://github.com/sahil-chaurasiya/academy-assistant/issues)**

</div>
