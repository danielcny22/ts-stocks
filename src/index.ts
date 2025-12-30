/**
 * Stock Price Alert CLI
 * 
 * This is the main entry point for the stock price alert application.
 * It provides a command-line interface for setting up and running price alerts.
 */

import * as readline from "node:readline";
import { runAlert, type AlertConfig, type Direction } from "./alert.js";

/**
 * Creates a readline interface for user input
 * This allows us to prompt the user and read their responses
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts the user for input and returns their response
 * 
 * @param rl - The readline interface
 * @param question - The question to ask the user
 * @returns A promise that resolves to the user's input (trimmed)
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts the user for a stock symbol and validates it
 * 
 * @param rl - The readline interface
 * @returns A promise that resolves to a valid stock symbol
 */
async function promptSymbol(rl: readline.Interface): Promise<string> {
  while (true) {
    const symbol = await askQuestion(
      rl,
      "Enter stock symbol (e.g., aapl.us): "
    );

    // Validate that symbol is not empty
    if (symbol.length === 0) {
      console.log("❌ Symbol cannot be empty. Please try again.\n");
      continue;
    }

    return symbol;
  }
}

/**
 * Prompts the user for a target price and validates it
 * 
 * @param rl - The readline interface
 * @returns A promise that resolves to a valid target price (number)
 */
async function promptTargetPrice(rl: readline.Interface): Promise<number> {
  while (true) {
    const input = await askQuestion(rl, "Enter target price: ");

    // Try to parse the input as a number
    const target = parseFloat(input);

    // Validate that it's a valid number and positive
    if (isNaN(target)) {
      console.log("❌ Invalid number. Please enter a valid price.\n");
      continue;
    }

    if (target <= 0) {
      console.log("❌ Target price must be greater than 0. Please try again.\n");
      continue;
    }

    return target;
  }
}

/**
 * Prompts the user for a direction (above/below) and validates it
 * 
 * @param rl - The readline interface
 * @returns A promise that resolves to a valid direction ("above" or "below")
 */
async function promptDirection(rl: readline.Interface): Promise<Direction> {
  while (true) {
    const input = await askQuestion(
      rl,
      "Enter direction (above/below): "
    );

    const direction = input.toLowerCase();

    // Validate that it's either "above" or "below"
    if (direction === "above" || direction === "below") {
      return direction;
    }

    console.log('❌ Invalid direction. Please enter "above" or "below".\n');
  }
}

/**
 * Prompts the user for polling interval and validates it
 * Uses a default value of 10 seconds if input is empty
 * 
 * @param rl - The readline interface
 * @returns A promise that resolves to a valid polling interval in seconds
 */
async function promptInterval(rl: readline.Interface): Promise<number> {
  while (true) {
    const input = await askQuestion(
      rl,
      "Enter polling interval in seconds (default: 10): "
    );

    // If empty, use default value of 10
    if (input.length === 0) {
      return 10;
    }

    // Try to parse the input as a number
    const interval = parseFloat(input);

    // Validate that it's a valid number and positive
    if (isNaN(interval)) {
      console.log("❌ Invalid number. Please enter a valid interval.\n");
      continue;
    }

    if (interval <= 0) {
      console.log("❌ Interval must be greater than 0. Please try again.\n");
      continue;
    }

    return interval;
  }
}

/**
 * Sets up command handling while the alert is running
 * Listens for 'q' to quit immediately
 * 
 * @param rl - The readline interface
 */
function setupCommandHandling(rl: readline.Interface): void {
  // Listen for input while the alert is running
  rl.on("line", (input: string) => {
    const command = input.trim().toLowerCase();

    if (command === "q") {
      console.log("\n👋 Quitting...");
      rl.close();
      process.exit(0);
    }
  });
}

/**
 * Main function that runs the CLI
 * Prompts for all inputs, validates them, and starts the alert
 */
async function main(): Promise<void> {
  console.log("📈 Stock Price Alert System\n");
  console.log("This tool will monitor a stock price and alert you when it crosses a threshold.\n");

  // Create readline interface for user input
  const rl = createReadlineInterface();

  try {
    // Prompt for all required inputs
    const symbol = await promptSymbol(rl);
    const target = await promptTargetPrice(rl);
    const direction = await promptDirection(rl);
    const intervalSeconds = await promptInterval(rl);

    // Convert interval from seconds to milliseconds
    const intervalMs = intervalSeconds * 1000;

    // Create the alert configuration
    const config: AlertConfig = {
      symbol,
      target,
      direction,
      intervalMs,
    };

    // Close the readline interface before starting the alert
    // (We'll create a new one for command handling)
    rl.close();

    // Show instructions
    console.log("\n" + "=".repeat(50));
    console.log("Alert Started!");
    console.log("=".repeat(50));
    console.log(`Symbol: ${symbol}`);
    console.log(`Target: $${target.toFixed(2)}`);
    console.log(`Direction: ${direction}`);
    console.log(`Polling interval: ${intervalSeconds} seconds`);
    console.log("\nCommands:");
    console.log("  Press 'q' and Enter to quit immediately");
    console.log("=".repeat(50) + "\n");

    // Set up command handling for 'q' to quit
    // Create a new readline interface for listening to commands
    const commandRl = createReadlineInterface();
    setupCommandHandling(commandRl);

    // Start the alert loop
    // This will run until the price crosses the threshold or user quits
    await runAlert(config);

    // If we get here, the alert was triggered (not quit)
    console.log("\n✅ Alert completed successfully!");
  } catch (error) {
    // Handle any errors that occur
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    // Make sure to close readline interface
    rl.close();
    process.exit(0);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

