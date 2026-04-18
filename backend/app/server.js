import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './core/database.js';
import { apiRouter } from './api/routes/index.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const allowedOrigins = process.env.APP_URL?.split(',').map((value) => value.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (_req, res) => {
  res.json({ ok: true, service: 'ai-notebook-backend', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Unexpected server error',
    details: error.details || null,
  });
});

const start = async () => {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`AI Notebook backend listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
