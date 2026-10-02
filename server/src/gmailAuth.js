import http from 'node:http';
import { google } from 'googleapis';
import { config } from './config.js';

const REDIRECT = 'http://127.0.0.1:53682/oauth2callback';
const SCOPE = ['https://www.googleapis.com/auth/gmail.send'];

const { clientId, clientSecret } = config.google;
if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first.');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPE,
});

console.log('In Google Cloud Console → Credentials → this OAuth client, add Authorized redirect URI:');
console.log(`  ${REDIRECT}`);
console.log('Enable Gmail API on the project if it is not already.');
console.log('Sign in as the mailbox that should send (EMAIL_FROM), then open:');
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', REDIRECT);
    if (url.pathname !== '/oauth2callback') {
      res.writeHead(404);
      res.end();
      return;
    }
    const err = url.searchParams.get('error');
    if (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Google returned: ${err}`);
      console.error('OAuth error:', err);
      server.close();
      process.exit(1);
    }
    const code = url.searchParams.get('code');
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Missing code.');
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Gmail access granted. You can close this tab and return to the terminal.');
    if (!tokens.refresh_token) {
      console.error(
        'No refresh token returned. Revoke this app at https://myaccount.google.com/permissions then run npm run gmail:auth again.',
      );
      server.close();
      process.exit(1);
    }
    console.log('Paste this line into server/.env (do not commit .env):');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    server.close();
    process.exit(0);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Token exchange failed. See the terminal.');
    } catch {
      /* ignore */
    }
    server.close();
    process.exit(1);
  }
});

server.listen(53682, '127.0.0.1', () => {
  console.log('Waiting for Google redirect on', REDIRECT);
});
