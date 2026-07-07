const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const JSON_OUTPUT_PATH = path.join(PROJECT_ROOT, 'data', 'exchange-rate.generated.json');
const JS_OUTPUT_PATH = path.join(PROJECT_ROOT, 'js', 'exchange-rate.generated.js');

const TARGET_CURRENCY = 'IDR';

// Guards against a malformed/corrupted API response silently pushing a
// wildly wrong exchange rate to the live site (1 USD has been roughly
// 15,000-17,000 IDR for years; give it wide headroom for future drift).
const MIN_PLAUSIBLE_RATE = 10000;
const MAX_PLAUSIBLE_RATE = 30000;

const SOURCES = [
  {
    name: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    extractRate: payload => payload?.rates?.[TARGET_CURRENCY],
  },
  {
    name: 'frankfurter.dev',
    url: `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${TARGET_CURRENCY}`,
    extractRate: payload => payload?.rates?.[TARGET_CURRENCY],
  },
];

async function fetchRateFrom(source) {
  const response = await fetch(source.url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'ai-token-compare/1.0' },
  });

  if (!response.ok) {
    throw new Error(`${source.name} request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const rate = Number(source.extractRate(payload));

  if (!Number.isFinite(rate)) {
    throw new Error(`${source.name} response missing a numeric ${TARGET_CURRENCY} rate`);
  }

  if (rate < MIN_PLAUSIBLE_RATE || rate > MAX_PLAUSIBLE_RATE) {
    throw new Error(`${source.name} returned an implausible ${TARGET_CURRENCY} rate: ${rate}`);
  }

  return { rate, source: source.name };
}

async function fetchRate() {
  const errors = [];

  for (const source of SOURCES) {
    try {
      return await fetchRateFrom(source);
    } catch (error) {
      errors.push(`${source.name}: ${error.message}`);
    }
  }

  throw new Error(`All exchange rate sources failed:\n${errors.join('\n')}`);
}

function readPreviousRate() {
  if (!fs.existsSync(JSON_OUTPUT_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(JSON_OUTPUT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const previous = readPreviousRate();
  const { rate, source } = await fetchRate();
  const fetchedAt = new Date().toISOString();

  const output = {
    base: 'USD',
    target: TARGET_CURRENCY,
    rate,
    source,
    fetchedAt,
    previousRate: previous ? previous.rate : null,
  };

  fs.mkdirSync(path.dirname(JSON_OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  const jsContent = `// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: ${source} (fetched ${fetchedAt})
(function () {
  var rate = ${JSON.stringify(rate)};
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('${TARGET_CURRENCY}', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.${TARGET_CURRENCY} = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = ${JSON.stringify(fetchedAt)};
})();
`;

  fs.writeFileSync(JS_OUTPUT_PATH, jsContent, 'utf8');

  console.log(`Fetched 1 USD = ${rate} ${TARGET_CURRENCY} from ${source} at ${JSON_OUTPUT_PATH}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
