import { app } from './app.js';
import { config } from './config.js';

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Portfolio API on http://localhost:${config.port}`);
  });
}

export default app;
