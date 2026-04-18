# Synapse Notebook

Synapse Notebook is an AI-first knowledge workspace for reading across documents, connecting ideas, surfacing missing concepts, and turning raw source material into usable understanding.

This project is built as a split-stack application:

- `frontend/` contains the Next.js workspace UI
- `backend/` contains the Express API, document ingestion pipeline, retrieval logic, and AI orchestration

## Full Feature List

Synapse Notebook currently includes the following capabilities:

- PDF upload support
- TXT upload support
- automatic file parsing
- text normalization and chunking
- document indexing
- multi-document retrieval augmented generation
- grounded chat across selected documents
- short summaries
- key point extraction
- important concept extraction
- per-document summarization
- combined summarization across multiple documents
- study mode flashcards
- study mode MCQs
- study mode important exam questions
- cross-document insight generation
- knowledge gap detection
- auto insight feed generation
- confusion detection with simplified explanations
- concept battle mode
- knowledge fusion engine
- modular Insight Lab interface
- document selection workspace
- AI insight side rail
- browser-based podcast playback using text to speech
- responsive dashboard UI for desktop and mobile

## What The Product Does

Users upload PDF or text documents, and the system:

- parses and chunks the content
- stores indexed document data
- retrieves relevant chunks across multiple documents
- answers grounded questions with RAG
- generates summaries and study material
- detects cross-document insights and knowledge gaps
- compares concepts and fuses multiple sources into one model
- reads generated output aloud through browser-based text to speech

## Core Features

- Multi-document upload for `.pdf` and `.txt`
- Document parsing, chunking, and indexing
- Multi-document chat with retrieval augmented generation
- Smart summary engine
- Study mode with flashcards, MCQs, and exam questions
- Cross-document insight engine
- Knowledge gap detector
- Auto insight feed
- Confusion detector
- Concept battle mode
- Knowledge fusion engine
- Browser-based podcast mode using the Web Speech API

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend

- Node.js
- Express
- Multer
- PDF parsing with `pdf-parse`
- MongoDB through Mongoose

### AI And Retrieval

- OpenRouter for chat completions
- OpenRouter embeddings when available
- local embedding fallback for upload resilience

### Deployment

- Backend: Render
- Frontend: Vercel

## Project Structure

```text
frontend/
  app/
  components/
  lib/

backend/
  app/
    api/
    core/
    models/
    services/
    utils/
  data/
```

## Requirements

Before running or deploying the project, you need:

- Node.js 18+ recommended
- npm
- an OpenRouter account and API key
- a MongoDB connection string for production

MongoDB is recommended for deployment. The backend can fall back to local JSON persistence in development if MongoDB is unavailable, but production should use a real MongoDB instance.

## API And Service Setup

### 1. OpenRouter

This project uses OpenRouter for:

- LLM completions
- embeddings

How to get it:

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Create an account
3. Open the API keys page
4. Create a new API key
5. Copy that key into the backend environment as `OPENROUTER_API_KEY`

Recommended models for this project:

- Chat model: `openai/gpt-4.1-mini`
- Embedding model: `openai/text-embedding-3-small`

If your OpenRouter balance is limited, keep the token caps configured in the backend and top up credits only when needed.

### 2. MongoDB

How to get it:

1. Create an account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Add your IP or allow access as needed
5. Copy the connection string
6. Put it into the backend environment as `MONGODB_URI`

For production deployment, MongoDB Atlas is the simplest option.

### 3. Text To Speech

The podcast mode currently uses the browser's built-in Web Speech API.

That means:

- it is free
- it needs no external API key
- it runs entirely in the browser
- voice quality depends on the browser and operating system

## Environment Variables

### Backend

Create `backend/.env` from the example below.

Required:

- `OPENROUTER_API_KEY`
- `MONGODB_URI`

Recommended:

- `OPENROUTER_BASE_URL`
- `OPENROUTER_CHAT_MODEL`
- `OPENROUTER_EMBEDDING_MODEL`
- `OPENROUTER_MAX_TOKENS`
- `APP_URL`

### Frontend

Create `frontend/.env.local` or `frontend/.env`.

Required:

- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`

## Local Development

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

By default the backend runs on:

```text
http://127.0.0.1:8080
```

Useful test routes:

- `http://127.0.0.1:8080/health`
- `http://127.0.0.1:8080/api/documents`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

By default the frontend runs on:

```text
http://localhost:3000
```

The frontend is configured to proxy API calls through Next.js, which avoids browser-side CORS issues during development and deployment.

## Recommended Local Environment Files

### `backend/.env`

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/ai-notebook
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_CHAT_MODEL=openai/gpt-4.1-mini
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_MAX_TOKENS=900
APP_URL=http://localhost:3000
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=/api/proxy
BACKEND_URL=http://127.0.0.1:8080
```

## Deployment Guide

This project is designed to be deployed with:

- backend on Render
- frontend on Vercel

Deploy the backend first, then the frontend.

### Step 1: Push The Project To GitHub

Push the full repository to GitHub so both platforms can connect to it.

### Step 2: Deploy The Backend To Render

1. Open [https://render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:

- Environment: `Node`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Use `npm start`, not `npm run dev`, in production.

Add these environment variables in Render:

```env
PORT=10000
MONGODB_URI=your_mongodb_uri
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_CHAT_MODEL=openai/gpt-4.1-mini
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_MAX_TOKENS=900
APP_URL=http://localhost:3000
```

After deploy, test:

- `https://your-backend-name.onrender.com/health`
- `https://your-backend-name.onrender.com/api/documents`

If those are not working, verify:

- Root Directory is `backend`
- Start Command is `npm start`
- the latest code is deployed

### Step 3: Deploy The Frontend To Vercel

1. Open [https://vercel.com](https://vercel.com)
2. Import the same GitHub repository
3. Configure the project:

- Framework Preset: `Next.js`
- Root Directory: `frontend`

Add these environment variables in Vercel:

```env
NEXT_PUBLIC_API_URL=/api/proxy
BACKEND_URL=https://your-backend-name.onrender.com
```

Important:

- `BACKEND_URL` must be the Render base URL
- do not add `/api` to `BACKEND_URL`
- keep `NEXT_PUBLIC_API_URL=/api/proxy`

Deploy the frontend.

### Step 4: Update Render After Vercel Deploys

Once Vercel gives you the production frontend URL, go back to Render and update:

```env
APP_URL=https://your-frontend-name.vercel.app
```

If you want both local development and production allowed:

```env
APP_URL=http://localhost:3000,https://your-frontend-name.vercel.app
```

Save the environment variables and redeploy the backend if needed.

## Why The Frontend Uses A Proxy

The frontend uses a Next.js proxy route so the browser talks to the frontend app, and the frontend app forwards requests to the backend. This helps avoid common issues with:

- local development networking
- CORS
- inconsistent browser access to `localhost` or `127.0.0.1`

## Available Backend Routes

- `GET /health`
- `GET /api/documents`
- `GET /api/documents/:id`
- `POST /api/documents/upload`
- `POST /api/chat`
- `POST /api/summaries`
- `POST /api/study`
- `POST /api/insights/cross-doc`
- `POST /api/insights/feed`
- `POST /api/gaps`
- `POST /api/fusion`
- `POST /api/battle`
- `POST /api/confusions`

## Notes On Cost And Token Limits

OpenRouter usage depends on your account credits and chosen model. The backend is configured with smaller token caps to reduce failures and keep costs more predictable.

If you want to tune output length, use:

```env
OPENROUTER_MAX_TOKENS=900
```

Increase only if you have enough credits and need longer outputs.

## Troubleshooting

### Upload works but AI actions fail

Common causes:

- missing `OPENROUTER_API_KEY`
- insufficient OpenRouter credits
- invalid or unreachable model name

### `Cannot reach API` from the frontend

Check:

- frontend is running
- backend is running
- `NEXT_PUBLIC_API_URL=/api/proxy`
- `BACKEND_URL` points to the correct backend base URL

### `Cannot GET /api`

That is expected. There is no root `GET /api` route.

Use:

- `/health`
- `/api/documents`

### `AI returned invalid JSON`

This usually means the model response was cut off or wrapped in formatting. The backend strips common markdown fences, but the safest fix is to:

- keep token caps moderate
- keep prompts concise
- retry the specific module



