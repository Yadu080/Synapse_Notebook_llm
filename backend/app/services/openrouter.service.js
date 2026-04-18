import { AppError } from '../utils/errors.js';

const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const localEmbeddingSize = 256;
const defaultMaxTokens = Number(process.env.OPENROUTER_MAX_TOKENS || 900);

const buildLocalEmbedding = (input) => {
  const vector = Array.from({ length: localEmbeddingSize }, () => 0);
  const text = String(input || '').toLowerCase();

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    const slot = code % localEmbeddingSize;
    vector[slot] += ((code % 31) + 1) / 31;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
};

const getHeaders = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AppError('OPENROUTER_API_KEY is required', 500);
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
    'X-Title': 'AI Notebook Workspace',
  };
};

export const createEmbedding = async (input) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return buildLocalEmbedding(input);
  }

  try {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
        input,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('OpenRouter embeddings unavailable, using local fallback.', text);
      return buildLocalEmbedding(input);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.warn('Embedding request failed, using local fallback.', error.message);
    return buildLocalEmbedding(input);
  }
};

export const createChatCompletion = async (messages, options = {}) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AppError(
      'OPENROUTER_API_KEY is required for chat, summaries, and insight generation. Upload now works with local embeddings, but AI generation still needs the key.',
      500,
    );
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: options.model || process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-4.1-mini',
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? defaultMaxTokens,
      response_format: options.responseFormat,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError('Failed to generate AI response', response.status, text);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};
