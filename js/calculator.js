/* =========================================================
   calculator.js — Cost Calculator Module
   ========================================================= */

(function () {
  'use strict';

  const CALC_DEFAULTS = {
    inputTokens: 100000,
    outputTokens: 50000,
    daysPerMonth: 30,
  };

  const MAX_VISIBLE = 15;
  let showAll = false;

  /* ── Initialisation ─────────────────────────────────────── */

  function initCalculator() {
    // Sync range ↔ number inputs
    syncInputPair('calc-input-range', 'calc-input-tokens');
    syncInputPair('calc-output-range', 'calc-output-tokens');
    syncInputPair('calc-days-range', 'calc-days');

    // Listen for any calculator input change
    const ids = [
      'calc-input-range', 'calc-input-tokens',
      'calc-output-range', 'calc-output-tokens',
      'calc-days-range', 'calc-days',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', onCalcInputChange);
      }
    });

    // React to currency / language changes
    window.addEventListener('currencyChanged', () => renderFromCurrentInputs());
    window.addEventListener('languageChanged', () => renderFromCurrentInputs());

    // Initial render
    renderFromCurrentInputs();
  }

  /* ── Sync helpers ───────────────────────────────────────── */

  function syncInputPair(rangeId, numberId) {
    const range = document.getElementById(rangeId);
    const number = document.getElementById(numberId);
    if (!range || !number) return;

    range.addEventListener('input', () => {
      number.value = range.value;
    });
    number.addEventListener('input', () => {
      let v = parseInt(number.value, 10);
      if (isNaN(v)) v = 0;
      v = Math.max(parseInt(range.min, 10) || 0, Math.min(v, parseInt(range.max, 10) || 10000000));
      range.value = v;
    });
  }

  function onCalcInputChange() {
    renderFromCurrentInputs();
  }

  function getCalcValues() {
    return {
      inputTokens: parseInt(document.getElementById('calc-input-tokens')?.value, 10) || CALC_DEFAULTS.inputTokens,
      outputTokens: parseInt(document.getElementById('calc-output-tokens')?.value, 10) || CALC_DEFAULTS.outputTokens,
      days: parseInt(document.getElementById('calc-days')?.value, 10) || CALC_DEFAULTS.daysPerMonth,
    };
  }

  function renderFromCurrentInputs() {
    const v = getCalcValues();
    const results = calculateCosts(v.inputTokens, v.outputTokens, v.days);
    renderCalculatorResults(results);
  }

  /* ── Core calculation ───────────────────────────────────── */

  function calculateCosts(inputTokensPerDay, outputTokensPerDay, daysPerMonth) {
    if (typeof MODELS === 'undefined') return [];

    return MODELS.map(model => {
      const provider = (typeof PROVIDERS !== 'undefined') ? PROVIDERS[model.provider] : null;
      const inputCost = (inputTokensPerDay * model.inputPrice / 1_000_000) * daysPerMonth;
      const outputCost = (outputTokensPerDay * model.outputPrice / 1_000_000) * daysPerMonth;
      return {
        model: model,
        provider: provider,
        providerId: model.provider,
        monthlyCost: inputCost + outputCost,
        inputCost: inputCost,
        outputCost: outputCost,
      };
    }).sort((a, b) => a.monthlyCost - b.monthlyCost);
  }

  /* ── Render bar chart ───────────────────────────────────── */

  function renderCalculatorResults(results) {
    const container = document.getElementById('calc-results-list');
    if (!container) return;

    if (!results.length) {
      container.innerHTML = '<p class="calc-empty">' + (typeof t === 'function' ? t('general.no_results') : 'No results') + '</p>';
      return;
    }

    const maxCost = results.reduce((m, r) => Math.max(m, r.monthlyCost), 0);
    const visibleResults = showAll ? results : results.slice(0, MAX_VISIBLE);
    const cheapestCost = results[0].monthlyCost;

    let html = `
      <div class="table-wrapper">
        <table class="price-table calc-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Model</th>
              <th>Input</th>
              <th>Output</th>
              <th>Total/mo</th>
              <th>Visual</th>
            </tr>
          </thead>
          <tbody>
    `;

    visibleResults.forEach((r, i) => {
      const pct = maxCost > 0 ? (r.monthlyCost / maxCost) * 100 : 0;
      const providerColor = r.provider ? r.provider.color : '#6366f1';
      const providerName = r.provider ? r.provider.name : r.providerId;
      const modelName = r.model.name;
      const isCheapest = r.monthlyCost === cheapestCost;
      const priceStr = typeof formatPrice === 'function' ? formatPrice(r.monthlyCost) : '$' + r.monthlyCost.toFixed(4);
      const inputStr = typeof formatPrice === 'function' ? formatPrice(r.inputCost) : '$' + r.inputCost.toFixed(4);
      const outputStr = typeof formatPrice === 'function' ? formatPrice(r.outputCost) : '$' + r.outputCost.toFixed(4);
      
      html += `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
               <span style="background:${providerColor};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
               ${providerName}
               ${r.provider && r.provider.website ? `<a href="${r.provider.website}" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;font-size:0.85em;" title="Visit ${providerName}">🔗</a>` : ''}
            </div>
          </td>
          <td style="font-weight:600;">${modelName}</td>
          <td style="color:var(--text-secondary);">${inputStr}</td>
          <td style="color:var(--text-secondary);">${outputStr}</td>
          <td style="color:${isCheapest ? 'var(--accent)' : 'inherit'};font-weight:700;">${priceStr}</td>
          <td style="width:100px;vertical-align:middle;">
             <div style="width:100%;height:6px;background:var(--bg-card-alt);border-radius:3px;overflow:hidden;">
               <div class="calc-bar-fill" style="width:${Math.max(pct, 2)}%;height:100%;background:${isCheapest ? 'var(--accent)' : providerColor};transition:width 0.1s ease-out;"></div>
             </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;

    // Show all / show less button
    if (results.length > MAX_VISIBLE) {
      const label = showAll
        ? (typeof t === 'function' ? t('general.show_less') || 'Show less' : 'Show less')
        : (typeof t === 'function' ? t('general.show_all') || `Show all (${results.length})` : `Show all (${results.length})`);
      html += `<button class="calc-show-all-btn" id="calc-show-all">${label}</button>`;
    }

    container.innerHTML = html;

    // Bind show-all
    const showAllBtn = document.getElementById('calc-show-all');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        showAll = !showAll;
        renderFromCurrentInputs();
      });
    }

    // Animate bars
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.querySelectorAll('.calc-bar').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      });
    });
  }

  /* ── Expose globally ────────────────────────────────────── */
  window.initCalculator = initCalculator;
  window.calculateCosts = calculateCosts;
  window.renderCalculatorResults = renderCalculatorResults;
})();
