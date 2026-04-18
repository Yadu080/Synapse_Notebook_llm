import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    index: { type: Number, required: true },
    tokenEstimate: { type: Number, default: 0 },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

chunkSchema.index({ documentId: 1, index: 1 }, { unique: true });

export const ChunkModel = mongoose.models.Chunk || mongoose.model('Chunk', chunkSchema);
