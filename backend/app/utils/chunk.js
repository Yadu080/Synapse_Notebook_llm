export const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

export const splitIntoChunks = (text, chunkSize = 1100, overlap = 180) => {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const slice = normalized.slice(start, end);
    chunks.push(slice);

    if (end === normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

export const estimateTokens = (text) => Math.ceil(text.split(/\s+/).length * 1.3);
