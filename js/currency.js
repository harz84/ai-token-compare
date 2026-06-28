// =============================================================================
// AI Token Price Compare — Currency Conversion Module
// Supports: USD, IDR
// =============================================================================

const EXCHANGE_RATES = {
  USD: 1,
  IDR: 16500, // 1 USD = 16,500 IDR — update this value as needed
};

// ─── State ──────────────────────────────────────────────────────────────────────

let currentCurrency = localStorage.getItem('preferred-currency') || 'USD';

// Validate persisted value
if (!EXCHANGE_RATES[currentCurrency]) {
  currentCurrency = 'USD';
}

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Convert an amount from USD to the current currency.
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Converted amount in current currency
 */
function convertPrice(usdAmount) {
  if (usdAmount == null || isNaN(usdAmount)) return 0;
  return usdAmount * (EXCHANGE_RATES[currentCurrency] || 1);
}

/**
 * Format a USD price for display in the current currency.
 * Handles very small amounts with extra decimal precision.
 *
 * @param {number} usdAmount - Price in USD (per 1M tokens)
 * @param {boolean} [forceDecimals=false] - If true, always show 2+ decimals
 * @returns {string} Formatted price string (e.g., "$2.50" or "Rp 41.250")
 */
function formatPrice(usdAmount, forceDecimals) {
  if (usdAmount == null || isNaN(usdAmount)) return '—';

  const converted = convertPrice(usdAmount);

  if (currentCurrency === 'IDR') {
    return formatIDR(converted);
  }

  return formatUSD(converted, usdAmount, forceDecimals);
}

/**
 * Format a number as USD.
 * @param {number} amount - Converted amount
 * @param {number} original - Original USD amount (for decimal logic)
 * @param {boolean} forceDecimals - Force minimum 2 decimals
 * @returns {string} Formatted USD string
 */
function formatUSD(amount, original, forceDecimals) {
  // Determine appropriate decimal places
  let decimals = 2;

  if (original < 0.01) {
    // Very small amounts: show up to 4 decimals
    decimals = 4;
  } else if (original < 0.10) {
    // Small amounts: show 3 decimals
    decimals = 3;
  } else if (!forceDecimals && Number.isInteger(amount)) {
    // Whole numbers: show 2 decimals for consistency
    decimals = 2;
  }

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });

  return '$' + formatted;
}

/**
 * Format a number as Indonesian Rupiah.
 * IDR typically doesn't use decimals; uses dot as thousands separator.
 * @param {number} amount - Amount in IDR
 * @returns {string} Formatted IDR string (e.g., "Rp 41.250")
 */
function formatIDR(amount) {
  if (amount === 0) return 'Rp 0';

  // For very small IDR amounts (< 1 Rp), show decimals
  if (amount > 0 && amount < 1) {
    const formatted = amount.toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    return 'Rp ' + formatted;
  }

  // Standard IDR formatting: round to nearest integer, dot-separated thousands
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('id-ID');
  return 'Rp ' + formatted;
}

/**
 * Format a generic number with locale-appropriate separators.
 * @param {number} num - Number to format
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals) {
  if (num == null || isNaN(num)) return '0';

  const dec = typeof decimals === 'number' ? decimals : 0;
  const locale = currentCurrency === 'IDR' ? 'id-ID' : 'en-US';

  return num.toLocaleString(locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

/**
 * Format a context window size for display.
 * E.g., 128000 → "128K", 1000000 → "1M"
 * @param {number} tokens - Number of tokens
 * @returns {string} Human-readable token count
 */
function formatContextWindow(tokens) {
  if (tokens == null || isNaN(tokens)) return '—';

  if (tokens >= 1000000) {
    const millions = tokens / 1000000;
    return millions === Math.floor(millions)
      ? millions + 'M'
      : millions.toFixed(1) + 'M';
  }

  if (tokens >= 1000) {
    const thousands = tokens / 1000;
    return thousands === Math.floor(thousands)
      ? thousands + 'K'
      : thousands.toFixed(1) + 'K';
  }

  return tokens.toString();
}

/**
 * Set the active currency, persist to localStorage, and dispatch a change event.
 * @param {string} currency - Currency code ('USD' or 'IDR')
 */
function setCurrency(currency) {
  if (!EXCHANGE_RATES[currency]) {
    console.warn(
      `[currency] Unknown currency "${currency}". Available: ${Object.keys(EXCHANGE_RATES).join(', ')}`
    );
    return;
  }

  if (currency === currentCurrency) return;

  currentCurrency = currency;

  try {
    localStorage.setItem('preferred-currency', currency);
  } catch (e) {
    console.warn('[currency] Could not persist currency preference:', e.message);
  }

  // Dispatch custom event for reactive UI updates
  window.dispatchEvent(
    new CustomEvent('currencyChanged', {
      detail: { currency: currency },
      bubbles: true,
    })
  );
}

/**
 * Get the currently active currency code.
 * @returns {string} Current currency code
 */
function getCurrency() {
  return currentCurrency;
}

/**
 * Get the symbol for the current currency.
 * @returns {string} Currency symbol ('$' or 'Rp')
 */
function getCurrencySymbol() {
  return currentCurrency === 'IDR' ? 'Rp' : '$';
}

/**
 * Get all available currency codes.
 * @returns {string[]} Array of currency codes
 */
function getAvailableCurrencies() {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Get the current exchange rate from USD to the active currency.
 * @returns {number} Exchange rate
 */
function getExchangeRate() {
  return EXCHANGE_RATES[currentCurrency] || 1;
}

/**
 * Update the exchange rate for a currency.
 * Useful if you want to fetch live rates from an API.
 * @param {string} currency - Currency code
 * @param {number} rate - New exchange rate (1 USD = rate)
 */
function updateExchangeRate(currency, rate) {
  if (!currency || typeof rate !== 'number' || rate <= 0) {
    console.warn('[currency] Invalid exchange rate update:', currency, rate);
    return;
  }

  EXCHANGE_RATES[currency] = rate;

  // If this is the current currency, trigger a re-render
  if (currency === currentCurrency) {
    window.dispatchEvent(
      new CustomEvent('currencyChanged', {
        detail: { currency: currency, rate: rate },
        bubbles: true,
      })
    );
  }
}

// ─── Global Exports ─────────────────────────────────────────────────────────────

window.EXCHANGE_RATES = EXCHANGE_RATES;
window.convertPrice = convertPrice;
window.formatPrice = formatPrice;
window.formatNumber = formatNumber;
window.formatContextWindow = formatContextWindow;
window.setCurrency = setCurrency;
window.getCurrency = getCurrency;
window.getCurrencySymbol = getCurrencySymbol;
window.getAvailableCurrencies = getAvailableCurrencies;
window.getExchangeRate = getExchangeRate;
window.updateExchangeRate = updateExchangeRate;
