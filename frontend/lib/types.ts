export type DocumentItem = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  wordCount: number;
  chunkCount: number;
  createdAt?: string;
  metadata?: {
    pages?: number;
    sourceType?: string;
  };
  summary?: {
    short?: string;
    keyPoints?: string[];
    concepts?: string[];
  };
};

export type SourceChunk = {
  id: string;
  documentId: string;
  content: string;
  score: number;
};

export type ChatResponse = {
  answer: string;
  sources: SourceChunk[];
};
