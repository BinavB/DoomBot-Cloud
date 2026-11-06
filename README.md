# DOOMBOT Cloud

Live app: https://doombot-igba.onrender.com/

The cloud version of DOOMBOT, a personal AI agent with a Doctor Doom theme. It keeps all data in a Turso database, so it can run on free hosts that wipe their disk, such as Render's free plan.

Every person signs in with Google and gets a private account. Chats, Doombots, memories, to-dos, alerts and Google connections are never shared between accounts.

## What it does

- Chat agent with an approval step for risky actions, using Gemini first and free backup providers when its daily limit runs out.
- Streaming replies with a stop button, multiple chats with search, edit and regenerate, voice input and read-aloud.
- Attach images and PDFs, switch between Fast and Think answers, and share a chat with a read-only link.
- Custom instructions, account memory and a time zone for each person.
- Morning briefing at 07:00 Dubai time with weather, headlines, calendar, unread email and to-dos.
- Doombots with private memory, assigned tasks and routines that run hourly, daily, on weekdays, weekly or monthly.
- Read-only Google Calendar, Gmail and Tasks, connected per account.
- Alerts page and phone alerts with Web Push.
- A daily token limit per account to cap AI cost.

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

With the default `TURSO_DATABASE_URL=file:data/agent.db`, data is kept in a local file. Fill in `.env.local`, then open http://localhost:3000.

| Setting | What it is |
| --- | --- |
| `GEMINI_API_KEY` | Main AI provider. The free tier works, but has daily limits |
| `GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `DEEPSEEK_API_KEY` | Optional backups, used in this order when Gemini runs out. Groq, Mistral and OpenRouter have free plans |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client, used for sign-in and for Calendar, Gmail and Tasks |
| `AUTH_SECRET` | Random text of at least 32 characters that signs login cookies. Make one with `openssl rand -hex 32` |
| `APP_URL` | The public address of the app, with no trailing slash |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | The Turso database address and its token |
| `CRON_SECRET` | Random text of at least 16 characters that protects the `/api/cron` keep-awake endpoint |
| `DAILY_TOKEN_LIMIT` | Tokens each account may use per day |

## Deploy free on Render with Turso

Render's free plan sleeps after 15 minutes without visitors and wipes its disk. Turso keeps the data, and a free cron job keeps the app awake so the 07:00 briefing and routines run.

### 1. Create the Turso database
1. Sign up at https://turso.tech (free, no card).
2. Create a database, for example `doombot`.
3. Copy its URL (it starts with `libsql://`) and create a database token.

### 2. Create the Render service
1. Sign up at https://render.com and connect your GitHub account.
2. Choose **New → Blueprint** and pick this repository. Render reads `render.yaml` and creates a free web service named `doombot`.
3. Fill in the values it asks for: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, the two Google values and the two AI keys.
4. After the first deploy, copy the service address, such as `https://doombot.onrender.com`. Set `APP_URL` to it and redeploy.

`AUTH_SECRET` and `CRON_SECRET` are generated for you. Copy `CRON_SECRET` from the service's **Environment** page for the next step.

### 3. Keep it awake with cron-job.org
1. Sign up at https://cron-job.org (free).
2. Create a job for `https://YOUR-ADDRESS/api/cron`, every 5 minutes.
3. Under advanced settings, add the header `Authorization` with the value `Bearer YOUR_CRON_SECRET`.

Each visit also runs any due briefings and routines, so nothing depends on the app staying awake in between.

### 4. Google Cloud OAuth
In your OAuth client, add these Authorized redirect URIs, using your own address:
- `https://YOUR-ADDRESS/api/auth/google/callback`
- `https://YOUR-ADDRESS/api/google/callback`

While the Google app is in Testing mode, only the test users you list can sign in. Reading Gmail for other people needs Google's app verification.

### Limits to know
- The first visit after a long idle can take about a minute while Render wakes the service.
- The free plan gives 750 instance hours a month, which covers one service running all month.
- The note-saving tool writes files to the server's disk, which Render wipes on restart. Those notes are not kept.
