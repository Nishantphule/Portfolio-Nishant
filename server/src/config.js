import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173',
  /** Cheap/fast OpenRouter model — swap here without touching the route. */
  openRouterModel: 'dots-studio/dots-3-note-preview:free',
  openRouterUrl: 'https://openrouter.ai/api/v1/chat/completions',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim() || '',
  },
  email: {
    user: process.env.EMAIL_USER?.trim() || process.env.EMAIL_FROM?.trim() || '',
    to: process.env.EMAIL_TO?.trim() || 'nishantphule12@gmail.com',
    from: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim() || '',
  },
};
