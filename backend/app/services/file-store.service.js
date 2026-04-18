import fs from 'fs/promises';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'store.json');

const baseState = {
  documents: [],
  chunks: [],
};

const ensureStore = async () => {
  try {
    await fs.access(dbPath);
  } catch {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(baseState, null, 2));
  }
};

export const readStore = async () => {
  await ensureStore();
  const content = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(content);
};

export const writeStore = async (data) => {
  await ensureStore();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};
