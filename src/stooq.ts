/**
 * Fetches stock quote data from Stooq.com
 * 
 * This function retrieves the latest stock quote for a given symbol
 * and returns the symbol, date, time, and closing price.
 */

/**
 * Fetches a stock quote from Stooq.com
 * 
 * @param symbol - The stock symbol to fetch (e.g., "AAPL", "MSFT")
 * @returns A promise that resolves to an object containing symbol, date, time, and close price
 * @throws Error if the symbol is invalid, response is empty, or close price is not a number
 */
export async function fetchQuote(
  symbol: string
): Promise<{ symbol: string; date: string; time: string; close: number }> {
  // Validate that symbol is provided
  if (!symbol || symbol.trim().length === 0) {
    throw new Error("Symbol cannot be empty");
  }

  // Construct the URL for fetching CSV data from Stooq
  // The parameters: s=symbol, f=sd2t2ohlcvn (format), h (header), e=csv (export format)
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcvn&h&e=csv`;

  // Fetch the CSV data from the API
  const response = await fetch(url);

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}: HTTP ${response.status}`);
  }

  // Get the response text (CSV format)
  const csvText = await response.text();

  // Check if the response is empty
  if (!csvText || csvText.trim().length === 0) {
    throw new Error(`Empty response received for symbol: ${symbol}. The symbol may be invalid.`);
  }

  // Split the CSV into lines
  const lines = csvText.trim().split("\n");

  // We expect at least 2 lines: header row + 1 data row
  if (lines.length < 2) {
    throw new Error(
      `Invalid response format for symbol: ${symbol}. Expected at least 2 lines (header + data), got ${lines.length}`
    );
  }

  // Parse the header row to find column indices
  // Header format: Symbol,Date,Time,Open,High,Low,Close,Volume,Name
  const header = lines[0].split(",");
  const symbolIndex = header.indexOf("Symbol");
  const dateIndex = header.indexOf("Date");
  const timeIndex = header.indexOf("Time");
  const closeIndex = header.indexOf("Close");

  // Validate that all required columns exist in the header
  if (symbolIndex === -1 || dateIndex === -1 || timeIndex === -1 || closeIndex === -1) {
    throw new Error(
      `Invalid CSV header format. Expected columns: Symbol, Date, Time, Close`
    );
  }

  // Parse the data row (second line)
  const dataRow = lines[1].split(",");

  // Extract values from the data row
  const symbolValue = dataRow[symbolIndex]?.trim();
  const dateValue = dataRow[dateIndex]?.trim();
  const timeValue = dataRow[timeIndex]?.trim();
  const closeValue = dataRow[closeIndex]?.trim();

  // Check if the symbol in the response matches what we requested
  // (Sometimes invalid symbols return "N/A" or empty values)
  if (!symbolValue || symbolValue === "N/A" || symbolValue.length === 0) {
    throw new Error(`Invalid symbol: ${symbol}. The symbol was not found or is not recognized.`);
  }

  // Validate that we have date and time values
  if (!dateValue || !timeValue) {
    throw new Error(`Missing date or time data for symbol: ${symbol}`);
  }

  // Parse and validate the close price
  // The close price should be a valid number
  if (!closeValue || closeValue === "N/A" || closeValue.length === 0) {
    throw new Error(`No close price available for symbol: ${symbol}. The symbol may be invalid or delisted.`);
  }

  // Convert close price string to number
  const closeNumber = parseFloat(closeValue);

  // Validate that the close price is actually a number
  if (isNaN(closeNumber)) {
    throw new Error(
      `Invalid close price "${closeValue}" for symbol: ${symbol}. Expected a number, but got: ${closeValue}`
    );
  }

  // Return the parsed quote data
  return {
    symbol: symbolValue,
    date: dateValue,
    time: timeValue,
    close: closeNumber,
  };
}

