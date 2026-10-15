#!/usr/bin/env node
// scripts/screenshot.mjs — Playwright capture + checks for one scratch page.
//
// Env:
//   SCRATCH_URL     full URL to open (or STORE + SCRATCH_PAGE + SLOT + DEV_THEME_ID)
//   OUT_DIR         where PNGs and JSON reports go (default .harness/reports/screenshot)
//   SECTION_TYPE    e.g. anvil-ticker; waits for [data-section-type="…"] before shooting
//   STORE_PASSWORD  storefront password for a password-protected dev store
//   MODE            full (default) | a11y (axe + console only, no PNGs)
//   AXE             auto (default) | off
//   TIMEOUT_MS      navigation timeout (default 60000)
//
// Runs:
//   375x812 @2x (mobile emulation) and 1280x800 full-page PNGs
//   a reduced-motion run that asserts no <anvil-marquee> animation is running
//   and no anvil:slider:change event fires in 3 s
//   console errors + page errors (same-origin / Shopify-CDN ones fail the run,
//   third-party app scripts are listed as warnings)
//   axe-core via @axe-core/playwright when installed: 0 serious/critical
//
// Exit codes: 0 pass · 1 findings · 2 bad configuration · 3 skipped (playwright
// or its browser not installed)

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const env = process.env;
const timeout = Number(env.TIMEOUT_MS || 60000);
const mode = env.MODE === 'a11y' ? 'a11y' : 'full';
const outDir = path.resolve(env.OUT_DIR || '.harness/reports/screenshot');
const sectionType = env.SECTION_TYPE || '';

function buildUrl() {
  if (env.SCRATCH_URL) return env.SCRATCH_URL;
  const store = (env.STORE || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!store || !env.DEV_THEME_ID) return '';
  const page = env.SCRATCH_PAGE || 'contact';
  const slot = env.SLOT || '1';
  return `https://${store}/pages/${page}?view=anvil-scratch-${slot}&preview_theme_id=${env.DEV_THEME_ID}&pb=0`;
}

const url = buildUrl();
if (!url) {
  console.error('screenshot: set SCRATCH_URL (or STORE, DEV_THEME_ID, SCRATCH_PAGE, SLOT)');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('screenshot: SKIP — playwright is not installed. Run: npm install && npx playwright install chromium');
  process.exit(3);
}
let AxeBuilder = null;
if (env.AXE !== 'off') {
  try {
    AxeBuilder = (await import('@axe-core/playwright')).default;
  } catch {
    console.log('screenshot: axe skipped — @axe-core/playwright is not installed');
  }
}

const storeHost = new URL(url).host;
const firstPartyHost = (h) =>
  h === storeHost ||
  h.endsWith('.shopify.com') ||
  h.endsWith('.shopifycdn.com') ||
  h.endsWith('.shopifysvc.com') ||
  h.endsWith('.shopifycloud.com') ||
  h.endsWith('.myshopify.com');

const findings = [];
const warnings = [];
const summary = { url, mode, runs: [] };

await mkdir(outDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  console.log(`screenshot: SKIP — chromium not available (${err.message.split('\n')[0]}). Run: npx playwright install chromium`);
  process.exit(3);
}

async function unlockPassword(page) {
  if (!page.url().includes('/password')) return;
  if (!env.STORE_PASSWORD) {
    findings.push('store is password-protected; set STORE_PASSWORD');
    return;
  }
  const field = page.locator('input[type="password"]').first();
  await field.fill(env.STORE_PASSWORD);
  await field.press('Enter');
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.goto(url, { waitUntil: 'networkidle', timeout });
}

