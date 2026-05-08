#!/usr/bin/env node
/**
 * Vult dist/ voor Capacitor Android: lokale startup-shell + logo + Capacitor-plugin bundle.
 * Geen remote server.url nodig — WebView laadt dit direct, daarna window.location naar homecheff.eu.
 */
import { execSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");
const nativeShellDir = resolve(dist, "native-shell");

const LIVE_ORIGIN = "https://homecheff.eu";

mkdirSync(nativeShellDir, { recursive: true });

const logoSrc = resolve(root, "public", "icon-192.png");
const logoDst = resolve(nativeShellDir, "logo.png");
if (existsSync(logoSrc)) {
  copyFileSync(logoSrc, logoDst);
}

const entry = resolve(root, "scripts", "native-shell-cap-entry.ts");
const capOut = resolve(nativeShellDir, "cap-plugins.js");

try {
  const out = capOut.replace(/\\/g, "/");
  const ent = entry.replace(/\\/g, "/");
  const tsconfig = resolve(root, "tsconfig.json").replace(/\\/g, "/");
  execSync(
    `npx esbuild "${ent}" --bundle --format=iife --platform=browser --target=es2020 --outfile="${out}" --tsconfig="${tsconfig}"`,
    { stdio: "inherit", cwd: root, shell: true }
  );
} catch {
  console.error(
    "\n[prepare-capacitor-webdir] esbuild failed. Run: npm install esbuild --save-dev\n"
  );
  process.exit(1);
}

writeFileSync(
  resolve(dist, "shell-config.js"),
  `window.__HC_SHELL={origin:${JSON.stringify(LIVE_ORIGIN)},healthPath:"/api/health"};`,
  "utf8"
);

const indexHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="color-scheme" content="light" />
  <title>HomeCheff</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    .wrap {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      padding-top: max(24px, env(safe-area-inset-top));
      padding-bottom: max(24px, env(safe-area-inset-bottom));
    }
    img.logo { width: 96px; height: 96px; border-radius: 20px; margin-bottom: 20px; }
    p.status { color: #374151; font-size: 1rem; text-align: center; max-width: 320px; margin: 0 0 20px; }
    p.err { color: #b91c1c; }
    button.retry {
      display: none;
      margin-top: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      background: #059669;
      border: none;
      border-radius: 12px;
      cursor: pointer;
    }
    button.retry.visible { display: inline-block; }
    .hint { font-size: 0.85rem; color: #6b7280; margin-top: 16px; text-align: center; max-width: 280px; }
  </style>
  <script src="./shell-config.js"></script>
  <script defer src="./native-shell/cap-plugins.js"></script>
</head>
<body>
  <div class="wrap">
    <img class="logo" src="./native-shell/logo.png" width="96" height="96" alt="" />
    <p class="status" id="s">Laden…</p>
    <button type="button" class="retry" id="r">Opnieuw proberen</button>
    <p class="hint" id="h"></p>
  </div>
  <script>
(function () {
  var cfg = window.__HC_SHELL || { origin: "${LIVE_ORIGIN}", healthPath: "/api/health" };
  var origin = cfg.origin;
  var healthUrl = origin + cfg.healthPath;
  var statusEl = document.getElementById("s");
  var retryBtn = document.getElementById("r");
  var hintEl = document.getElementById("h");
  var offlineMsg = "Geen verbinding. Controleer je internet en probeer opnieuw.";

  function getPendingPath() {
    try {
      var raw = sessionStorage.getItem("hc_cap_pending_route");
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (p && p.v === 1 && typeof p.path === "string" && Date.now() - (p.ts || 0) < 600000) {
        return p.path;
      }
    } catch (e) {}
    return null;
  }

  function getLastPath() {
    try {
      var raw = localStorage.getItem("hc_cap_shell_v1");
      if (!raw) return "/";
      var o = JSON.parse(raw);
      if (o && o.v === 1 && typeof o.lastPath === "string") return o.lastPath;
    } catch (e) {}
    return "/";
  }

  function goLive() {
    var pending = getPendingPath();
    var path = pending || getLastPath() || "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    window.location.replace(origin + path);
  }

  function showOffline() {
    statusEl.textContent = offlineMsg;
    statusEl.className = "status err";
    retryBtn.className = "retry visible";
    try {
      var last = getLastPath();
      if (last && last !== "/") hintEl.textContent = "Laatst geopend: " + last;
    } catch (e) {}
  }

  function check() {
    statusEl.className = "status";
    statusEl.textContent = "Laden…";
    retryBtn.className = "retry";
    hintEl.textContent = "";
    if (navigator.onLine === false) {
      showOffline();
      return;
    }
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 12000);
    fetch(healthUrl, { method: "GET", cache: "no-store", signal: ctrl.signal })
      .then(function (res) {
        clearTimeout(t);
        if (res.ok) goLive();
        else showOffline();
      })
      .catch(function () {
        clearTimeout(t);
        showOffline();
      });
  }

  retryBtn.addEventListener("click", check);
  window.addEventListener("online", function () {
    if (retryBtn.className.indexOf("visible") >= 0) check();
  });
  check();
})();
  </script>
</body>
</html>
`;

writeFileSync(resolve(dist, "index.html"), indexHtml, "utf8");

console.log("[prepare-capacitor-webdir] dist/ ready (local shell + cap-plugins.js)");
