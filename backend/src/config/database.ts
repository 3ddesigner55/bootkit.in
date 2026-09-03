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

  // Configure database connection so autoIndex is false by default.
  // Permit autoIndex only through an explicit non-production test environment flag.
  // Never allow automatic index creation in production.
  const allowAutoIndex = process.env.ALLOW_AUTO_INDEX === 'true' && process.env.NODE_ENV !== 'production';
  mongoose.set('autoIndex', allowAutoIndex);

  connectionPromise = mongoose
    .connect(mongoUri, {
      dbName: databaseName,
      autoIndex: allowAutoIndex,
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