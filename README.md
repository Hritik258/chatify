# Chatify

Chatify is a responsive, real-time messaging app built with React, Express, MongoDB, and Socket.IO. It supports direct and group conversations, live typing and read states, message editing, deletion and reactions, in-chat search, image sharing, and optional Gemini reply suggestions and chat summaries.

## Run locally

Use Node.js 20.19+ or 22.12+. Start MongoDB, then open two terminals:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
```

Set `MONGODB_URL` and `JWT_SECRET` in `backend/.env`. Then:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

The frontend is served at `http://localhost:5173` and the API at `http://localhost:5000` by default. Add `GEMINI_API_KEY` to `backend/.env` to enable AI reply suggestions and summaries; free-tier quotas and availability depend on the provider.

## Production

See [backend/README.md](backend/README.md) for required backend and frontend environment settings, HTTPS cookie behavior, and deployment commands. The backend `/health` route reports MongoDB readiness. Keep all database, JWT, Cloudinary, and Gemini secrets on the backend.

## Quality checks

```powershell
cd frontend
npm run lint
npm run build
```
