import nodemailer from 'nodemailer';
import { config } from './config.js';

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  if (isSpamMessage(message)) {
    return { ok: false, error: 'That message looks like spam. Write a short note in your own words.' };
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

  const text = [
    `New portfolio message`,
    `Time: ${when}`,
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    page ? `Page: ${page}` : null,
    userAgent ? `User-Agent: ${userAgent}` : null,
    ``,
    message,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Calibri,Arial,sans-serif;line-height:1.45;color:#1a1a1a">
      <h2 style="color:#1B365D;margin:0 0 12px">New portfolio message</h2>
      <p><strong>Time:</strong> ${escapeHtml(when)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
      ${page ? `<p><strong>Page:</strong> ${escapeHtml(page)}</p>` : ''}
      ${userAgent ? `<p><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #cfd4da;margin:16px 0" />
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  await mailer.sendMail({
    from: fromAddress(),
    to: config.email.to,
    replyTo: email,
    subject: `Portfolio contact: ${name}`,
    text,
    html,
  });

  try {
    await mailer.sendMail({
      from: fromAddress(),
      to: email,
      subject: 'Thanks for reaching out — Nishant Phule',
      text: [
        `Hi ${name},`,
        ``,
        `Thanks for reaching out — I'll get back to you within a day or two.`,
        `In the meantime: linkedin.com/in/nishant-phule-b274ba1b7`,
        `Resume PDFs are on the portfolio (1-page and 2-page).`,
        ``,
        `— Nishant`,
      ].join('\n'),
    });
  } catch (err) {
    console.warn('Contact auto-reply failed', err instanceof Error ? err.message : err);
  }
}
