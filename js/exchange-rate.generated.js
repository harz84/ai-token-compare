// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: open.er-api.com (fetched 2026-07-15T18:12:59.032Z)
(function () {
  var rate = 18080.300015;
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('IDR', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.IDR = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = "2026-07-15T18:12:59.032Z";
})();
