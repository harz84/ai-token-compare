// Auto-generated daily by scripts/fetch-exchange-rate.js — do not edit by hand.
// Source: open.er-api.com (fetched 2026-07-29T18:11:22.014Z)
(function () {
  var rate = 18106.369178;
  if (typeof window.updateExchangeRate === 'function') {
    window.updateExchangeRate('IDR', rate);
  } else {
    window.EXCHANGE_RATES = window.EXCHANGE_RATES || {};
    window.EXCHANGE_RATES.IDR = rate;
  }
  window.EXCHANGE_RATE_FETCHED_AT = "2026-07-29T18:11:22.014Z";
})();
