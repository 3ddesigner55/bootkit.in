import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

const port = env.PORT;

async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(port, () => {
    console.info(`BootKit API is running on port ${port}`);
  });
}

void startServer();
