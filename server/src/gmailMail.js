import { google } from 'googleapis';
import { config } from './config.js';

export function gmailConfigured() {
  const { clientId, clientSecret, refreshToken } = config.google;
  return Boolean(clientId && clientSecret && refreshToken);
}

function oauthClient() {
  const client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret);
  client.setCredentials({ refresh_token: config.google.refreshToken });
  return client;
}

function headerValue(value) {
  const text = String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

export function rfc822Message({ from, to, replyTo, subject, text, html, extraHeaders = {} }) {
  const boundary = `pf_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${headerValue(subject)}`,
    'MIME-Version: 1.0',
  ];
  if (replyTo) lines.push(`Reply-To: ${replyTo}`);
  for (const [key, val] of Object.entries(extraHeaders)) {
    if (val) lines.push(`${key}: ${String(val).replace(/[\r\n]+/g, ' ')}`);
  }
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`, '');
  lines.push(`--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', text, '');
  lines.push(`--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: 8bit', '', html, '');
  lines.push(`--${boundary}--`, '');
  return lines.join('\r\n');
}

export async function sendGmail({ from, to, replyTo, subject, text, html, extraHeaders }) {
  const gmail = google.gmail({ version: 'v1', auth: oauthClient() });
  const raw = Buffer.from(
    rfc822Message({ from, to, replyTo, subject, text, html, extraHeaders }),
    'utf8',
  ).toString('base64url');
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}
