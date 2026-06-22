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
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps Places (address autocomplete in lead drawer) |

## Deploy to Vercel

Production dashboard: [https://scsp-dashboard.vercel.app](https://scsp-dashboard.vercel.app)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com) — set **Root Directory** to `frontend`
3. Add the environment variables from `.env.local.example`
4. **Redeploy** after adding or changing any `NEXT_PUBLIC_*` variable (Next.js bakes them in at build time)

### Google Maps address autocomplete

If autocomplete works on `localhost` but not on Vercel, fix both of these:

1. **Vercel** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be set for **Production**, then trigger a new deployment.
2. **Google Cloud Console** → APIs & Services → Credentials → your Maps key → **Application restrictions** → HTTP referrers. Add:
   - `https://scsp-dashboard.vercel.app/*`
   - `https://*.vercel.app/*` (optional, for preview deploys)
   - `http://localhost:*`
   - `https://socalsolarpro.com/*` and `https://www.socalsolarpro.com/*` (website forms)

Ensure **Places API** and **Maps JavaScript API** are enabled for the project.

After deploying, redeploy the leads API so CORS allows your Vercel URL:

```bash
cd backend
npm run deploy:leads-api
```

Vercel `*.vercel.app` domains are already allowed by the API.

## Reusing for other businesses

Duplicate the `frontend` folder, update `.env.local` with the new business name and API URL. Each business can have its own Vercel project pointing at the same or different backend.
