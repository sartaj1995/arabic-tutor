// Offline TTS pipeline: walks every content/levels/*.json, collects the
// unique { id, text } audio references (letters, vocab, sentence patterns),
// and synthesizes any that don't already have an MP3 in public/audio/.
//
// Usage:
//   npm run generate-audio                 generate anything missing
//   npm run generate-audio -- --force       regenerate everything
//   npm run generate-audio -- --dry-run     list what would be generated, no API calls, no cost
//   npm run generate-audio -- --only=letter_alif,word_bayt   regenerate specific ids
//
// Requires GOOGLE_TTS_API_KEY (see .env.example).

import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVELS_DIR = path.join(ROOT, "content", "levels");
const AUDIO_DIR = path.join(ROOT, "public", "audio");

const VOICE_NAME = process.env.GOOGLE_TTS_VOICE || "ar-XA-Wavenet-B";
const LANGUAGE_CODE = "ar-XA";
const API_KEY = process.env.GOOGLE_TTS_API_KEY;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY_RUN = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

function collectAudioRefs() {
  const refs = new Map(); // id -> { text, sources: string[] }
  const files = readdirSync(LEVELS_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const level = JSON.parse(readFileSync(path.join(LEVELS_DIR, file), "utf8"));
    const collect = (items) => {
      for (const item of items ?? []) {
        if (!item.audio) continue;
        const { id, text } = item.audio;
        const existing = refs.get(id);
        if (existing && existing.text !== text) {
          console.warn(
            `⚠ audio id "${id}" has conflicting text across files: "${existing.text}" vs "${text}" (${file})`,
          );
        }
        refs.set(id, { text, sources: [...(existing?.sources ?? []), file] });
      }
    };
    collect(level.letters);
    collect(level.vocab);
    collect(level.patterns);
  }

  return refs;
}

async function synthesize(text) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANGUAGE_CODE, name: VOICE_NAME },
        audioConfig: { audioEncoding: "MP3" },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const { audioContent } = await res.json();
  return Buffer.from(audioContent, "base64");
}

async function main() {
  const refs = collectAudioRefs();
  const entries = [...refs.entries()].filter(([id]) => !ONLY || ONLY.has(id));

  mkdirSync(AUDIO_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Found ${entries.length} audio references (voice: ${VOICE_NAME})`);
  if (DRY_RUN) console.log("--dry-run: no API calls will be made.\n");

  if (!DRY_RUN && !API_KEY) {
    console.error("Missing GOOGLE_TTS_API_KEY. See .env.example for setup.");
    process.exit(1);
  }

  for (const [id, { text }] of entries) {
    const outPath = path.join(AUDIO_DIR, `${id}.mp3`);
    const exists = existsSync(outPath);

    if (exists && !FORCE) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`would generate: ${id.padEnd(24)} "${text}"`);
      generated++;
      continue;
    }

    try {
      const audio = await synthesize(text);
      writeFileSync(outPath, audio);
      console.log(`✓ ${id.padEnd(24)} "${text}"`);
      generated++;
      // Be polite to the API rather than firing 90+ requests at once.
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.error(`✗ ${id.padEnd(24)} "${text}" — ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. Generated: ${generated}, skipped (already exist): ${skipped}, failed: ${failed}.`,
  );
  if (failed > 0) process.exit(1);
}

main();
