// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: open.er-api.com (fetched 2026-08-02T18:03:43.498Z)
(function () {
  var rate = 18037.980608;
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('IDR', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.IDR = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = "2026-08-02T18:03:43.498Z";
})();
