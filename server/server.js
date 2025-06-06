// server/server.js
import express from 'express';
import cors from 'cors';

// Dynamically import node-fetch for CommonJS
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

// Allow CORS from your React front end (assumed on localhost:3001)
app.use(
  cors({
    origin: 'http://localhost:3001',
  })
);

// ---- Root health check ----
app.get('/', (req, res) => {
  res.send("Welcome to the FRED API Proxy Server");
});

// ---- Utility: fetch-from-FRED with simple retry logic ----
async function fetchWithRetry(url, options = {}, maxAttempts = 3, retryDelayMs = 500) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(url, options);

      // If the response is okay (2xx), return it immediately
      if (response.ok) {
        return response;
      }

      // If it's a non-2xx status, we still read the body (for logging) then throw
      const text = await response.text();
      console.error(`❌ [Attempt ${attempt}] FRED returned status ${response.status}: ${text}`);
      throw new Error(`FRED API returned ${response.status}`);
    } catch (err) {
      // Log the error and retry (unless we've exhausted attempts)
      console.error(`🚨 [Attempt ${attempt}] Error fetching from FRED:`, err.message || err);
      if (attempt >= maxAttempts) {
        // Re-throw so caller knows we failed totally
        throw err;
      }
      // Otherwise, wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      console.log(`🔁 Retrying FRED fetch (attempt ${attempt + 1} of ${maxAttempts})...`);
    }
  }
  // If we exit loop, throw generic
  throw new Error("Exceeded maximum retry attempts");
}

// ---- /api/fred route ----
app.get('/api/fred', async (req, res) => {
  console.log("🔵 Received request to /api/fred");

  const { series_id, observation_start, observation_end } = req.query;

  // Hardcoded API key
  const FRED_API_KEY = "cfdfb840bdcd3a6469164f42a1522176";

  // Validate required query parameters
  if (!series_id || !observation_start || !observation_end) {
    console.error("❌ Missing required parameters.");
    return res.status(400).json({ error: "Missing required parameters." });
  }

  // Construct the FRED URL
  const fredUrl =
    "https://api.stlouisfed.org/fred/series/observations?" +
    new URLSearchParams({
      series_id,
      api_key: FRED_API_KEY,
      file_type: "json",
      observation_start,
      observation_end,
    });

  console.log("📡 Fetching from FRED URL:", fredUrl);

  try {
    // Use our retry helper
    const response = await fetchWithRetry(fredUrl, {}, 3, 500);

    // Read the body (we already know response.ok === true)
    const text = await response.text();
    console.log("📦 [Success] Raw response (first 300 chars):", text.slice(0, 300));

    // Parse JSON and return to client
    const data = JSON.parse(text);
    console.log("✅ Data successfully fetched from FRED");
    return res.json(data);
  } catch (err) {
    console.error("🚨 Server: Failed to fetch from FRED after retries:", err.message || err);
    return res.status(500).json({
      error: "Failed to fetch data from FRED API due to server-side error.",
    });
  }
});

// ---- Start listening ----
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
});
