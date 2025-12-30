/**
 * Stock price alert system
 * 
 * This module provides functionality to monitor stock prices and
 * trigger alerts when prices cross specified thresholds.
 */

import { fetchQuote } from "./stooq.js";

/**
 * Direction for price alerts
 * - "above": Alert when price goes above or equal to target
 * - "below": Alert when price goes below or equal to target
 */
export type Direction = "above" | "below";

/**
 * Configuration for a price alert
 * 
 * @property symbol - The stock symbol to monitor (e.g., "AAPL", "MSFT")
 * @property target - The target price to watch for
 * @property direction - Whether to alert when price goes "above" or "below" the target
 * @property intervalMs - How often to check the price in milliseconds
 */
export type AlertConfig = {
  symbol: string;
  target: number;
  direction: Direction;
  intervalMs: number;
};

/**
 * Runs a price alert that polls for stock prices and triggers when threshold is crossed
 * 
 * This function continuously polls the stock price at the specified interval.
 * When the price crosses the threshold (above or below the target), it prints
 * an alert message and stops polling.
 * 
 * Network errors are handled gracefully - if a fetch fails, it will retry
 * on the next poll interval instead of crashing.
 * 
 * @param config - The alert configuration
 * @returns A promise that resolves when the alert is triggered or polling stops
 */
export async function runAlert(config: AlertConfig): Promise<void> {
  const { symbol, target, direction, intervalMs } = config;

  // Validate configuration
  if (intervalMs <= 0) {
    throw new Error("intervalMs must be greater than 0");
  }

  if (target <= 0) {
    throw new Error("target price must be greater than 0");
  }

  console.log(
    `Starting alert for ${symbol}: watching for price ${direction} ${target} (checking every ${intervalMs}ms)`
  );

  // Keep polling until the alert is triggered
  while (true) {
    try {
      // Fetch the current stock quote
      const quote = await fetchQuote(symbol);

      // Get the current price
      const currentPrice = quote.close;

      // Print the current price
      console.log(
        `[${quote.date} ${quote.time}] ${symbol}: $${currentPrice.toFixed(2)}`
      );

      // Check if the price has crossed the threshold
      let thresholdCrossed = false;

      if (direction === "above") {
        // Alert when price is greater than or equal to target
        thresholdCrossed = currentPrice >= target;
      } else {
        // Alert when price is less than or equal to target
        thresholdCrossed = currentPrice <= target;
      }

      // If threshold is crossed, trigger alert and stop polling
      if (thresholdCrossed) {
        console.log(
          `\n🚨 ALERT: ${symbol} price ($${currentPrice.toFixed(2)}) has crossed ${direction} target ($${target.toFixed(2)})!`
        );
        console.log(`Alert triggered at ${quote.date} ${quote.time}`);
        break; // Stop polling
      }

      // Wait for the specified interval before next poll
      await sleep(intervalMs);
    } catch (error) {
      // Handle network errors and other exceptions gracefully
      // Print error but continue polling on next interval
      console.error(
        `Error fetching quote for ${symbol}:`,
        error instanceof Error ? error.message : String(error)
      );
      console.log(`Retrying in ${intervalMs}ms...`);

      // Wait for the interval before retrying
      await sleep(intervalMs);
    }
  }
}

/**
 * Helper function to sleep for a specified number of milliseconds
 * 
 * @param ms - Milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

