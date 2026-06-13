# SoCal Solar Pro — Leads Dashboard

Next.js lead management dashboard. Hosted on **Vercel**. Backend API runs on Google Cloud Functions.

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

Sign in with the team password.

## Environment variables

Copy `.env.local.example` to `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Business name shown in header |
| `NEXT_PUBLIC_APP_SUBTITLE` | Subtitle (e.g. "Leads Center") |
| `NEXT_PUBLIC_API_URL` | Leads API cloud function URL |
| `NEXT_PUBLIC_STORAGE_KEY` | localStorage key for auth token |

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com) — set **Root Directory** to `frontend`
3. Add the environment variables from `.env.local.example`
4. Deploy

After deploying, redeploy the leads API so CORS allows your Vercel URL:

```bash
cd backend
npm run deploy:leads-api
```

Vercel `*.vercel.app` domains are already allowed by the API.

## Reusing for other businesses

Duplicate the `frontend` folder, update `.env.local` with the new business name and API URL. Each business can have its own Vercel project pointing at the same or different backend.
