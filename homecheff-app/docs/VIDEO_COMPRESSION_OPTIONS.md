# Video Compressie Opties voor HomeCheff

## Overzicht van mogelijkheden om video's kleiner te maken

### 1. **Client-Side Compressie (Browser)**

#### A. WebCodecs API (Modern Browsers)
**Ondersteuning:**
- ✅ Chrome 94+ (2021)
- ✅ Edge 94+
- ✅ Safari 16.4+ (2023)
- ❌ Firefox (nog niet ondersteund, in ontwikkeling)

**Voordelen:**
- Snelle compressie in browser
- Geen server resources nodig
- Gebruiker ziet direct resultaat

**Nadelen:**
- Beperkte browser ondersteuning (geen Firefox)
- Complexe implementatie
- Alleen H.264 encoding beschikbaar

**Implementatie:**
```javascript
// Vereist WebCodecs API
const encoder = new VideoEncoder({
  output: (chunk) => { /* compressed data */ },
  error: (e) => console.error(e)
});
```

#### B. MediaRecorder API (Universeel)
**Ondersteuning:**
- ✅ Chrome/Edge (alle versies)
- ✅ Firefox (alle versies)
- ✅ Safari 11+ (2017)

**Voordelen:**
- Werkt in alle moderne browsers
- Eenvoudige implementatie
- Ondersteunt meerdere codecs (H.264, VP8, VP9)

**Nadelen:**
- Minder controle over compressie kwaliteit
- Alleen real-time recording (niet voor bestaande bestanden)
- Beperkte bitrate controle

**Implementatie:**
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000 // 2.5 Mbps
});
```

#### C. FFmpeg.wasm (WebAssembly)
**Ondersteuning:**
- ✅ Alle moderne browsers (via WebAssembly)

**Voordelen:**
- Volledige FFmpeg functionaliteit in browser
- Ondersteunt alle codecs en formaten
- Zeer goede compressie kwaliteit

**Nadelen:**
- Grote library size (~20MB)
- Langzamer dan native
- Complexe setup
- Kan geheugen intensief zijn

**Implementatie:**
```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg({ log: true });
await ffmpeg.load();
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
await ffmpeg.run('-i', 'input.mp4', '-c:v', 'libx264', '-crf', '23', 'output.mp4');
```

---

### 2. **Server-Side Compressie**

#### A. FFmpeg (Node.js)
**Ondersteuning:**
- ✅ Alle browsers (server-side)

**Voordelen:**
- Volledige controle over compressie
- Ondersteunt alle codecs (H.264, H.265, VP9, AV1)
- Beste compressie kwaliteit
- Kan batch processing doen

**Nadelen:**
- Server resources nodig
- Langzamer (moet uploaden, comprimeren, downloaden)
- Duurder (CPU/memory kosten)
- Vereist FFmpeg installatie

**Implementatie:**
```javascript
// Node.js met fluent-ffmpeg
const ffmpeg = require('fluent-ffmpeg');
ffmpeg(inputPath)
  .videoCodec('libx264')
  .audioCodec('aac')
  .outputOptions(['-crf 23', '-preset medium'])
  .size('1920x1080')
  .on('end', () => { /* done */ })
  .save(outputPath);
```

#### B. Cloud Services (AWS MediaConvert, Google Transcoder)
**Voordelen:**
- Geen server resources nodig
- Automatische scaling
- Professionele kwaliteit
- Ondersteunt alle formaten

**Nadelen:**
- Kosten per video
- Latency (upload → process → download)
- Externe dependency

---

### 3. **Hybride Aanpak (Aanbevolen)**

**Strategie:**
1. **Client-side detectie** van browser capabilities
2. **Progressive enhancement:**
   - Chrome/Edge: WebCodecs API (beste kwaliteit)
   - Firefox: MediaRecorder API (goede kwaliteit)
   - Safari: MediaRecorder API (goede kwaliteit)
   - Fallback: Server-side FFmpeg (voor alle browsers)

**Implementatie Flow:**
```
Video Upload
    ↓
Check Browser Support
    ↓
