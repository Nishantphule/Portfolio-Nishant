import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { mailConfigured, parseContact, sendContactEmails } from './contact.js';

export const app = express();
app.set('trust proxy', 1);

app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many questions from this network. Please try again in a few minutes.',
  },
});

const ALLOWED_ROLES = new Set(['user', 'assistant']);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many messages from this network. Try again in an hour.',
      code: 'RATE_LIMIT',
    });
  },
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const parsed = parseContact(req.body);
  if (!parsed.ok) {
    return res.status(400).json({
      error: parsed.error,
      code: 'VALIDATION',
      fields: parsed.fields || undefined,
    });
  }
  if (parsed.honey) {
    return res.json({ ok: true });
  }
  if (!mailConfigured()) {
    return res.status(503).json({
      error: 'Mail is not configured yet. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS.',
      code: 'MAIL_NOT_CONFIGURED',
    });
  }
  try {
    await sendContactEmails({
      ...parsed.data,
      userAgent: String(req.get('user-agent') || '').slice(0, 300),
    });
    return res.json({ ok: true });
  } catch (err) {
    console.warn('Contact SMTP failed', err instanceof Error ? err.message : err);
    return res.status(502).json({
      error: 'Could not send the message. Try WhatsApp or email me directly.',
      code: 'SMTP_FAILED',
    });
  }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!incoming) {
    return res.status(400).json({ error: 'Send { messages: [{ role, content }] }.' });
  }

  const history = [];
  for (const item of incoming.slice(-12)) {
    if (!item || typeof item !== 'object') continue;
    const role = String(item.role || '');
    const content = String(item.content || '').trim();
    if (!ALLOWED_ROLES.has(role) || !content) continue;
    if (content.length > 4000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }
    history.push({ role, content });
  }

  if (!history.length || history[history.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'The last message must be from the visitor.' });
  }

  if (!config.openRouterApiKey) {
    return res.status(503).json({
      error: 'Chat is not configured yet. Set OPENROUTER_API_KEY on the server.',
    });
  }

  try {
    const upstream = await fetch(config.openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.clientOrigin,
        'X-Title': 'Nishant Phule Portfolio',
      },
      body: JSON.stringify({
        model: config.openRouterModel,
        temperature: 0.4,
        max_tokens: 500,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const msg =
        payload?.error?.message ||
        `OpenRouter returned ${upstream.status}. Try again in a moment.`;
      return res.status(502).json({ error: msg });
    }

    const reply = payload?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'The model returned an empty reply.' });
    }

    return res.json({ reply });
  } catch {
    return res.status(502).json({ error: 'Could not reach the chat service.' });
  }
});
