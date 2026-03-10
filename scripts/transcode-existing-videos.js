/**
 * Transcodeer bestaande video's in de database naar MP4/H.264.
 * Zo speelt elke video goed af op alle browsers/apparaten (incl. Safari/iOS).
 *
 * Vereisten:
 * - FFmpeg geïnstalleerd (macOS: brew install ffmpeg)
 * - DATABASE_URL en BLOB_READ_WRITE_TOKEN in .env.local (of export in shell)
 *
 * Gebruik:
 *   node scripts/transcode-existing-videos.js --list       # Toon alle dish-video's (titel, id, url)
 *   node scripts/transcode-existing-videos.js              # Rapport alle video's (dry-run)
 *   node scripts/transcode-existing-videos.js --run        # Alle transcoderen en DB updaten
 *   node scripts/transcode-existing-videos.js --dish "naan" --run   # Alleen dishes met "naan" in titel
 *   node scripts/transcode-existing-videos.js --id <dishId> --run   # Alleen dit dish-id
 *
 * Het script:
 * 1. Haalt DishVideo (met dishtitel) en ProductVideo op
 * 2. Downloadt elke video van de huidige URL
 * 3. Transcodeert naar MP4/H.264/AAC (webbrowser-compatibel)
 * 4. Uploadt de nieuwe versie naar Vercel Blob
 * 5. Werkt het database-record bij met de nieuwe URL
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Laad .env.local indien aanwezig
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (_) {}

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--run');
const args = process.argv.slice(2);
const dishTitleFilter = (() => {
  const i = args.indexOf('--dish');
  return i >= 0 && args[i + 1] ? args[i + 1].toLowerCase() : null;
})();
const dishIdFilter = (() => {
  const i = args.indexOf('--id');
  return i >= 0 && args[i + 1] ? args[i + 1].trim() : null;
})();
const LIST_ONLY = args.includes('--list');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

function ensureFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function downloadVideo(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'HomeCheff-Transcode/1.0' } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function transcodeToMp4(inputBuffer, inputExt) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hc-transcode-'));
  const inputPath = path.join(tmpDir, `in${inputExt || '.bin'}`);
  const outputPath = path.join(tmpDir, 'out.mp4');

  try {
    fs.writeFileSync(inputPath, inputBuffer);
    // MP4 H.264, CRF 23, AAC audio, faststart voor webbrowsers; max_muxing_queue voor lastige bronnen
    const cmdWithAudio = `ffmpeg -y -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -c:a aac -movflags +faststart -max_muxing_queue_size 1024 "${outputPath}"`;
    const cmdVideoOnly = `ffmpeg -y -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -an -movflags +faststart "${outputPath}"`;
    try {
      execSync(cmdWithAudio, { stdio: 'pipe', maxBuffer: 100 * 1024 * 1024 });
    } catch (e) {
      // Soms faalt AAC (geen of vreemde audiotrack); probeer zonder audio
      execSync(cmdVideoOnly, { stdio: 'pipe', maxBuffer: 100 * 1024 * 1024 });
    }
    const out = fs.readFileSync(outputPath);
    return out;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

async function uploadToBlob(buffer, key, contentType = 'video/mp4') {
  const { put } = require('@vercel/blob');
  const blob = await put(key, buffer, {
    access: 'public',
    token: BLOB_TOKEN,
    addRandomSuffix: true,
    contentType,
  });
  return blob.url;
}

async function main() {
  console.log('📹 Transcode bestaande video\'s naar MP4/H.264\n');
  console.log(DRY_RUN ? '🔍 Modus: dry-run (geen wijzigingen). Gebruik --run om uit te voeren.\n' : '⚠️  Modus: uitvoeren (--run). Database en Blob worden bijgewerkt.\n');

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL ontbreekt. Zet in .env.local of export.');
    process.exit(1);
  }

  if (!DRY_RUN && !BLOB_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN ontbreekt. Zet in .env.local of export.');
    process.exit(1);
  }

  if (!LIST_ONLY && !ensureFfmpeg()) {
    console.error('❌ FFmpeg niet gevonden. Installeer bijv. met: brew install ffmpeg');
    process.exit(1);
  }
  if (!LIST_ONLY) console.log('✅ FFmpeg gevonden\n');

  const dishVideos = await prisma.dishVideo.findMany({
    select: { id: true, dishId: true, url: true, dish: { select: { title: true } } },
  });
  let filteredDishVideos = dishVideos;
  if (dishIdFilter) {
    filteredDishVideos = dishVideos.filter((v) => v.dishId === dishIdFilter);
    console.log(`🔍 Filter: alleen dishId "${dishIdFilter}" → ${filteredDishVideos.length} video(s)\n`);
  } else if (dishTitleFilter) {
    filteredDishVideos = dishVideos.filter(
      (v) => (v.dish?.title || '').toLowerCase().includes(dishTitleFilter)
    );
    console.log(`🔍 Filter: titel bevat "${dishTitleFilter}" → ${filteredDishVideos.length} video(s)\n`);
    filteredDishVideos.forEach((v) => console.log(`   - ${v.dish?.title || v.dishId}`));
    console.log('');
  }

  if (LIST_ONLY) {
    console.log('DishVideo(s) in database:\n');
    dishVideos.forEach((v) => {
      console.log(`  Titel: ${v.dish?.title || '(geen titel)'}`);
      console.log(`  dishId: ${v.dishId}  |  video id: ${v.id}`);
      console.log(`  URL: ${v.url}\n`);
    });
    if (dishVideos.length === 0) console.log('  (geen dish-video\'s gevonden)');
    await prisma.$disconnect();
    return;
  }

  const productVideos = await prisma.productVideo.findMany({ select: { id: true, productId: true, url: true } });
  const productFiltered = dishIdFilter || dishTitleFilter ? [] : productVideos;
  const total = filteredDishVideos.length + productFiltered.length;
  console.log(`Te verwerken: ${filteredDishVideos.length} DishVideo(s), ${productFiltered.length} ProductVideo(s). Totaal: ${total}\n`);

  if (total === 0) {
    console.log('Geen video\'s om te transcoderen.');
    await prisma.$disconnect();
    return;
  }

  let done = 0;
  let failed = 0;

  const processItem = async (item, type, idField, dishTitle) => {
    const titleInfo = dishTitle ? ` "${dishTitle}"` : '';
    const label = `${type} ${item.id}${titleInfo}`;
    const url = item.url;

    if (!url || !url.startsWith('http')) {
      console.log(`⏭️  ${label}: overgeslagen (geen http(s)-URL)`);
      return;
    }

    if (DRY_RUN) {
      console.log(`[dry-run] Zou transcoderen: ${label} (${url.slice(0, 60)}...)`);
      done++;
      return;
    }

    try {
      const buf = await downloadVideo(url);
      let ext = '.mp4';
      try {
        ext = path.extname(new URL(url).pathname) || '.mp4';
      } catch (_) {}
      const transcoded = transcodeToMp4(buf, ext);
      const key = `videos/transcoded/${type.toLowerCase()}-${item.id}-${Date.now()}.mp4`;
      const newUrl = await uploadToBlob(transcoded, key);

      if (type === 'DishVideo') {
        await prisma.dishVideo.update({ where: { id: item.id }, data: { url: newUrl } });
      } else {
        await prisma.productVideo.update({ where: { id: item.id }, data: { url: newUrl } });
      }

      console.log(`✅ ${label}: getranscodeerd en URL bijgewerkt`);
      done++;
    } catch (err) {
      console.error(`❌ ${label}: ${err.message}`);
      failed++;
    }
  };

  for (const v of filteredDishVideos) {
    await processItem(v, 'DishVideo', 'dishId', v.dish?.title ?? null);
  }
  for (const v of productFiltered) {
    await processItem(v, 'ProductVideo', 'productId', null);
  }

  console.log(`\nKlaar. Succes: ${done}, mislukt: ${failed}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
