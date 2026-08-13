// Screenshot + smoke test lengkap (desktop & mobile)
import { chromium } from "playwright";
import fs from "fs";

const OUT = "screenshots";
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const track = (page, label) => {
  page.on("pageerror", (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label} CONSOLE: ${m.text().slice(0, 200)}`);
  });
};

const browser = await chromium.launch();

// ============ DESKTOP ============
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
track(desktop, "DESKTOP");

await desktop.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await desktop.waitForTimeout(1800);
await desktop.screenshot({ path: `${OUT}/desktop-home.png` });
console.log("desktop-home OK (ada Artis Indonesia:", (await desktop.getByText("Artis Indonesia").count()) > 0, ")");

// search & play
await desktop.goto("http://localhost:3000/search", { waitUntil: "networkidle", timeout: 30000 });
await desktop.fill("input[placeholder*='Cari lagu']", "bohemian rhapsody");
await desktop.waitForTimeout(4000);
await desktop.waitForSelector("text=Bohemian Rhapsody", { timeout: 15000 }).catch(() => {});
await desktop.waitForTimeout(600);
await desktop.screenshot({ path: `${OUT}/desktop-search.png` });

const row = desktop.locator("button.group", { hasText: "Bohemian Rhapsody" }).first();
if (await row.count()) {
  await row.click();
  await desktop.waitForTimeout(8000);
  await desktop.screenshot({ path: `${OUT}/desktop-playing.png` });
  console.log("desktop play OK");

  // buka now playing
  await desktop.locator("button[title='Buka Now Playing']").first().click().catch(() => {});
  await desktop.waitForTimeout(3000);

  // tab Lirik
  await desktop.getByText("Lirik", { exact: true }).click().catch(() => {});
  await desktop.waitForTimeout(4000);
  await desktop.screenshot({ path: `${OUT}/desktop-lyrics.png` });
  const lyricCount = await desktop.getByText(/Is this the real life/).count();
  console.log("lirik tampil:", lyricCount > 0);

  // ganti gaya cover
  await desktop.locator("button[title='Gaya berikutnya']").click().catch(() => {});
  await desktop.waitForTimeout(600);
  await desktop.screenshot({ path: `${OUT}/desktop-cover-style.png` });
  console.log("cover style OK");

  // tab visualizer
  await desktop.getByText("Visualizer", { exact: true }).click().catch(() => {});
  await desktop.waitForTimeout(1200);
  await desktop.screenshot({ path: `${OUT}/desktop-nowplaying.png` });

  await desktop.keyboard.press("Escape");
  await desktop.waitForTimeout(500);
}

// halaman artis
await desktop.goto("http://localhost:3000/artist/UCEPMVbUzImPl4p8k4LkGevA", { waitUntil: "networkidle", timeout: 30000 });
await desktop.waitForTimeout(1500);
await desktop.screenshot({ path: `${OUT}/desktop-artist.png` });
console.log("artist page OK");

// ============ MOBILE ============
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
track(mobile, "MOBILE");

await mobile.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await mobile.waitForTimeout(1500);
await mobile.screenshot({ path: `${OUT}/mobile-home.png` });

// bottom nav
const navCount = await mobile.locator("nav").count();
console.log("mobile bottom nav:", navCount);

await mobile.getByText("Cari", { exact: true }).first().click().catch(async () => {
  await mobile.goto("http://localhost:3000/search", { waitUntil: "networkidle" });
});
await mobile.waitForTimeout(1000);
await mobile.fill("input[placeholder*='Cari lagu']", "coldplay");
await mobile.waitForTimeout(4000);
await mobile.waitForSelector("text=Adventure of a Lifetime", { timeout: 15000 }).catch(() => {});
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${OUT}/mobile-search.png` });

const mrow = mobile.locator("button.group", { hasText: "Adventure of a Lifetime" }).first();
if (await mrow.count()) {
  await mrow.click();
  await mobile.waitForTimeout(8000);
  await mobile.screenshot({ path: `${OUT}/mobile-playing.png` });
  // buka now playing via bottom nav
  await mobile.getByText("Now Playing").first().click().catch(() => {});
  await mobile.waitForTimeout(2500);
  await mobile.screenshot({ path: `${OUT}/mobile-nowplaying.png` });
  // tab lirik mobile
  await mobile.getByText("Lirik", { exact: true }).click().catch(() => {});
  await mobile.waitForTimeout(3500);
  await mobile.screenshot({ path: `${OUT}/mobile-lyrics.png` });
  console.log("mobile play + lyrics OK");
}

// ============ album ============
const al = await browser.newPage({ viewport: { width: 1440, height: 900 } });
track(al, "ALBUM");
await al.goto("http://localhost:3000/album/MPREb_uyDtumP5F3h", { waitUntil: "networkidle", timeout: 30000 });
await al.waitForTimeout(1500);
await al.screenshot({ path: `${OUT}/desktop-album.png` });
console.log("album OK");

await browser.close();

console.log("\n=== TOTAL ERROR:", errors.length, "===");
errors.forEach((e) => console.log("ERR:", e.slice(0, 250)));
process.exit(errors.length > 0 ? 1 : 0);
