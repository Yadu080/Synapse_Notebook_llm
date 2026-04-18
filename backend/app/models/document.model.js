import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    summary: {
      short: String,
      keyPoints: [String],
      concepts: [String],
    },
    metadata: {
      pages: Number,
      sourceType: String,
    },
  },
  { timestamps: true },
);

export const DocumentModel =
  mongoose.models.Document || mongoose.model('Document', documentSchema);
