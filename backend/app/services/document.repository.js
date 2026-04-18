import crypto from 'crypto';
import mongoose from 'mongoose';
import { getConnectionMode } from '../core/database.js';
import { DocumentModel } from '../models/document.model.js';
import { ChunkModel } from '../models/chunk.model.js';
import { readStore, writeStore } from './file-store.service.js';

const withIds = (document) => ({
  ...document,
  id: String(document._id || document.id),
});

export const createDocumentWithChunks = async ({ document, chunks }) => {
  if (getConnectionMode() === 'mongo') {
    const created = await DocumentModel.create(document);
    await ChunkModel.insertMany(
      chunks.map((chunk) => ({
        ...chunk,
        documentId: created._id,
      })),
    );
    return withIds(created.toObject());
  }

  const store = await readStore();
  const id = crypto.randomUUID();
  const storedDocument = {
    ...document,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.documents.unshift(storedDocument);
  store.chunks.push(
    ...chunks.map((chunk) => ({
      ...chunk,
      id: crypto.randomUUID(),
      documentId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  );
  await writeStore(store);
  return storedDocument;
};

export const listDocuments = async () => {
  if (getConnectionMode() === 'mongo') {
    const documents = await DocumentModel.find().sort({ createdAt: -1 }).lean();
    return documents.map(withIds);
  }

  const store = await readStore();
  return store.documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getDocumentById = async (id) => {
  if (getConnectionMode() === 'mongo') {
    const document = await DocumentModel.findById(id).lean();
    return document ? withIds(document) : null;
  }

  const store = await readStore();
  return store.documents.find((item) => item.id === id) || null;
};

export const getChunksByDocumentIds = async (documentIds = []) => {
  if (getConnectionMode() === 'mongo') {
    const normalizedIds = documentIds.length
      ? documentIds.map((id) => new mongoose.Types.ObjectId(id))
      : undefined;
    const query = normalizedIds ? { documentId: { $in: normalizedIds } } : {};
    const chunks = await ChunkModel.find(query).lean();
    return chunks.map((chunk) => ({
      ...chunk,
      id: String(chunk._id),
      documentId: String(chunk.documentId),
    }));
  }

  const store = await readStore();
  if (!documentIds.length) {
    return store.chunks;
  }

  return store.chunks.filter((chunk) => documentIds.includes(chunk.documentId));
};

export const updateDocumentSummary = async (id, summary) => {
  if (getConnectionMode() === 'mongo') {
    const updated = await DocumentModel.findByIdAndUpdate(id, { summary }, { new: true }).lean();
    return updated ? withIds(updated) : null;
  }

  const store = await readStore();
  const document = store.documents.find((item) => item.id === id);
  if (!document) {
    return null;
  }
  document.summary = summary;
  document.updatedAt = new Date().toISOString();
  await writeStore(store);
  return document;
};
