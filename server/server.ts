/**
 * Express server for stock quote API
 * 
 * This server provides a REST API endpoint to fetch stock quotes
 * and serves static files from the web/ directory.
 */

import express from "express";
import { fetchQuote } from "../src/stooq.js";

// Create Express application
const app = express();

// Serve static files from the web/ directory
// This allows the server to serve HTML, CSS, JavaScript, and other static assets
app.use(express.static("web"));

/**
 * GET /api/quote
 * 
 * Fetches a stock quote for the given symbol
 * 
 * Query parameters:
 *   - symbol: The stock symbol to fetch (e.g., "AAPL", "MSFT", "aapl.us")
 * 
 * Returns:
 *   - 200: JSON object with { symbol, date, time, close }
 *   - 400: Bad request if symbol is missing
 *   - 502: Bad gateway if upstream service (Stooq) fails
 */
app.get("/api/quote", async (req, res) => {
  try {
    // Get the symbol from query parameters
    const symbol = req.query.symbol;

    // Validate that symbol is provided
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
      return res.status(400).json({
        error: "Missing or invalid 'symbol' query parameter",
      });
    }

    // Fetch the quote from Stooq
    // This will throw an error if the symbol is invalid or the upstream service fails
    const quote = await fetchQuote(symbol.trim());

    // Return the quote data as JSON
    res.json({
      symbol: quote.symbol,
      date: quote.date,
      time: quote.time,
      close: quote.close,
    });
  } catch (error) {
    // Handle errors from fetchQuote
    // These could be network errors, invalid symbols, or upstream service failures
    console.error("Error fetching quote:", error);

    // Return 502 (Bad Gateway) for upstream service failures
    // This indicates the server received an invalid response from the upstream service
    res.status(502).json({
      error: "Failed to fetch quote from upstream service",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server on port 3000
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving static files from web/ directory`);
  console.log(`API endpoint: GET /api/quote?symbol=<SYMBOL>`);
});

