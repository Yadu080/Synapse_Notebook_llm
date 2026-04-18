import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '../../utils/errors.js';
import {
  answerQuestion,
  battleConcepts,
  detectConfusions,
  fetchDocument,
  fetchDocuments,
  generateCrossDocumentInsights,
  generateInsightFeed,
  generateKnowledgeFusion,
  generateKnowledgeGaps,
  generateStudyMode,
  ingestDocument,
  summarizeDocuments,
} from '../../services/document.service.js';

const uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) =>
    callback(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});

const isSupportedUpload = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  return ['.pdf', '.txt'].includes(extension) || ['application/pdf', 'text/plain'].includes(file.mimetype);
};

const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    if (isSupportedUpload(file)) {
      callback(null, true);
      return;
    }
    callback(new AppError('Only PDF and text files are supported.', 400));
  },
});

export const apiRouter = Router();

apiRouter.get('/documents', async (_req, res, next) => {
  try {
    res.json(await fetchDocuments());
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/documents/:id', async (req, res, next) => {
  try {
    res.json(await fetchDocument(req.params.id));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/documents/upload', upload.single('file'), async (req, res, next) => {
  try {
    res.status(201).json(await ingestDocument(req.file));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/chat', async (req, res, next) => {
  try {
    res.json(await answerQuestion(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/summaries', async (req, res, next) => {
  try {
    res.json(await summarizeDocuments(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/study', async (req, res, next) => {
  try {
    res.json(await generateStudyMode(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/insights/cross-doc', async (req, res, next) => {
  try {
    res.json(await generateCrossDocumentInsights(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/gaps', async (req, res, next) => {
  try {
    res.json(await generateKnowledgeGaps(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/insights/feed', async (req, res, next) => {
  try {
    res.json(await generateInsightFeed(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/battle', async (req, res, next) => {
  try {
    res.json(await battleConcepts(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/fusion', async (req, res, next) => {
  try {
    res.json(await generateKnowledgeFusion(req.body));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/confusions', async (req, res, next) => {
  try {
    res.json(await detectConfusions(req.body));
  } catch (error) {
    next(error);
  }
});
