import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';

const port = Number(process.env.PORT ?? 4000);

async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(port, () => {
    console.info(`BootKit API is running on port ${port}`);
  });
}

void startServer();
