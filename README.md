# Synapse Notebook

Synapse Notebook is an AI-first knowledge workspace for reading across documents, connecting ideas, surfacing missing concepts, and turning raw source material into usable understanding.

The product is designed as a split-stack application:

- `frontend/` contains the Next.js workspace UI
- `backend/` contains the Express API, document ingestion pipeline, retrieval logic, and AI orchestration

## Overview

The system accepts PDF and text documents, parses and chunks their contents, stores indexed knowledge, and enables a set of higher-level reasoning workflows on top of that document base.

Instead of behaving like a single-turn chatbot, the workspace is structured around deeper knowledge operations:

- multi-document retrieval augmented generation
- structured summarization
- study material generation
- cross-document insight discovery
- knowledge gap detection
- confusion detection
- concept comparison
- knowledge fusion

The result is a workspace aimed at helping users build understanding across multiple sources rather than only query isolated snippets.

## Product Capabilities

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

## Technology Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend

- Node.js
- Express
- Multer
- `pdf-parse`
- Mongoose

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

## Architecture Notes

The backend handles:

- ingestion of uploaded PDF and text files
- text normalization and chunking
- embedding generation
- retrieval over indexed chunks
- orchestration of OpenRouter prompts for summaries, insights, study outputs, and fusion workflows

The frontend handles:

- document selection and workspace navigation
- RAG chat and structured result rendering
- modular Insight Lab workflows
- podcast playback through browser-native speech synthesis
- proxying API requests through Next.js for cleaner local and deployed networking

## External Services

### OpenRouter

OpenRouter is used for:

- LLM completions
- embeddings

An OpenRouter account and API key are required for full AI functionality. Uploading remains resilient because the backend includes a local embedding fallback, but chat, summaries, insights, and study generation still depend on a valid OpenRouter API key.

Recommended models:

- Chat model: `openai/gpt-4.1-mini`
- Embedding model: `openai/text-embedding-3-small`

OpenRouter:

- Site: [https://openrouter.ai](https://openrouter.ai)
- API keys: available through the OpenRouter dashboard after account creation

### MongoDB

MongoDB is recommended for deployment and persistent storage.

The backend can fall back to local JSON persistence during development if MongoDB is unavailable, but production deployments should use a real MongoDB instance such as MongoDB Atlas.

MongoDB Atlas:

- Site: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Required setup: cluster, database user, and connection string

### Text To Speech

Podcast mode uses the browser's built-in Web Speech API.

That means:

- no external API key is required
- no paid TTS provider is required
- output quality depends on the browser and operating system voice set

## Environment Variables

### Backend

The backend expects the following values:

- `PORT`
- `MONGODB_URI`
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_CHAT_MODEL`
- `OPENROUTER_EMBEDDING_MODEL`
- `OPENROUTER_MAX_TOKENS`
- `APP_URL`

Example backend environment:

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

### Frontend

The frontend expects:

- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`

Example frontend environment:

```env
NEXT_PUBLIC_API_URL=/api/proxy
BACKEND_URL=http://127.0.0.1:8080
```

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Default local backend URL:

```text
http://127.0.0.1:8080
```

Useful routes:

- `http://127.0.0.1:8080/health`
- `http://127.0.0.1:8080/api/documents`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default local frontend URL:

```text
http://localhost:3000
```

The frontend proxies API calls through Next.js, which helps avoid browser-side CORS issues in both local development and deployment.

## Deployment Guide

This project is intended to run with:

- backend on Render
- frontend on Vercel

The cleanest deployment order is:

1. deploy backend
2. copy backend URL
3. deploy frontend
4. update backend `APP_URL` with the final frontend domain

### Backend Deployment On Render

Create a Render Web Service with the following configuration:

- Environment: `Node`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Production should use `npm start`, not `npm run dev`.

Suggested Render environment values:

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

Once deployed, the following routes should be available:

- `https://your-backend-name.onrender.com/health`
- `https://your-backend-name.onrender.com/api/documents`

If those routes return `Not Found`, common causes are:

- incorrect Render root directory
- incorrect start command
- outdated deployment
- wrong repository or branch configuration

### Frontend Deployment On Vercel

Create a Vercel project with:

- Framework Preset: `Next.js`
- Root Directory: `frontend`

Suggested Vercel environment values:

```env
NEXT_PUBLIC_API_URL=/api/proxy
BACKEND_URL=https://your-backend-name.onrender.com
```

Important:

- `BACKEND_URL` should be the Render base URL
- `BACKEND_URL` should not include `/api`
- `NEXT_PUBLIC_API_URL` should remain `/api/proxy`

### Final Production Wiring

After Vercel provides the deployed frontend URL, the backend `APP_URL` on Render should be updated to match it.

Example:

```env
APP_URL=https://your-frontend-name.vercel.app
```

If both local and deployed frontend origins need to be allowed:

```env
APP_URL=http://localhost:3000,https://your-frontend-name.vercel.app
```

## Why The Frontend Uses A Proxy

The frontend includes a Next.js proxy route so the browser talks to the frontend application, and the frontend forwards requests to the backend server.

This simplifies:

- local development
- browser networking differences between `localhost` and `127.0.0.1`
- CORS handling
- deployment configuration across Vercel and Render

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

## Operational Notes

### Token Limits And Cost Control

The backend uses conservative token caps to reduce OpenRouter credit failures and improve structured JSON reliability.

The default cap can be tuned through:

```env
OPENROUTER_MAX_TOKENS=900
```

### Development Fallback Behavior

If OpenRouter embeddings are unavailable, the backend falls back to a deterministic local embedding generator so uploads remain usable.

This improves development resilience, but full AI generation still requires a valid OpenRouter API key.

## Troubleshooting

### Upload succeeds but AI actions fail

Common causes:

- missing `OPENROUTER_API_KEY`
- insufficient OpenRouter credits
- invalid model configuration
- truncated JSON responses from the model

### `Cannot reach API` from the frontend

Typical causes:

- frontend is running against the wrong environment variables
- backend is not reachable from the configured proxy target
- `NEXT_PUBLIC_API_URL` is pointing directly at a backend URL instead of `/api/proxy`

### `Cannot GET /api`

That is expected. There is no root `GET /api` route.

Use:

- `/health`
- `/api/documents`

### `AI returned invalid JSON`

This usually indicates that the model response was truncated or did not return the required JSON shape. Smaller output budgets and stricter prompts have been used in this project to reduce that failure mode.

## Repository Use

This repository is suitable for:

- portfolio review
- hackathon demos
- recruiter and hiring-manager evaluation
- adaptation into a production-grade AI document reasoning product

## License
