import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  const databaseName = process.env.DB_NAME;

  if (!mongoUri || !databaseName) {
    const error = new Error(
      'MONGODB_URI and DB_NAME environment variables are required.',
    );

    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: databaseName,
    });

    console.info('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
