import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("screenshots", { recursive: true });
const errors = [];
const track = (p, l) => {
  p.on("pageerror", (e) => errors.push(l + " PAGEERR: " + e.message.slice(0, 120)));
  p.on("console", (m) => m.type() === "error" && errors.push(l + " CONSOLE: " + m.text().slice(0, 150)));
};
const b = await chromium.launch();

// ===== DESKTOP: cari + play + cek audio jalan =====
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
track(d, "D");
await d.goto("http://localhost:3000/search", { waitUntil: "networkidle", timeout: 30000 });
await d.fill("input[placeholder*='Cari lagu']", "bohemian rhapsody");
await d.waitForTimeout(2500);
await d.waitForSelector("text=Bohemian Rhapsody", { timeout: 15000 }).catch(() => {});
await d.waitForTimeout(500);
// klik baris pertama
const row = d.locator("button.group", { hasText: "Bohemian Rhapsody" }).first();
if (await row.count()) {
  await row.click();
  await d.waitForTimeout(9000);
  const playing = await d.evaluate(() => {
    const a = window.__kainetAudio;
    return a ? { paused: a.paused, time: a.currentTime, dur: a.duration, src: a.src.slice(0, 40) } : null;
  });
  console.log("AUDIO STATE:", JSON.stringify(playing));
  const errBanner = await d.getByText(/Gagal memuat|tidak dapat diputar/i).count();
  console.log("error banner muncul:", errBanner > 0);
  await d.screenshot({ path: "screenshots/desktop-fix-playing.png" });
}
// cek glitch: ketik cepat 3x tanpa debounce masalah
const t0 = Date.now();
await d.fill("input[placeholder*='Cari lagu']", "");
await d.fill("input[placeholder*='Cari lagu']", "c");
await d.fill("input[placeholder*='Cari lagu']", "co");
await d.fill("input[placeholder*='Cari lagu']", "coldplay");
await d.waitForTimeout(3000);
const coldplay = await d.getByText("Adventure of a Lifetime").count();
console.log("search cepat coldplay:", coldplay > 0, "(", Date.now() - t0, "ms )");
await d.screenshot({ path: "screenshots/desktop-fix-search.png" });

// ===== MOBILE: bottom nav besar + player di atasnya =====
const m = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
track(m, "M");
await m.goto("http://localhost:3000/trending", { waitUntil: "networkidle", timeout: 30000 });
await m.waitForTimeout(2000);
const mrow = m.locator("button.group").first();
if (await mrow.count()) {
  await mrow.click();
  await m.waitForTimeout(9000);
  // cek posisi player & nav
  const pos = await m.evaluate(() => {
    const player = document.querySelector(".fixed.bottom-\\[78px\\]") || document.querySelector("div[class*='bottom-[78px]']");
    const nav = document.querySelector("nav.fixed");
    const pr = player?.getBoundingClientRect();
    const nr = nav?.getBoundingClientRect();
    return { playerBottom: pr?.bottom, navTop: nr?.top, navBottom: nr?.bottom, playerTop: pr?.top };
  });
  console.log("POSISI:", JSON.stringify(pos));
  await m.screenshot({ path: "screenshots/mobile-fix-layout.png" });
}
await b.close();
console.log("\nERRORS:", errors.length);
errors.forEach((e) => console.log("ERR:", e.slice(0, 180)));
