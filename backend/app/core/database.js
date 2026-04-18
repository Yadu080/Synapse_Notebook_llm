import mongoose from 'mongoose';

let connectionMode = 'memory';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MONGODB_URI not set. Using local file persistence.');
    return connectionMode;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    connectionMode = 'mongo';
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB unavailable, using local file persistence.', error.message);
    connectionMode = 'memory';
  }

  return connectionMode;
};

export const getConnectionMode = () => connectionMode;
