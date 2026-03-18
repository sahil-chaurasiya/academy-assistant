# Academy Assistant

Spoken English Academy management system — student tracking, roadmap, AI assistant, tasks.

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, TypeScript → deployed on **Vercel**
- **Backend:** Node.js, Express.js, MongoDB → deployed on **Render**
- **AI:** Groq API (free) with Ollama fallback
- **Database:** MongoDB Atlas (free tier)

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas URI
- Groq API key (free at https://console.groq.com)

### Server
```bash
cd server
cp .env.example .env        # fill in values
npm install
npm run dev                 # runs on http://localhost:5000
```

### Client
```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev                 # runs on http://localhost:3000
```

### Seed database
```bash
cd server
npm run seed:fresh          # wipes and seeds demo data
```
Login: `admin@academy.com` / `admin123`

---

## Deployment

### Step 1 — MongoDB Atlas (database)
1. Go to https://cloud.mongodb.com → create free cluster
2. Database Access → create user with password
3. Network Access → Allow from anywhere (`0.0.0.0/0`)
4. Connect → Drivers → copy connection string

### Step 2 — GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/academy-assistant.git
git push -u origin main
```

### Step 3 — Render (backend)
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free
4. Environment Variables — add all from `server/.env.production.example`
5. Deploy → copy your Render URL (e.g. `https://academy-assistant.onrender.com`)

### Step 4 — Vercel (frontend)
1. Go to https://vercel.com → New Project → import your GitHub repo
2. Settings:
   - **Root Directory:** `client`
   - **Framework:** Next.js
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL` = your Render URL from Step 3
4. Deploy → copy your Vercel URL

### Step 5 — Update CLIENT_URL on Render
Go back to Render → your service → Environment → update:
```
CLIENT_URL=https://your-app.vercel.app
```
Then redeploy.

---

## Keep-Alive
The server automatically pings its own `/health` endpoint every 14 minutes in production,
preventing Render's free tier from putting the service to sleep.
This only activates when `NODE_ENV=production` and `RENDER_EXTERNAL_URL` are set.

---

## Environment Variables Reference

### Server (Render)
| Variable | Description |
|---|---|
| `NODE_ENV` | Set to `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for JWT signing |
| `CLIENT_URL` | Your Vercel frontend URL |
| `RENDER_EXTERNAL_URL` | Your Render backend URL (auto-set by Render) |
| `GROQ_API_KEY` | Free AI key from console.groq.com |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

### Client (Vercel)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL |