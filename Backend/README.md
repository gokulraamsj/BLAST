# BLAST — Backend

FastAPI backend for the BLAST symposium site: a registration API backed by
SQLite, plus a password-protected admin dashboard to view and export entries.

## What it does

- `POST /api/register` — accepts a registration (name, email, phone, college,
  year, selected events, optional team info), stores it, rejects duplicate
  emails.
- `GET /api/events` — returns the valid event codes/names (keep in sync with
  the event cards on the frontend).
- `GET /api/stats` — total registration count (handy if you want a live
  counter on the site later).
- `GET /admin` — HTML dashboard listing every registration. Protected by
  HTTP Basic Auth (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).
- `GET /admin/export.csv` — downloads all registrations as CSV. Same auth.

## Run locally

```bash
cd blast-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit ADMIN_USERNAME / ADMIN_PASSWORD
uvicorn main:app --reload
```

API is now at `http://127.0.0.1:8000`, interactive docs at
`http://127.0.0.1:8000/docs`, admin dashboard at
`http://127.0.0.1:8000/admin`.

A `registrations.db` SQLite file is created automatically on first run.

## Wiring up the frontend

In `script.js`, set `API_BASE` to wherever this backend ends up running
(`http://127.0.0.1:8000` while testing locally, your Render URL once
deployed). The registration form posts to `${API_BASE}/api/register`.

## Deploying (Render)

1. Push this `blast-backend` folder to your GitHub repo (can live alongside
   the frontend, in its own subfolder).
2. On [render.com](https://render.com): **New → Web Service**, connect the
   repo, set the root directory to `blast-backend` if it's a subfolder.
3. Render will pick up `render.yaml` automatically, or set manually:
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in the Render dashboard: `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, `ALLOWED_ORIGINS` (your GitHub Pages URL, e.g.
   `https://yourusername.github.io`).
5. Once deployed, update `API_BASE` in `script.js` to your Render URL and
   push the frontend update.

**Note on data persistence:** Render's free-tier filesystem is ephemeral —
the SQLite file resets on redeploy or when the service spins down. Fine for
testing; for the real event, either upgrade to a Render disk or point
`DATABASE_URL` at a managed Postgres instance (Render has a free Postgres
tier). No code changes needed — `database.py` already reads `DATABASE_URL`
if it's set.

## Security notes

- Change `ADMIN_PASSWORD` from the default before deploying — don't leave
  it as `changeme`.
- `ALLOWED_ORIGINS` should list your actual frontend domain, not `*`, once
  you're live — otherwise any site can submit registrations to your API.
- Basic Auth sends credentials on every request; since Render serves over
  HTTPS by default this is fine, but don't put the admin link somewhere
  public.
