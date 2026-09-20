import nodemailer from 'nodemailer';
import { config } from './config.js';
import { autoReplyHtml, autoReplyText, inboundHtml, inboundText } from './mailTemplates.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mailConfigured() {
  const { host, user, pass } = config.email;
  return Boolean(host && user && pass);
}

function transporter() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
}

function fromAddress() {
  return config.email.from || config.email.user;
}

function asString(value) {
  return String(value ?? '').trim();
}

export function isSpamMessage(message) {
  const links = message.match(/https?:\/\//gi) || [];
  if (links.length >= 4) return true;
  const letters = (message.match(/[a-zA-Z]/g) || []).length;
  if (message.length >= 10 && letters / message.length < 0.25) return true;
  const withoutUrls = message.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, '');
  if (withoutUrls.length < 8 && links.length >= 1) return true;
  return false;
}

export function isGibberishMessage(message) {
  const text = String(message || '').trim();
  const words = text.toLowerCase().match(/[a-z]{2,}/g) || [];
  const letters = (text.match(/[a-z]/gi) || []).join('');
  if (!letters) return true;
  if (/(.)\1{4,}/i.test(text)) return true;
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(text)) return true;

  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  if (letters.length >= 12 && vowels / letters.length < 0.22) return true;

  if (words.length < 2) {
    if (words.length === 0) return true;
    const word = words[0];
    if (word.length >= 14) return true;
    if ((word.match(/[aeiouy]/g) || []).length / word.length < 0.28) return true;
  }
  return false;
}

/**
 * @returns {{ ok: true, honey: boolean, data?: object } | { ok: false, error: string, fields?: Record<string, string> }}
 */
export function parseContact(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Send JSON with name, email, and message.' };
  }

  const website = asString(body.website).slice(0, 200);
  if (website) return { ok: true, honey: true };

  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const company = asString(body.company);
  const message = asString(body.message);
  const page = asString(body.page).slice(0, 400);

  const fields = {};
  if (name.length > 80) fields.name = 'Name is too long.';
  else if (name.length < 2) fields.name = 'Name must be at least 2 characters.';
  if (email.length > 120) fields.email = 'Email is too long.';
  else if (!EMAIL_RE.test(email)) fields.email = 'Enter a valid email address.';
  if (company.length > 120) fields.company = 'Company is too long.';
  if (message.length > 2000) fields.message = 'Message is too long.';
  else if (message.length < 10) fields.message = 'Message must be at least 10 characters.';
  if (Object.keys(fields).length) {
    return { ok: false, error: 'Please fix the highlighted fields.', fields };
  }
  if (isSpamMessage(message) || isGibberishMessage(message)) {
    return {
      ok: false,
      error: 'That message does not look like a real note. Write a short sentence about why you are reaching out.',
      fields: {
        message: 'Use a short sentence with real words — keyboard smash will not send.',
      },
    };
  }

  return {
    ok: true,
    honey: false,
    data: { name, email, company, message, page },
  };
}

export async function sendContactEmails(input) {
  const { name, email, company, message, page, userAgent } = input;
  const when = new Date().toISOString();
  const mailer = transporter();
  const payload = { name, email, company, message, page, userAgent, when };

  await mailer.sendMail({
    from: fromAddress(),
    to: config.email.to,
    replyTo: email,
    subject: `[Portfolio] Contact · ${name}`,
    headers: { 'X-Portfolio-Source': 'contact-form' },
    text: inboundText(payload),
    html: inboundHtml(payload),
  });

  try {
    await mailer.sendMail({
      from: fromAddress(),
      to: email,
      subject: 'Thanks for reaching out — Nishant Phule',
      text: autoReplyText({ name }),
      html: autoReplyHtml({ name }),
    });
  } catch (err) {
    console.warn('Contact auto-reply failed', err instanceof Error ? err.message : err);
  }
}
