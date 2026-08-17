# Alfaaz — Registration & Login

Minimal working implementation of the registration/login module discussed in the meeting.

## Stack
- **Backend:** Node.js + Express
- **DB:** SQLite (via `better-sqlite3`, zero setup, file-based at `db/alfaaz.db`)
- **Auth:** bcrypt password hashing, JWT session cookie
- **Email:** Nodemailer (falls back to logging the verification link to the console if no SMTP is configured — no email provider needed to test the flow)
- **Frontend:** Plain HTML/CSS/JS (deliberately minimal, per request)

## Setup
```bash
npm install
cp .env.example .env   # fill in SMTP_* if you want real emails sent
node server.js
```
Visit `http://localhost:3000/register.html`.

## Flow implemented
1. **Register** — two modes, toggled on the page:
   - **Individual**: name, email, phone, password.
   - **College**: college name, coordinator name/email/password, plus a repeatable list of participants (name + email each). The coordinator is the one account that logs in; participants are stored under that college's record.
2. On successful registration, a verification email is sent (or logged to console / returned in the API response in dev mode, since no SMTP is configured here).
3. User clicks the link → account marked verified.
4. **Login** is blocked with a clear error until the account is verified.
5. After login, a session cookie (JWT, httpOnly) is set; `/dashboard.html` reads `/api/auth/me` to show the logged-in user (and participant list, for colleges).

## API
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register (`role: "personal"` or `"college"`) |
| GET | `/api/auth/verify/:token` | Verify email from the link |
| POST | `/api/auth/login` | Log in (blocked if unverified) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current session info |

## What's intentionally left out (next steps)
- Password reset flow
- Rate limiting / CAPTCHA on register & login
- Editing participants after college registration
- Individual login accounts for participants added by a college
- Production-grade session handling (e.g. refresh tokens, revocation list)
- Real visual design pass on the frontend (this build is functional/minimal by request)
