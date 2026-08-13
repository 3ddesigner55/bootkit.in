import mongoose from 'mongoose';

let connectionPromise: Promise<void> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  const databaseName = process.env.DB_NAME;

  if (!mongoUri || !databaseName) {
    throw new Error(
      'MONGODB_URI and DB_NAME environment variables are required.',
    );
  }

  connectionPromise = mongoose
    .connect(mongoUri, {
      dbName: databaseName,
    })
    .then(() => {
      console.info('MongoDB connected');
    })
    .catch((error: unknown) => {
      connectionPromise = null;
      console.error('MongoDB connection error:', error);
      throw error;
    });

  return connectionPromise;
}