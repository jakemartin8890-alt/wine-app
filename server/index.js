import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

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
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM,
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
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageData },
            },
            { type: "text", text: SCAN_PROMPT },
          ],
        },
      ],
    });

    const raw = response.content[0].text.trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Serve built frontend in production
if (isProd) {
  const distPath = join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_, res) => res.sendFile(join(distPath, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Sommelier server running on http://localhost:${PORT}`)
);
