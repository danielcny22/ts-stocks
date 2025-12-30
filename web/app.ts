/**
 * Stock Price Alert Web Application
 * 
 * This script handles the stock price alert functionality in the browser.
 * It polls the API endpoint and triggers alerts when price thresholds are crossed.
 */

// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
  // Get all required DOM elements
  // We'll validate these exist and throw clear errors if they're missing
  const symbolInput = document.getElementById("symbolInput") as HTMLInputElement;
  const targetInput = document.getElementById("targetInput") as HTMLInputElement;
  const directionSelect = document.getElementById("directionSelect") as HTMLSelectElement;
  const intervalInput = document.getElementById("intervalInput") as HTMLInputElement;
  const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
  const priceText = document.getElementById("priceText") as HTMLElement;
  const statusText = document.getElementById("statusText") as HTMLElement;
  const alertText = document.getElementById("alertText") as HTMLElement;

  // Validate that all required elements exist
  // This helps catch errors early if the HTML structure changes
  const requiredElements = [
    { name: "symbolInput", element: symbolInput },
    { name: "targetInput", element: targetInput },
    { name: "directionSelect", element: directionSelect },
    { name: "intervalInput", element: intervalInput },
    { name: "startBtn", element: startBtn },
    { name: "stopBtn", element: stopBtn },
    { name: "priceText", element: priceText },
    { name: "statusText", element: statusText },
    { name: "alertText", element: alertText },
  ];

  for (const { name, element } of requiredElements) {
    if (!element) {
      throw new Error(`Required element with id "${name}" is missing from the HTML`);
    }
  }

  // Variable to store the polling interval ID
  // This allows us to cancel the interval when the stop button is clicked
  let pollingIntervalId: number | null = null;

  /**
   * Fetches a stock quote from the API
   * 
   * @param symbol - The stock symbol to fetch
   * @returns A promise that resolves to the quote data
   * @throws Error if the API request fails
   */
  async function fetchQuote(symbol: string): Promise<{ symbol: string; date: string; time: string; close: number }> {
    // Construct the API URL with the symbol as a query parameter
    const url = `/api/quote?symbol=${encodeURIComponent(symbol)}`;

    // Fetch the quote from the API
    const response = await fetch(url);

    // Check if the request was successful
    if (!response.ok) {
      // If the response is not OK, throw an error with the status
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Parse and return the JSON response
    return await response.json();
  }

  /**
   * Updates the UI with the current price and status
   * 
   * @param price - The current stock price
   * @param status - The status message to display
   */
  function updateUI(price: number | null, status: string): void {
    if (price !== null) {
      // Format the price with 2 decimal places and a dollar sign
      priceText.textContent = `$${price.toFixed(2)}`;
    } else {
      priceText.textContent = "--";
    }
    statusText.textContent = status;
  }

  /**
   * Shows an alert message
   * 
   * @param message - The alert message to display
   */
  function showAlert(message: string): void {
    alertText.textContent = message;
    alertText.classList.add("show");
  }

  /**
   * Hides the alert message
   */
  function hideAlert(): void {
    alertText.classList.remove("show");
    alertText.textContent = "";
  }

  /**
   * Starts the polling process
   * This function will be called when the start button is clicked
   */
  function startPolling(): void {
    // Get values from the input fields
    const symbol = symbolInput.value.trim();
    const target = parseFloat(targetInput.value);
    const direction = directionSelect.value as "above" | "below";
    const intervalSeconds = parseFloat(intervalInput.value) || 10;

    // Validate inputs
    if (!symbol) {
      alert("Please enter a stock symbol");
      return;
    }

    if (isNaN(target) || target <= 0) {
      alert("Please enter a valid target price (greater than 0)");
      return;
    }

    if (intervalSeconds <= 0) {
      alert("Please enter a valid polling interval (greater than 0)");
      return;
    }

    // Convert interval from seconds to milliseconds
    const intervalMs = intervalSeconds * 1000;

    // Update UI to show we're starting
    updateUI(null, "Starting...");
    hideAlert();

    // Disable the start button and enable the stop button
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Store the configuration for use in the polling function
    let isActive = true;

    /**
     * Polling function that fetches the quote and checks the threshold
     * This function will be called repeatedly at the specified interval
     */
    async function poll(): Promise<void> {
      // Check if polling has been stopped
      if (!isActive) {
        return;
      }

      try {
        // Fetch the current quote
        const quote = await fetchQuote(symbol);
        const currentPrice = quote.close;

        // Update the UI with the current price
        updateUI(currentPrice, `Polling... Last updated: ${quote.date} ${quote.time}`);

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
          const message = `🚨 ALERT: ${quote.symbol} price ($${currentPrice.toFixed(2)}) has crossed ${direction} target ($${target.toFixed(2)})!`;
          showAlert(message);
          updateUI(currentPrice, "Alert triggered!");
          
          // Stop polling
          stopPolling();
        }
      } catch (error) {
        // Handle errors (network issues, invalid symbol, etc.)
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateUI(null, `Error: ${errorMessage}`);
        console.error("Error fetching quote:", error);
      }
    }

    // Start polling immediately (don't wait for the first interval)
    poll();

    // Set up the interval to poll at the specified interval
    pollingIntervalId = window.setInterval(poll, intervalMs);
  }

  /**
   * Stops the polling process
   * This function will be called when the stop button is clicked
   */
  function stopPolling(): void {
    // Check if there's an active polling interval
    if (pollingIntervalId !== null) {
      // Clear the interval to stop polling
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }

    // Update UI to show we've stopped
    updateUI(null, "Stopped");
    hideAlert();

    // Enable the start button and disable the stop button
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Set up event listeners for the buttons
  startBtn.addEventListener("click", startPolling);
  stopBtn.addEventListener("click", stopPolling);
});

