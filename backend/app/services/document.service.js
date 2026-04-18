import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import { createEmbedding, createChatCompletion } from './openrouter.service.js';
import {
  createDocumentWithChunks,
  getChunksByDocumentIds,
  getDocumentById,
  listDocuments,
  updateDocumentSummary,
} from './document.repository.js';
import { estimateTokens, normalizeWhitespace, splitIntoChunks } from '../utils/chunk.js';
import { cosineSimilarity } from '../utils/similarity.js';
import { AppError } from '../utils/errors.js';

const uploadsPath = path.resolve(process.cwd(), 'data', 'uploads');

const getSourceType = (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (file.mimetype === 'application/pdf' || extension === '.pdf') {
    return 'pdf';
  }

  if (file.mimetype === 'text/plain' || extension === '.txt') {
    return 'text';
  }

  return 'unknown';
};

const parseFile = async (file) => {
  const raw = await fs.readFile(file.path);
  const sourceType = getSourceType(file);

  if (sourceType === 'pdf') {
    const parsed = await pdf(raw);
    return {
      text: normalizeWhitespace(parsed.text),
      metadata: { pages: parsed.numpages, sourceType: 'pdf' },
    };
  }

  if (sourceType !== 'text') {
    throw new AppError('Unsupported file type. Please upload a PDF or TXT file.', 400);
  }

  return {
    text: normalizeWhitespace(raw.toString('utf8')),
    metadata: { pages: 1, sourceType: 'text' },
  };
};

const buildJsonPrompt = (instruction, context) => [
  {
    role: 'system',
    content:
      'You are an elite research copilot. Always return valid JSON only, with no markdown fencing.',
  },
  {
    role: 'user',
    content: `${instruction}\n\nContext:\n${context}`,
  },
];

const unwrapJsonResponse = (value) => {
  const trimmed = String(value || '').trim();

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }

  return trimmed;
};

const safeJson = (value) => {
  try {
    return JSON.parse(unwrapJsonResponse(value));
  } catch (error) {
    const preview = unwrapJsonResponse(value).slice(0, 1200);
    throw new AppError('AI returned invalid JSON', 500, {
      preview,
      note: 'The model returned malformed or truncated JSON. Output was shortened in the error payload.',
    });
  }
};

export const ingestDocument = async (file) => {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  await fs.mkdir(uploadsPath, { recursive: true });

  const { text, metadata } = await parseFile(file);

  if (!text) {
    throw new AppError('No readable content found in the uploaded file', 400);
  }

  const chunkContents = splitIntoChunks(text);
  const embeddings = await Promise.all(chunkContents.map((chunk) => createEmbedding(chunk)));

  const document = await createDocumentWithChunks({
    document: {
      title: file.originalname.replace(/\.[^.]+$/, ''),
      filename: file.originalname,
      mimeType: file.mimetype || getSourceType(file),
      wordCount: text.split(/\s+/).length,
      chunkCount: chunkContents.length,
      metadata,
    },
    chunks: chunkContents.map((content, index) => ({
      content,
      index,
      tokenEstimate: estimateTokens(content),
      embedding: embeddings[index],
    })),
  });

  return document;
};

export const fetchDocuments = listDocuments;

export const fetchDocument = async (id) => {
  const document = await getDocumentById(id);
  if (!document) {
    throw new AppError('Document not found', 404);
  }
  return document;
};

export const retrieveRelevantChunks = async ({ query, documentIds = [], limit = 8 }) => {
  const chunks = await getChunksByDocumentIds(documentIds);

  if (!chunks.length) {
    throw new AppError('Upload documents before running AI analysis.', 400);
  }

  const queryEmbedding = await createEmbedding(query);

  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};

