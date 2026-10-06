import { chromium } from "playwright";

const base = process.argv[2] || "https://homecheff.eu";

function isVideo(url) {
  const u = url.toLowerCase();
  return (
    u.includes("/api/video-proxy") ||
    u.includes(".mp4") ||
    u.includes(".webm") ||
    u.includes(".mov") ||
    u.includes("video/mp4")
  );
}

async function runCase(browser, name, viewport, column) {
  const context = await browser.newContext({
    viewport,
    locale: "nl-NL",
    hasTouch: viewport.width < 800,
    isMobile: viewport.width < 800,
  });
  const page = await context.newPage();
  const videos = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!isVideo(url)) return;
    const range = req.headers()["range"] || "";
    videos.push({ url, range: Boolean(range), type: req.resourceType() });
  });
  let bytes = 0;
  page.on("response", async (res) => {
    const url = res.url();
    if (!isVideo(url)) return;
    const len = Number(res.headers()["content-length"] || 0);
    if (Number.isFinite(len)) bytes += len;
  });
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  if (column) {
    const group = page.getByRole("group", { name: /kolom|column/i });
    if (await group.count()) {
      const buttons = group.getByRole("button");
      const index = column === 1 ? 0 : 1;
      if (await buttons.count()) await buttons.nth(index).click().catch(() => {});
      await page.waitForTimeout(800);
    }
  }
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(400);
  }
  const dom = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("video")];
    return {
      videoTags: nodes.length,
      withSrc: nodes.filter((node) => node.getAttribute("src") || node.currentSrc || node.querySelector("source")).length,
      posters: document.querySelectorAll("video[poster], img").length,
    };
  });
  const unique = new Set(videos.map((item) => item.url)).size;
  console.log(
    JSON.stringify({
      name,
      viewport,
      requests: videos.length,
      unique: unique,
      ranged: videos.filter((item) => item.range).length,
      full: videos.filter((item) => !item.range).length,
      bytes,
      dom,
    }),
  );
  await context.close();
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
await runCase(browser, "mobile", { width: 390, height: 844 }, null);
await runCase(browser, "desktop-default", { width: 1280, height: 900 }, null);
await runCase(browser, "desktop-one", { width: 1280, height: 900 }, 1);
await runCase(browser, "desktop-two", { width: 1440, height: 900 }, 2);
await browser.close();