┌─────────────────────────────────┐
│ Chrome/Edge: WebCodecs API      │ → Compress → Upload
│ Firefox/Safari: MediaRecorder   │ → Compress → Upload
│ Fallback: Upload Original       │ → Server FFmpeg → Store
└─────────────────────────────────┘
```

---

### 4. **Compressie Instellingen per Codec**

#### H.264 (AVC) - Universeel ondersteund
**Instellingen:**
- **CRF (Constant Rate Factor):** 18-28
  - 18 = hoge kwaliteit, groot bestand
  - 23 = goede balans (aanbevolen)
  - 28 = lagere kwaliteit, klein bestand
- **Preset:** medium (balans snelheid/kwaliteit)
- **Max Resolution:** 1920x1080 (Full HD)
- **Bitrate:** 2-5 Mbps (afhankelijk van resolutie)

**Browser Support:**
- ✅ Chrome/Edge: Volledig
- ✅ Firefox: Volledig
- ✅ Safari: Volledig
- ✅ Mobile: Volledig

#### H.265 (HEVC) - Betere compressie
**Instellingen:**
- **CRF:** 23-28 (lagere waarden = betere compressie dan H.264)
- **Preset:** medium
- **Max Resolution:** 1920x1080

**Browser Support:**
- ✅ Chrome/Edge: Windows 10+ (hardware decode)
- ✅ Safari: macOS/iOS (hardware decode)
- ⚠️ Firefox: 120+ (beperkt, alleen MP4 container)
- ❌ Oudere browsers: Niet ondersteund

#### VP9 - Open standaard
**Instellingen:**
- **CRF:** 30-35
- **Max Resolution:** 1920x1080

**Browser Support:**
- ✅ Chrome/Edge: Volledig
- ✅ Firefox: Volledig
- ❌ Safari: Niet ondersteund

#### AV1 - Modernste codec
**Instellingen:**
- **CRF:** 30-35
- **Max Resolution:** 1920x1080

**Browser Support:**
- ✅ Chrome 90+: Volledig
- ✅ Firefox 93+: Volledig
- ✅ Edge 90+: Volledig
- ❌ Safari: Niet ondersteund

---

### 5. **Aanbevolen Implementatie voor HomeCheff**

#### Optie A: Client-Side met Fallback (Aanbevolen)
```javascript
async function compressVideo(file: File): Promise<Blob> {
  // 1. Check browser support
  if ('VideoEncoder' in window) {
    // WebCodecs API (Chrome/Edge)
    return await compressWithWebCodecs(file);
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    // MediaRecorder VP9 (Firefox/Chrome)
    return await compressWithMediaRecorder(file, 'vp9');
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    // MediaRecorder VP8 (Fallback)
    return await compressWithMediaRecorder(file, 'vp8');
  } else {
    // Upload original, compress server-side
    return file;
  }
}
```

**Compressie Doelen:**
- **Max Resolutie:** 1920x1080 (Full HD)
- **Max Bitrate:** 2.5 Mbps
- **Max File Size:** 10MB (na compressie)
- **Duration:** Max 30 seconden

#### Optie B: Server-Side Only (Meest Betrouwbaar)
- Upload origineel bestand
- Server comprimeert met FFmpeg
- Opslaan gecomprimeerde versie
- Origineel verwijderen

**Voordelen:**
- Werkt voor alle browsers
- Consistente kwaliteit
- Volledige controle

**Nadelen:**
- Langzamer (upload + compressie tijd)
- Server resources

---

### 6. **Bestandstype Conversie**

**Input Formaten (Huidig):**
- MP4 (H.264, H.265)
- MOV (QuickTime)
- WebM (VP8, VP9)
- 3GP (Mobile)
- AVI, MKV (Legacy)

**Output Formaten (Aanbevolen):**
1. **Primair:** MP4 (H.264) - Universeel ondersteund
2. **Secundair:** WebM (VP9) - Voor kleinere bestanden (Chrome/Firefox)
3. **Fallback:** MP4 (H.264) - Voor Safari/oudere browsers

**Conversie Strategie:**
```javascript
// Detecteer input codec
if (isHEVC(inputFile)) {
  // Converteer H.265 → H.264 (betere browser support)
  convertToH264(inputFile);
} else if (isVP9(inputFile)) {
  // Behoud VP9 of converteer naar H.264
  if (targetBrowser === 'chrome' || targetBrowser === 'firefox') {
    keepVP9(inputFile);
  } else {
    convertToH264(inputFile);
  }
}
```

---

### 7. **Praktische Aanbevelingen**

#### Voor HomeCheff (Korte Video's, 30 sec max):

**Aanbevolen Aanpak:**
1. **Client-side compressie** met MediaRecorder API (universeel)
2. **Target:** 1920x1080 @ 2.5 Mbps, H.264
3. **Max file size:** 10MB na compressie
4. **Fallback:** Server-side FFmpeg voor grote/complexe bestanden

**Implementatie Prioriteit:**
1. ✅ MediaRecorder API (universeel, eenvoudig)
2. ✅ Server-side FFmpeg fallback
3. ⚠️ WebCodecs API (optioneel, alleen Chrome/Edge)
4. ❌ FFmpeg.wasm (te complex, te groot)

**Verwachte Resultaten:**
- **Origineel:** 8-50MB
- **Na compressie:** 2-10MB (70-80% reductie)
- **Kwaliteit:** Goed genoeg voor web (1920x1080)
- **Upload tijd:** Sneller (kleinere bestanden)

---

### 8. **Browser Specifieke Overwegingen**

#### Firefox
- ✅ MediaRecorder met VP9 (beste optie)
- ✅ H.264 in MP4 (universeel)
- ⚠️ HEVC/H.265 (alleen Firefox 120+, MP4 container)
- ❌ WebCodecs API (nog niet ondersteund)

#### Chrome/Edge
- ✅ WebCodecs API (beste kwaliteit)
- ✅ MediaRecorder met VP9
- ✅ H.264/H.265 (hardware decode)
- ✅ AV1 (moderne versies)

#### Safari
- ✅ MediaRecorder met H.264
- ✅ H.264/H.265 (hardware decode)
- ❌ VP9/AV1 (niet ondersteund)
- ❌ WebCodecs API (alleen Safari 16.4+)

---

### 9. **Implementatie Checklist**

- [ ] Detecteer browser capabilities
- [ ] Implementeer MediaRecorder compressie
- [ ] Stel compressie parameters in (resolutie, bitrate)
- [ ] Test in alle browsers (Chrome, Firefox, Safari, Edge)
- [ ] Implementeer server-side fallback (FFmpeg)
- [ ] Test met verschillende video formaten
- [ ] Monitor compressie ratio's
- [ ] Valideer kwaliteit na compressie
- [ ] Update error handling
- [ ] Documenteer compressie instellingen

---

### 10. **Kosten Overwegingen**

**Client-Side:**
- ✅ Geen server kosten
- ✅ Sneller voor gebruiker
- ⚠️ Browser resources (CPU/geheugen)

**Server-Side:**
- ⚠️ CPU/memory kosten per video
- ⚠️ Langere processing tijd
- ⚠️ Storage voor tijdelijke bestanden
- ✅ Consistente kwaliteit

**Aanbeveling:**
- Gebruik client-side waar mogelijk
- Server-side alleen als fallback of voor grote bestanden (>20MB)




