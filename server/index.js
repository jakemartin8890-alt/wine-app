import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json({ limit: "10mb" }));

const anthropic = new Anthropic();

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function getField(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

// ── Type → CSS colour mapping ────────────────────────────────────────────────

const TYPE_CSS = {
  red:       "#8B1A1A",
  white:     "#EDE8C4",
  "rosé":    "#F4A7B9",
  sparkling: "#F7E7A0",
};

function varietyToType(variety) {
  const v = (variety || "").toLowerCase();
  if (/champagne|sparkling|prosecco|cava|cr[eé]mant|franciacorta|sekt|p[eé]tillant|fizz/.test(v))
    return "sparkling";
  if (/ros[eé]|rosado|rosato|blush/.test(v))
    return "rosé";
  if (/white|chardonnay|sauvignon blanc|riesling|pinot gr[ia]|gewürz|gewurz|viognier|albar[ií]ño|albarino|chenin|muscat|verdejo|grüner|gruner|torront|verment|verdicchio|fiano|greco|gavi|cortese|pinot blanc|marsanne|roussanne|trebbiano|assyrtiko|m[üu]ller|silvaner|weissb/.test(v))
    return "white";
  return "red";
}

// ── Winemag dataset loader ───────────────────────────────────────────────────

function loadWinemag() {
  const csvPath = join(__dirname, "../data/winemag.csv");
  if (!existsSync(csvPath)) return [];

  const text  = readFileSync(csvPath, "utf8");
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);

  const wines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row    = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim(); });

    const winery      = getField(row, "winery");
    const designation = getField(row, "designation");
    const variety     = getField(row, "variety");
    const country     = getField(row, "country");
    const region      = getField(row, "region_1") || getField(row, "province");
    const province    = getField(row, "province");
    const description = getField(row, "description");
    const pointsRaw   = getField(row, "points");
    const priceRaw    = getField(row, "price");

    if (!winery && !variety) continue;

    const name   = designation ? `${winery} ${designation}` : `${winery} ${variety}`;
    const points = parseFloat(pointsRaw) || 0;
    const price  = priceRaw && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const type   = varietyToType(variety);

    // Normalize 80–100 points to 0–5: 80→3.0, 90→4.0, 95→4.5, 100→5.0
    const rating = points >= 80 ? Math.min(5, parseFloat(((points - 80) / 10 + 3).toFixed(1))) : null;

    wines.push({
      id:          String(i),
      name,
      producer:    winery,
      grape:       variety,
      region:      region || province,
      country,
      type,
      color:       TYPE_CSS[type] || "#5a3a4a",
      rating,
      points:      points || null,
      price,
      notes:       description,
      source:      "winemag",
      searchText:  `${name} ${winery} ${variety} ${region} ${province} ${country}`.toLowerCase(),
    });
  }
  return wines;
}

// ── LWIN dataset loader (fallback if Winemag not present) ────────────────────

const LWIN_COLOUR_CSS  = { red: "#8B1A1A", white: "#EDE8C4", "rosé": "#F4A7B9", rose: "#F4A7B9", sparkling: "#F7E7A0", champagne: "#F7E7A0", fortified: "#7B3F00" };
const LWIN_COLOUR_TYPE = { red: "red", white: "white", "rosé": "rosé", rose: "rosé", sparkling: "sparkling", champagne: "sparkling" };

function loadLWIN() {
  const csvPath = join(__dirname, "../data/lwin.csv");
  if (!existsSync(csvPath)) return [];

  const text    = readFileSync(csvPath, "utf8");
  const lines   = text.split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(normalizeHeader);

  const wines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row    = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim(); });

    const lwin     = getField(row, "lwin", "lwin_code", "code");
    const name     = getField(row, "display_name", "wine_name", "name");
    const producer = getField(row, "producer_name", "producer");
    const country  = getField(row, "country");
    const region   = getField(row, "sub_region", "subregion", "region");
    const colour   = getField(row, "colour", "color");
    const type     = getField(row, "type");
    if (!lwin || !name) continue;

    const cl = colour.toLowerCase();
    wines.push({
      id:         lwin,
      lwin,
      name,
      producer,
      region,
      country,
      colour,
      type:       LWIN_COLOUR_TYPE[cl] || LWIN_COLOUR_TYPE[type.toLowerCase()] || "other",
      color:      LWIN_COLOUR_CSS[cl] || "#5a3a4a",
      source:     "lwin",
      searchText: `${name} ${producer} ${region} ${country}`.toLowerCase(),
    });
  }
  return wines;
}

// ── Download Winemag CSV if not present ──────────────────────────────────────

const WINEMAG_URL = "https://raw.githubusercontent.com/stoltzmaniac/wine-reviews-kaggle/master/winemag-data_first150k.csv";
const WINEMAG_PATH = join(__dirname, "../data/winemag.csv");

