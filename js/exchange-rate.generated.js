// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: open.er-api.com (fetched 2026-08-03T18:53:01.819Z)
(function () {
  var rate = 18075.566022;
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('IDR', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.IDR = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = "2026-08-03T18:53:01.819Z";
})();
