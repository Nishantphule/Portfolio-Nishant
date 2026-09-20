# Nishant Phule — job-application kit

Print-perfect A4 resume/cover-letter HTML, exported PDFs, and a dark React portfolio with an Express proxy for an OpenRouter “Ask about me” chat.

## Structure

```
resume-assets/   Standalone HTML (double-click + Ctrl+P) and generated PDFs
client/          React + Vite site (Vercel / Netlify)
server/          Express API — POST /api/chat OpenRouter proxy, POST /api/contact Nodemailer
```

Content is static: resume HTML is the source of truth; the site reads [client/src/data/profile.ts](client/src/data/profile.ts). The chat system prompt lives only on the server ([server/src/systemPrompt.js](server/src/systemPrompt.js)) so visitors cannot override it.

## Run locally

Use two terminals.

**API** (port 5000):

```bash
cd server
cp .env.example .env
# paste OPENROUTER_API_KEY=sk-or-v1-...
npm install
npm run dev
```

**Site** (port 5173, `/api` proxied to the API):

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. Chat works once `OPENROUTER_API_KEY` is set. The contact form works once SMTP env vars are set (see below). Missing keys return a clear 503 instead of hanging.

## OpenRouter

| Variable | Where | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | `server/.env` | Secret. Never sent to the browser. |
| `CLIENT_ORIGIN` | `server/.env` | CORS allowlist. Dev: `http://localhost:5173`. |
| `PORT` | `server/.env` | API port, default `5000`. |
| `VITE_API_URL` | `client/.env` | Production only. Leave empty in dev (Vite proxy). Example: `https://your-api.onrender.com`. |

Model id is a constant in [server/src/config.js](server/src/config.js). Swap that string to change models. `/api/chat` is limited to 20 requests / 15 minutes / IP.

## Contact form (SMTP)

`POST /api/contact` sends you mail via Nodemailer, then a short auto-ack to the visitor. Credentials never leave the server.

| Variable | Purpose |
|---|---|
| `EMAIL_HOST` | SMTP host (Mailtrap, Ethereal, Gmail, Resend, SendGrid) |
| `EMAIL_PORT` | `587` (STARTTLS) or `465` (TLS) |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP user and password or API key |
| `EMAIL_TO` | Your inbox (default `nishantphule12@gmail.com`) |
| `EMAIL_FROM` | From header; defaults to `EMAIL_USER` |

**Local, no real inbox:** [Mailtrap](https://mailtrap.io) sandbox, or Ethereal (`npx ethereal-email` / Ethereal account). Point `EMAIL_HOST` at that sandbox.

**Gmail App Password:** Google Account → Security → 2-Step Verification → App passwords. Host `smtp.gmail.com`, port `587`, user your Gmail, pass the 16-character app password (not your login password).

**Resend / SendGrid:** use their SMTP credentials the same way (`EMAIL_HOST` + user/pass). No code change.

Anti-spam: hidden `website` honeypot (filled bots get a fake 200 and no mail); 5 requests / hour / IP; simple heuristics (too many URLs / almost no letters). WhatsApp is a client `wa.me` link from [client/src/data/profile.ts](client/src/data/profile.ts) (`919960435035`, overridable with `VITE_WHATSAPP_NUMBER`).

## Resume PDFs

Standalone files (no server):

- [resume-assets/resume-1page.html](resume-assets/resume-1page.html)
- [resume-assets/resume-2page.html](resume-assets/resume-2page.html)
- [resume-assets/cover-letter.html](resume-assets/cover-letter.html)

**Chrome Print-to-PDF:** Destination → Save as PDF · Paper size A4 · Margins Default · **uncheck Headers and footers**.

**Regenerate PDFs** (headless Chromium, no headers/footers):

```bash
cd resume-assets
npm install
npm run print
```

This writes PDFs next to the HTML and copies the two resume PDFs into `client/public/` for the Download buttons. Expected page counts: 1 / 2 / 1.

Cover letter placeholders (find-replace per application): `{{DATE}}`, `{{HIRING_MANAGER}}`, `{{COMPANY_NAME}}`, `{{ROLE_TITLE}}`, `{{WHY_THIS_COMPANY}}`, `{{TODO}}` (notice period).

## Deploy (Vercel — site + API, same origin)

One Vercel project from the **repo root** (not `client/` alone). The Vite app is the static site; Express is a serverless function at `/api/*`. Leave `VITE_API_URL` unset so the browser calls `/api/chat` and `/api/contact` on the same host.

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → Add New → Project → import the repo.
3. Framework Preset: **Other**. Root Directory: **leave empty** (repo root). `vercel.json` already sets install/build/output.
4. Environment variables (Production + Preview):

| Variable | Value |
|---|---|
| `CLIENT_ORIGIN` | Your live origin, no trailing slash — e.g. `https://your-project.vercel.app` or the custom domain |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | SMTP (Mailtrap locally; Gmail App Password / Resend / SendGrid in prod) |
| `EMAIL_TO` | `nishantphule12@gmail.com` (optional; this is the default) |
| `EMAIL_FROM` | Optional; defaults to `EMAIL_USER` |

Do **not** set `VITE_API_URL` for this setup. Do **not** commit `server/.env`.

5. Deploy. Check `https://<your-app>/api/health` → `{ "ok": true }`, then the site, chat, and contact form.

Hobby plans cap serverless functions at ~10s. Chat and SMTP usually fit; if a send times out, try a closer SMTP host or a Pro plan.

Local dev is unchanged: `server` on :5000, `client` on :5173 with the Vite `/api` proxy.

**Split hosts instead** (site on Vercel, API on Render/Railway): Root Directory `client/`, build `npm run build`, output `dist`, set `VITE_API_URL` to the API origin. On the API host: root `server/`, `npm start`, env `OPENROUTER_API_KEY`, `EMAIL_*`, `CLIENT_ORIGIN` = the Vercel origin, `PORT` as the host requires. CORS must match exactly.

## Notice period

Still `{{TODO}}` on the cover letter and in the chat prompt. Fill it when you know it; the widget will keep saying it is unknown until the server prompt is updated.
