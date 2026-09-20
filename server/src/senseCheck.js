import { config } from './config.js';

const SYSTEM = `You classify portfolio contact-form submissions.
Reject keyboard smash, random letters, no real words, or no intelligible intent.
Allow short recruiter notes, role inquiries, and non-native English.
Reply with JSON only: {"ok":true} or {"ok":false}.`;

export async function senseCheck({ name, company, message }) {
  if (!config.openRouterApiKey) return { ok: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const upstream = await fetch(config.openRouterUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.clientOrigin,
        'X-Title': 'Nishant Phule Portfolio',
      },
      body: JSON.stringify({
        model: config.openRouterModel,
        temperature: 0,
        max_tokens: 40,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: `Name: ${name}\nCompany: ${company || '(none)'}\nMessage: ${message}`,
          },
        ],
      }),
    });
    const payload = await upstream.json().catch(() => null);
    const raw = payload?.choices?.[0]?.message?.content?.trim() || '';
    const json = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return { ok: true };
    const parsed = JSON.parse(json);
    if (parsed && parsed.ok === false) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: true };
  } finally {
    clearTimeout(timer);
  }
}
