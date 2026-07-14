// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: open.er-api.com (fetched 2026-07-14T18:09:19.012Z)
(function () {
  var rate = 18119.392614;
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('IDR', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.IDR = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = "2026-07-14T18:09:19.012Z";
})();
