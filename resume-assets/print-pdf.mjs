/**
 * Headless Chromium print: HTML → A4 PDF (no header/footer).
 * Usage: npm run print
 */
import { copyFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

function countPdfPages(filePath) {
  const text = readFileSync(filePath, 'latin1');
  const matches = text.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches ? matches.length : 0;
}

const root = dirname(fileURLToPath(import.meta.url));

const jobs = [
  { html: 'resume-1page.html', pdf: 'Nishant-Phule-Resume-1page.pdf', expect: 1, copyPublic: true },
  { html: 'resume-2page.html', pdf: 'Nishant-Phule-Resume-2page.pdf', expect: 2, copyPublic: true },
  { html: 'cover-letter.html', pdf: 'Nishant-Phule-Cover-Letter.pdf', expect: 1, copyPublic: false },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failed = false;

try {
  for (const job of jobs) {
    const page = await browser.newPage();
    const url = pathToFileURL(join(root, job.html)).href;
    await page.goto(url, { waitUntil: 'networkidle0' });
    const out = join(root, job.pdf);
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await page.close();

    const pages = countPdfPages(out);
    const ok = pages === job.expect;
    if (!ok) failed = true;
    if (job.copyPublic) {
      const publicOut = join(root, '..', 'client', 'public', job.pdf);
      try {
        copyFileSync(out, publicOut);
        console.log(`Copied ${job.pdf} → client/public/`);
      } catch {
        console.log(`Skipped copy to client/public (folder missing)`);
      }
    }

    console.log(
      `${ok ? 'OK' : 'FAIL'} ${job.pdf}: ${pages} page(s), expected ${job.expect}`,
    );
  }
} catch (err) {
  failed = true;
  console.error(err);
} finally {
  await browser.close();
}

if (failed) process.exit(1);
console.log('All PDFs match expected page counts.');