export const answerQuestion = async ({ question, documentIds = [] }) => {
  const chunks = await retrieveRelevantChunks({ query: question, documentIds, limit: 10 });
  const context = chunks
    .map(
      (chunk, index) =>
        `[Chunk ${index + 1} | Document ${chunk.documentId} | Score ${chunk.score.toFixed(3)}]\n${chunk.content}`,
    )
    .join('\n\n');

  const answer = await createChatCompletion(
    [
      {
        role: 'system',
        content:
          'Answer only from the provided context. If the context is insufficient, say exactly what is missing. Cite document ids inline when helpful.',
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nContext:\n${context}`,
      },
    ],
    { temperature: 0.2, maxTokens: 700 },
  );

  return { answer, sources: chunks };
};

export const summarizeDocuments = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for summarization.', 400);
  }

  const context = chunks.slice(0, 18).map((chunk) => chunk.content).join('\n\n');
  const result = safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Generate a JSON object with keys: shortSummary (string), keyPoints (array of strings), concepts (array of strings). Keep it concise and grounded in the content.',
        context,
      ),
      { temperature: 0.3, maxTokens: 650 },
    ),
  );

  if (documentIds.length === 1) {
    await updateDocumentSummary(documentIds[0], {
      short: result.shortSummary,
      keyPoints: result.keyPoints,
      concepts: result.concepts,
    });
  }

  return result;
};

export const generateStudyMode = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for study mode.', 400);
  }
  const context = chunks.slice(0, 16).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Generate compact study material as JSON with keys: flashcards (exactly 4 items, each {question, answer}), mcqs (exactly 3 items, each {question, options, answer, explanation}), examQuestions (exactly 4 strings). Keep each item concise.',
        context,
      ),
      { temperature: 0.4, maxTokens: 800 },
    ),
  );
};

export const generateCrossDocumentInsights = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for insight generation.', 400);
  }
  const context = chunks.slice(0, 18).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Find meaningful cross-document connections. Return compact JSON with keys: insights (exactly 3 items of {title, insight, evidence, impact}) and themes (exactly 4 short strings). Keep each field concise and specific.',
        context,
      ),
      { temperature: 0.5, maxTokens: 650 },
    ),
  );
};

export const generateKnowledgeGaps = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for gap detection.', 400);
  }
  const context = chunks.slice(0, 18).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Identify missing concepts for full understanding. Return compact JSON with keys: gaps (exactly 4 items of {concept, whyItMatters, recommendedNextStep}) and readinessScore (number from 0 to 100). Keep each explanation brief.',
        context,
      ),
      { temperature: 0.4, maxTokens: 550 },
    ),
  );
};

export const generateInsightFeed = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for the insight feed.', 400);
  }
  const context = chunks.slice(0, 20).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Generate a proactive insight feed. Return compact JSON with keys: feed (exactly 4 items of {title, type, summary, action}) and emergingQuestions (exactly 3 short strings). Keep each field concise.',
        context,
      ),
      { temperature: 0.6, maxTokens: 650 },
    ),
  );
};

export const battleConcepts = async ({ conceptA, conceptB, documentIds = [] }) => {
  if (!conceptA || !conceptB) {
    throw new AppError('Both concepts are required for battle mode.', 400);
  }

  const chunks = await retrieveRelevantChunks({
    query: `${conceptA} versus ${conceptB} differences use cases tradeoffs`,
    documentIds,
    limit: 10,
  });
  const context = chunks.map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        `Compare "${conceptA}" and "${conceptB}". Return JSON with keys: overview (string), differences (array of strings), useCases (array of {concept, bestFor}), decisionRule (string).`,
        context,
      ),
      { temperature: 0.3, maxTokens: 750 },
    ),
  );
};

export const generateKnowledgeFusion = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for knowledge fusion.', 400);
  }
  const context = chunks.slice(0, 22).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Merge these documents into one unified understanding. Return JSON with keys: unifiedModel (string), pillars (array of strings), synthesisSteps (array of strings).',
        context,
      ),
      { temperature: 0.4, maxTokens: 750 },
    ),
  );
};

export const detectConfusions = async ({ documentIds = [] }) => {
  const chunks = await getChunksByDocumentIds(documentIds);
  if (!chunks.length) {
    throw new AppError('No document content available for confusion detection.', 400);
  }
  const context = chunks.slice(0, 18).map((chunk) => chunk.content).join('\n\n');

  return safeJson(
    await createChatCompletion(
      buildJsonPrompt(
        'Detect likely confusing concepts and simplify them. Return compact JSON with keys: confusions (exactly 4 items of {topic, whyConfusing, simpleExplanation, mentalModel}). Keep every field concise and readable.',
        context,
      ),
      { temperature: 0.4, maxTokens: 650 },
    ),
  );
};