async function ensureWinemag() {
  mkdirSync(join(__dirname, "../data"), { recursive: true });
  if (existsSync(WINEMAG_PATH)) return;

  console.log("Winemag dataset not found — downloading (~47 MB)...");
  const res = await fetch(WINEMAG_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const buffer = await res.arrayBuffer();
  writeFileSync(WINEMAG_PATH, Buffer.from(buffer));
  console.log("Winemag dataset downloaded.");
}

// ── Load whichever dataset is available ──────────────────────────────────────

let wineDb = [];

// ── Wine search endpoint ──────────────────────────────────────────────────────

app.get("/api/wines/search", (req, res) => {
  const { q = "", type = "all", page = "1", limit = "24" } = req.query;
  const lq  = q.toLowerCase().trim();
  const pg  = Math.max(1, parseInt(page) || 1);
  const lm  = Math.min(50, Math.max(1, parseInt(limit) || 24));

  let results = wineDb;

  if (type !== "all") {
    results = results.filter((w) => w.type === type);
  }

  if (lq) {
    results = results.filter((w) => w.searchText.includes(lq));
  }

  const total = results.length;
  const start = (pg - 1) * lm;

  res.json({
    wines:   results.slice(start, start + lm),
    total,
    page:    pg,
    limit:   lm,
    hasMore: start + lm < total,
  });
});

// ── AI enrichment endpoint (server-side cached) ───────────────────────────────

const enrichCache = new Map();

app.post("/api/wines/enrich", async (req, res) => {
  const { id, name, producer, region, country, colour } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  if (enrichCache.has(id)) return res.json(enrichCache.get(id));

  const prompt = `You are a wine expert. Provide a brief tasting profile for this wine based on its regional and varietal characteristics.

Wine: ${name}
Producer: ${producer || "unknown"}
Region: ${region || "unknown"}, ${country || "unknown"}
Style: ${colour || "unknown"}

Return ONLY valid JSON — no markdown, no explanation:
{
  "grapes": ["Primary Grape", "Secondary Grape"],
  "style": "Brief style descriptor (e.g. Full-bodied and tannic)",
  "notes": "2-3 sentence tasting profile based on typical characteristics of this wine's region and producer reputation",
  "pairings": ["Food 1", "Food 2", "Food 3"]
}`;

  try {
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw    = response.content[0].text.trim();
    const parsed = JSON.parse(raw);
    const result = { ...parsed, aiGenerated: true };

    enrichCache.set(id, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ── Sommelier chat ────────────────────────────────────────────────────────────

const SYSTEM = `You are Vino, a master sommelier with 20 years of experience across the great wine regions of Burgundy, Bordeaux, Tuscany, Rioja, Napa Valley, and beyond. You are knowledgeable, warm, and specific — like a brilliant friend who happens to be a sommelier, not a stuffy textbook.

Guidelines:
- Lead with the answer. No unnecessary preamble.
- When recommending wines, name specific producers or estates whenever possible.
- Always include approximate price ranges in USD.
- Be precise about regions and appellations (e.g. Gevrey-Chambertin, not just "Burgundy").
- Explain *why* a wine works — connect grape, climate, structure, and flavor briefly.
- Keep responses conversational, warm, and focused. Around 100–200 words unless the question genuinely needs more depth.
- For questions like "bold red under $30" always give 2–3 specific options with producers and prices.
- If asked something outside your expertise, say so honestly and pivot to what you do know.`;

app.post("/api/sommelier", async (req, res) => {
  const { messages } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model:      "claude-opus-4-6",
      max_tokens: 1024,
      system:     SYSTEM,
      messages,
    });

    stream.on("text", (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// ── Wine label scanner ────────────────────────────────────────────────────────

const SCAN_PROMPT = `You are a wine expert analyzing a wine label photo. Extract all visible information and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

Return this shape:
{
  "name": "Full wine name including producer",
  "vintage": 2019,
  "region": "Appellation, Country",
  "grapes": ["Grape 1", "Grape 2"],
  "rating": 4.2,
  "notes": "2-3 sentence tasting notes based on the wine's known profile",
  "pairings": ["Food 1", "Food 2", "Food 3"],
  "priceRange": "$30–50",
  "confidence": "high"
}

Rules:
- vintage is a number or null if not visible
- rating is a number 0–5 based on producer/vintage reputation
- confidence is "high", "medium", or "low" based on label clarity and how well-known the wine is
- If the image does not contain a readable wine label, return exactly: {"error": "Could not identify a wine label in this image"}`;

app.post("/api/scan", async (req, res) => {
  const { imageData, mediaType } = req.body;
  if (!imageData || !mediaType) {
    return res.status(400).json({ error: "imageData and mediaType are required" });
  }

  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
          { type: "text",  text: SCAN_PROMPT },
        ],
      }],
    });

    const raw    = response.content[0].text.trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ── Serve built frontend in production ────────────────────────────────────────

if (isProd) {
  const distPath = join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_, res) => res.sendFile(join(distPath, "index.html")));
}

// ── Async startup: download data then listen ──────────────────────────────────

async function start() {
  try {
    await ensureWinemag();
  } catch (err) {
    console.warn(`Winemag download failed (${err.message}) — will use mock data fallback`);
  }

  wineDb = loadWinemag();
  if (wineDb.length > 0) {
    console.log(`Loaded ${wineDb.length} wines from Winemag dataset`);
  } else {
    wineDb = loadLWIN();
    if (wineDb.length > 0) {
      console.log(`Loaded ${wineDb.length} wines from LWIN`);
    } else {
      console.log("No wine dataset found — Discover will fall back to mock data");
    }
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`Sommelier server running on http://localhost:${PORT}`)
  );
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
