# Chatify backend

## Local setup

1. Install Node.js 20 or newer and MongoDB (local or hosted).
2. Copy `.env.example` to `.env` and set `MONGODB_URL` and a long random `JWT_SECRET`.
3. From this directory, run `npm ci`, then `npm run dev`.
4. Run the frontend at `http://localhost:5173`. Its API defaults to `http://localhost:5000`.

Cloudinary settings enable profile and chat image uploads. `GEMINI_API_KEY` enables optional AI reply suggestions and chat summaries. The default model is `gemini-3.5-flash-lite`; availability and free-tier limits can vary. Both integrations can be left unset when unused.

## Production deployment

- Set `NODE_ENV=production`, `MONGODB_URL`, `JWT_SECRET`, and `FRONTEND_URL` in the backend service environment. `FRONTEND_URL` must be the exact HTTPS origin(s) of the deployed frontend; separate multiple origins with commas.
- Set `VITE_SERVER_URL` to the public HTTPS backend URL in the frontend build environment, then build with `npm ci && npm run build` and serve the generated `dist/` directory with SPA fallback to `index.html`.
- Deploy the backend with `npm ci && npm start`. It waits for MongoDB before opening its HTTP and Socket.IO listener. `/health` reports database readiness.
- Configure Cloudinary and Gemini credentials as backend secrets when those features are enabled. Never put provider secrets in `VITE_` variables.
- The backend uses secure, HTTP-only, cross-site cookies in production. Deploy both services over HTTPS and configure the browser-facing domains accordingly.
- Login, signup, and AI request limits are held in each backend process. If you scale the API to multiple instances, move these limits to a shared store such as Redis.

AI reply suggestions use up to the 12 most recent text messages. The draft is placed in the compose field and is not sent automatically. Chat summaries use up to the 40 most recent text messages in a conversation.
