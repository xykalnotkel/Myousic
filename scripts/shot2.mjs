import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("screenshots", { recursive: true });
const errors = [];
const track = (p, l) => {
  p.on("pageerror", (e) => errors.push(l + ": " + e.message));
  p.on("console", (m) => m.type() === "error" && errors.push(l + ": " + m.text().slice(0, 150)));
};
const b = await chromium.launch();

const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
track(d, "D");
await d.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await d.waitForTimeout(2000);
// cek sidebar punya 4 menu
const menuCount = await d.locator("aside nav a").count();
console.log("sidebar menu:", menuCount);
await d.screenshot({ path: "screenshots/desktop-home-v2.png" });

await d.goto("http://localhost:3000/trending", { waitUntil: "networkidle", timeout: 30000 });
await d.waitForTimeout(1500);
await d.screenshot({ path: "screenshots/desktop-trending.png" });
console.log("trending OK");

await d.goto("http://localhost:3000/artists", { waitUntil: "networkidle", timeout: 30000 });
await d.waitForTimeout(1200);
await d.screenshot({ path: "screenshots/desktop-artists.png" });
console.log("artists OK");

const m = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
track(m, "M");
await m.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await m.waitForTimeout(1500);
const mnav = await m.locator("nav a, nav button").count();
console.log("mobile nav items:", mnav);
await m.screenshot({ path: "screenshots/mobile-home-v2.png" });

await b.close();
console.log("ERRORS:", errors.length);
errors.forEach((e) => console.log("ERR:", e.slice(0, 200)));
process.exit(errors.length ? 1 : 0);
