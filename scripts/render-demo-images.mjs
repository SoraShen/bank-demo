import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = process.env.DEMO_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "scripts/demo-images/mockups.html");
const outDir = path.join(root, "public/demo");
const chrome = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const shots = [
  { id: "sms", file: "scam-sms.png" },
  { id: "email", file: "scam-email.png" },
  { id: "whatsapp", file: "scam-whatsapp.png" },
  { id: "statement", file: "transaction-statement.png" },
];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 430, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
fs.mkdirSync(outDir, { recursive: true });
for (const shot of shots) {
  const el = await page.$(`#${shot.id}`);
  if (!el) throw new Error(`missing #${shot.id}`);
  await el.screenshot({ path: path.join(outDir, shot.file), type: "png" });
  console.log("wrote", shot.file);
}
await browser.close();
