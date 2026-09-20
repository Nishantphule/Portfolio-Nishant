import 'dotenv/config';

const emailPort = Number(process.env.EMAIL_PORT) || 587;

export const config = {
  port: Number(process.env.PORT) || 5000,
  openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173',
  /** Cheap/fast OpenRouter model — swap here without touching the route. */
  openRouterModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  openRouterUrl: 'https://openrouter.ai/api/v1/chat/completions',
  email: {
    host: process.env.EMAIL_HOST?.trim() || '',
    port: emailPort,
    user: process.env.EMAIL_USER?.trim() || '',
    pass: process.env.EMAIL_PASS?.trim() || '',
    to: process.env.EMAIL_TO?.trim() || 'nishantphule12@gmail.com',
    from: process.env.EMAIL_FROM?.trim() || '',
    secure: emailPort === 465,
  },
};
