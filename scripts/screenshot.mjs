import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sites = JSON.parse(fs.readFileSync(path.join(ROOT, "sites.json"), "utf8"));
const OUT = path.join(ROOT, "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 800;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1.5,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
});

for (const s of sites) {
  const out = path.join(OUT, `${s.slug}.png`);
  console.log(`-> ${s.slug} … ${s.url}`);
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: out, fullPage: false, type: "png" });
    console.log(`   saved ${path.relative(ROOT, out)}`);
  } catch (e) {
    console.error(`   FAILED: ${e.message}`);
    try {
      await page.screenshot({ path: out, fullPage: false, type: "png" });
      console.log(`   saved partial`);
    } catch {}
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("done");
