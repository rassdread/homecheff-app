# Video: database, formaat en compressie

Dit document beschrijft hoe video’s worden opgehaald, in welk formaat ze moeten staan en hoe compressie werkt, zodat alles werkt op **alle browsers (desktop en mobiel)**.

---

## 1. Video volledig uit de database

- **API:** `GET /api/inspiratie` (en andere endpoints die dishes met video tonen) halen video’s **volledig** uit de database.
- **Database:** Tabel `DishVideo` (en `ProductVideo`) met o.a.:
  - `id`, `dishId`, `url`, `thumbnail`, `duration`, `fileSize`, `createdAt`
- **Response:** Per item worden alle video’s meegestuurd met o.a.:
  - `id`, `url`, `thumbnail`, `duration`
- De **url** wijst naar het bestand (bijv. Vercel Blob). Er wordt niets weggelaten; het bestand wordt via de **video-proxy** (`/api/video-proxy`) geserveerd voor CORS en range-requests (o.a. Safari/iOS).

**Relevante code:**
- `app/api/inspiratie/route.ts`: `videos` in de `select` en in de getransformeerde `items`.
- `lib/videoUtils.ts`: `getVideoUrlWithCors()` voor proxy-URL bij Vercel Blob.

---

## 2. Formaat: geschikt voor alle browsers (desktop + mobiel)

Om op **alle** browsers te werken (Chrome, Firefox, Safari, Edge, desktop én mobiel, incl. iOS):

- **Gebruik alleen MP4 (H.264 video, AAC audio).**
- **Geen WebM** voor opslag/weergave: Safari (o.a. iPhone/iPad) ondersteunt WebM niet voor `<video>`.

| Formaat | Desktop Chrome/Edge/Firefox | Safari (macOS) | iOS (Safari) |
|--------|------------------------------|----------------|--------------|
| **MP4 (H.264/AAC)** | ✅ | ✅ | ✅ |
| WebM (VP8/VP9)      | ✅ | ❌ | ❌ |

Daarom:
- **Comprimeren** mag alleen naar **MP4** (zie hieronder).
- **Bestaande bestanden** die al WebM zijn, spelen niet op Safari/iOS; die kun je het beste (eenmalig) naar MP4 transcoderen (bijv. met `scripts/transcode-existing-videos.js` of een server-side tool).

---

## 3. Compressie: alleen MP4 of overslaan

- **Plaats:** `lib/videoUtils.ts` – functie `compressVideo()`.
- **Regel:**
  - Als `MediaRecorder.isTypeSupported('video/mp4')` **waar** is → comprimeren naar **MP4** en dat bestand uploaden.
  - Zo niet (bijv. Safari die geen MP4 via MediaRecorder ondersteunt) → **geen** compressie: het **originele bestand** wordt geüpload. Zo voorkom je dat er een WebM wordt opgeslagen die op Safari/iOS niet afspeelt.
- **Geen WebM:** Er wordt niet meer naar WebM gecomprimeerd; de oude fallbacks (webm;codecs=vp9, vp8, webm) zijn verwijderd voor deze upload-flow.
- **Audio:** Compressie start na `loadeddata` (niet alleen `loadedmetadata`) zodat de audiotrack beschikbaar kan zijn voor `captureStream()`; anders valt de code terug op “canvas only” (geen audio in de gecomprimeerde video).

**Samenvatting:**
- Output van compressie = **één bestand**: ofwel **MP4** (alle browsers), ofwel het **originele bestand** (geen compressie).
- Dat bestand wordt geüpload en in de database opgeslagen als `url`; de frontend haalt de video volledig op via de API en speelt af via de video-proxy waar nodig.

---

## 4. Controle: of compressie “juist” gebeurt

- **Correct gedrag:**
  - Browser ondersteunt MP4 via MediaRecorder → gecomprimeerd **MP4** wordt geüpload.
  - Browser ondersteunt geen MP4 via MediaRecorder → **origineel** bestand wordt geüpload (geen WebM).
- **In de console:**
  - `📹 Comprimeren naar video/mp4 (geschikt voor alle browsers)` = compressie naar MP4.
  - `⚠️ MediaRecorder ondersteunt geen video/mp4 (bijv. Safari); gebruik origineel bestand voor compatibiliteit.` = geen compressie, origineel wordt gebruikt.
- **Na upload:** Controleer in de app of de video op **desktop (Chrome/Firefox/Safari)** en op **mobiel (iOS + Android)** afspeelt. Als de opslag alleen MP4 of originele bestanden bevat, zou het overal moeten werken.

---

## 5. Bestaande video’s (transcoderen naar MP4)

Voor bestanden die al als WebM of ander niet-Safari-vriendelijk formaat in Blob staan (of een item dat “Video kon niet laden” geeft):

- **Script:** `scripts/transcode-existing-videos.js` – downloadt de video van de huidige URL, transcodeert met FFmpeg naar MP4 (H.264 + AAC), uploadt naar Blob en werkt de database-URL bij.
- **Vereisten:** FFmpeg geïnstalleerd (`brew install ffmpeg`), `DATABASE_URL` en `BLOB_READ_WRITE_TOKEN` in `.env.local` (of in de omgeving waar je het script draait).

**Commando’s:**

| Commando | Doel |
|----------|------|
| `node scripts/transcode-existing-videos.js --list` | Toon alle dish-video’s (titel, dishId, url) om het juiste item te vinden. |
| `node scripts/transcode-existing-videos.js` | Dry-run: toon wat er zou worden getranscodeerd (geen wijzigingen). |
| `node scripts/transcode-existing-videos.js --run` | Transcodeer **alle** dish- en productvideo’s en werk de DB bij. |
| `node scripts/transcode-existing-videos.js --dish "naan" --run` | Alleen dishes waarvan de titel “naan” bevat (bijv. “Garlic cheese naan”). |
| `node scripts/transcode-existing-videos.js --id <dishId> --run` | Alleen de video van het dish met dit `dishId` (uit --list). |

**Eén item traceren en repareren:** draai eerst `--list` om titel en `dishId` te zien, daarna `--dish "deel van titel" --run` of `--id <dishId> --run`.

---

## 6. Korte referentie

| Onderdeel        | Regels |
|------------------|--------|
| **Database**     | Video volledig opgehaald (id, url, thumbnail, duration). |
| **Formaat**      | Alleen MP4 (H.264/AAC) voor universele weergave. |
| **Compressie**   | Alleen comprimeren naar MP4; anders origineel uploaden (geen WebM). |
| **Weergave**     | URL via `getVideoUrlWithCors()` / video-proxy voor CORS en range (Safari). |

Dit bestand is de afspraak voor: “video volledig uit de database, formaat dat overal werkt, compressie die daarop is afgestemd.”
