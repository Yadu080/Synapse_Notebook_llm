import { ChatResponse, DocumentItem } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
const fallbackErrorMessage = 'Request failed';

const extractErrorMessage = (rawText: string, status: number) => {
  if (!rawText) {
    return `Request failed with status ${status}`;
  }

  try {
    const data = JSON.parse(rawText);

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    return fallbackErrorMessage;
  } catch {
    return rawText;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(`Cannot reach API at ${API_URL}. Make sure the frontend and backend servers are running.`);
  }

  if (!response.ok) {
    const rawText = await response.text();
    throw new Error(extractErrorMessage(rawText, response.status));
  }

  const rawText = await response.text();

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(
      `API returned malformed JSON for ${path}. This usually means the server response was truncated or corrupted.`,
    );
  }
};

export const api = {
  listDocuments: () => request<DocumentItem[]>('/documents'),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<DocumentItem>('/documents/upload', { method: 'POST', body: form });
  },
  chat: (payload: { question: string; documentIds: string[] }) =>
    request<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(payload) }),
  summarize: (payload: { documentIds: string[] }) =>
    request<{
      shortSummary: string;
      keyPoints: string[];
      concepts: string[];
    }>('/summaries', { method: 'POST', body: JSON.stringify(payload) }),
  study: (payload: { documentIds: string[] }) =>
    request<{
      flashcards: { question: string; answer: string }[];
      mcqs: { question: string; options: string[]; answer: string; explanation: string }[];
      examQuestions: string[];
    }>('/study', { method: 'POST', body: JSON.stringify(payload) }),
  crossInsights: (payload: { documentIds: string[] }) =>
    request<{
      insights: { title: string; insight: string; evidence: string; impact: string }[];
      themes: string[];
    }>('/insights/cross-doc', { method: 'POST', body: JSON.stringify(payload) }),
  gaps: (payload: { documentIds: string[] }) =>
    request<{
      readinessScore: number;
      gaps: { concept: string; whyItMatters: string; recommendedNextStep: string }[];
    }>('/gaps', { method: 'POST', body: JSON.stringify(payload) }),
  feed: (payload: { documentIds: string[] }) =>
    request<{
      feed: { title: string; type: string; summary: string; action: string }[];
      emergingQuestions: string[];
    }>('/insights/feed', { method: 'POST', body: JSON.stringify(payload) }),
  battle: (payload: { conceptA: string; conceptB: string; documentIds: string[] }) =>
    request<{
      overview: string;
      differences: string[];
      useCases: { concept: string; bestFor: string }[];
      decisionRule: string;
    }>('/battle', { method: 'POST', body: JSON.stringify(payload) }),
  fusion: (payload: { documentIds: string[] }) =>
    request<{
      unifiedModel: string;
      pillars: string[];
      synthesisSteps: string[];
    }>('/fusion', { method: 'POST', body: JSON.stringify(payload) }),
  confusions: (payload: { documentIds: string[] }) =>
    request<{
      confusions: {
        topic: string;
        whyConfusing: string;
        simpleExplanation: string;
        mentalModel: string;
      }[];
    }>('/confusions', { method: 'POST', body: JSON.stringify(payload) }),
};
