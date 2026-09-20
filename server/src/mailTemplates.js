const VOID = '#0a0e14';
const SURFACE = '#121822';
const SURFACE2 = '#1a2230';
const CYAN = '#00e5ff';
const MAGENTA = '#ff2d78';
const INK = '#f4f6fa';
const MUTED = '#96a2b5';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shell({ kicker, title, inner }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${VOID};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${VOID};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${SURFACE};border:1px solid #2a3444;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${VOID};padding:18px 22px 14px;border-bottom:2px solid ${CYAN};">
              <p style="margin:0 0 4px;font-family:Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${CYAN};">${escapeHtml(kicker)}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${INK};">${escapeHtml(title)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${INK};">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 22px 18px;font-family:Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.08em;color:${MUTED};border-top:1px solid #2a3444;">
              NISHANT PHULE · BACKEND / AI
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:6px 0;font-family:Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${CYAN};width:96px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};">${value}</td>
  </tr>`;
}

export function inboundHtml({ name, email, company, message, page, userAgent, when }) {
  const fields = [
    row('Time', escapeHtml(when)),
    row('Name', escapeHtml(name)),
    row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:${CYAN};text-decoration:none;">${escapeHtml(email)}</a>`),
    company ? row('Company', escapeHtml(company)) : '',
    page ? row('Page', `<a href="${escapeHtml(page)}" style="color:${CYAN};word-break:break-all;">${escapeHtml(page)}</a>`) : '',
    userAgent ? row('Client', escapeHtml(userAgent)) : '',
  ].join('');

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fields}</table>
    <div style="margin-top:16px;padding:14px 16px;background:${SURFACE2};border-left:3px solid ${MAGENTA};border-radius:0 8px 8px 0;">
      <p style="margin:0 0 8px;font-family:Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MAGENTA};">Message</p>
      <p style="margin:0;white-space:pre-wrap;color:${INK};font-size:14px;line-height:1.55;">${escapeHtml(message)}</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:${MUTED};">Reply directly to this thread to reach the sender.</p>
  `;

  return shell({ kicker: 'PORTFOLIO · CONTACT', title: 'New inbound signal', inner });
}

export function autoReplyHtml({ name }) {
  const inner = `
    <p style="margin:0 0 14px;color:${INK};">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 14px;color:${MUTED};">Thanks for reaching out — I’ll get back to you within a day or two.</p>
    <p style="margin:0 0 8px;color:${MUTED};">In the meantime:</p>
    <p style="margin:0 0 6px;"><a href="https://linkedin.com/in/nishant-phule-b274ba1b7" style="color:${CYAN};">linkedin.com/in/nishant-phule-b274ba1b7</a></p>
    <p style="margin:0 0 18px;color:${MUTED};">Resume PDFs (1-page and 2-page) are on the portfolio.</p>
    <p style="margin:0;color:${INK};">— Nishant</p>
  `;
  return shell({ kicker: 'PORTFOLIO · ACK', title: 'Message received', inner });
}

export function inboundText({ name, email, company, message, page, userAgent, when }) {
  return [
    'New portfolio message',
    `Time: ${when}`,
    `Name: ${name}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    page ? `Page: ${page}` : null,
    userAgent ? `User-Agent: ${userAgent}` : null,
    '',
    message,
  ]
    .filter(Boolean)
    .join('\n');
}

export function autoReplyText({ name }) {
  return [
    `Hi ${name},`,
    '',
    `Thanks for reaching out — I'll get back to you within a day or two.`,
    `In the meantime: linkedin.com/in/nishant-phule-b274ba1b7`,
    `Resume PDFs are on the portfolio (1-page and 2-page).`,
    '',
    '— Nishant',
  ].join('\n');
}