async function runViewport(name, contextOptions, { reducedMotion = false, shoot = true } = {}) {
  const run = { name, errors: [], warnings: [], thirdParty: [], axe: null, png: null, reducedMotion };
  const context = await browser.newContext({ ...contextOptions, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const thirdParty = new Set();

  await page.addInitScript(() => {
    window.__anvilSliderChanges = 0;
    document.addEventListener('anvil:slider:change', () => { window.__anvilSliderChanges += 1; });
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const loc = msg.location && msg.location().url ? msg.location().url : '';
    let host = '';
    try { host = loc ? new URL(loc).host : ''; } catch { host = ''; }
    const entry = `${msg.text()}${loc ? ` (${loc})` : ''}`;
    if (!host || firstPartyHost(host)) run.errors.push(entry); else run.warnings.push(`third-party console error: ${entry}`);
  });
  page.on('pageerror', (err) => run.errors.push(`pageerror: ${err.message}`));
  page.on('request', (req) => {
    try {
      const h = new URL(req.url()).host;
      if (!firstPartyHost(h)) thirdParty.add(h);
    } catch { /* ignore */ }
  });
  page.on('requestfailed', (req) => {
    const f = req.failure();
    if (f && !/net::ERR_ABORTED/.test(f.errorText)) run.warnings.push(`request failed: ${req.url()} ${f.errorText}`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    await unlockPassword(page);
    if (sectionType) {
      const sel = `[data-section-type="${sectionType}"]`;
      const found = await page.locator(sel).first().waitFor({ state: 'attached', timeout: 15000 }).then(() => true).catch(() => false);
      if (!found) run.errors.push(`section ${sectionType} did not render (${sel} not found)`);
    }
    await page.waitForTimeout(reducedMotion ? 3000 : 1000);

    if (reducedMotion) {
      const motion = await page.evaluate(() => {
        const running = [];
        document.querySelectorAll('anvil-marquee, [data-marquee-track]').forEach((el, i) => {
          const anims = typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : [];
          if (anims.some((a) => a.playState === 'running')) running.push(`${el.tagName.toLowerCase()}#${i}`);
        });
        return { running, sliderChanges: window.__anvilSliderChanges || 0 };
      });
      if (motion.running.length) run.errors.push(`reduced motion: animations still running on ${motion.running.join(', ')}`);
      if (motion.sliderChanges > 0) run.errors.push(`reduced motion: slider auto-advanced ${motion.sliderChanges} time(s) in 3 s`);
    }

    if (shoot && mode === 'full') {
      const file = path.join(outDir, `${sectionType || 'page'}-${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      run.png = file;
    }

    if (AxeBuilder && !reducedMotion) {
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      run.axe = { violations: results.violations.length, seriousOrCritical: serious.length };
      await writeFile(path.join(outDir, `axe-${name}.json`), JSON.stringify(results.violations, null, 2));
      for (const v of serious) {
        run.errors.push(`axe ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length} node(s)) ${v.helpUrl}`);
      }
    }
  } catch (err) {
    run.errors.push(`run failed: ${err.message.split('\n')[0]}`);
  }

  run.thirdParty = [...thirdParty].sort();
  if (run.thirdParty.length) run.warnings.push(`third-party origins requested: ${run.thirdParty.join(', ')}`);
  await context.close();
  summary.runs.push(run);
  for (const e of run.errors) findings.push(`[${name}] ${e}`);
  for (const w of run.warnings) warnings.push(`[${name}] ${w}`);
}

const mobile = { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };

await runViewport('375x812', mobile);
await runViewport('1280x800', desktop);
if (mode === 'full') await runViewport('1280x800-reduced-motion', desktop, { reducedMotion: true, shoot: true });

await browser.close();

summary.findings = findings;
summary.warnings = warnings;
await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

for (const w of warnings) console.log(`warning: ${w}`);
for (const f of findings) console.log(`error: ${f}`);
for (const r of summary.runs) {
  const bits = [r.png ? `png=${path.relative(process.cwd(), r.png)}` : null, r.axe ? `axe=${r.axe.seriousOrCritical}/${r.axe.violations}` : null].filter(Boolean);
  console.log(`${r.name}: ${r.errors.length} error(s) ${bits.join(' ')}`);
}
console.log(`screenshot: ${findings.length} finding(s), ${warnings.length} warning(s) → ${path.relative(process.cwd(), outDir)}`);
process.exit(findings.length ? 1 : 0);
