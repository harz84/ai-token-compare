/* =========================================================
   app.js  —  Main Application Controller
   AI Token Price Compare
   ========================================================= */

(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────── */
  let currentTab      = 'promos';
  let currentRegion   = 'all';
  let currentCategory = 'all';
  let currentProvider = 'all';
  let currentSort     = 'inputPrice';
  let currentSortDir  = 1;
  let compareSort     = 'total';
  let compareSortDir  = 1;
  let promoSort       = 'discountPercent';
  let promoSortDir    = -1;
  let searchQuery     = '';

  /* ==========================================================
     BOOT
     ========================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    setupLanguageToggle();
    setupCurrencyToggle();
    setupThemeToggle();
    setupNavigation();
    buildCompareNavMenu();
    setupFilters();
    setupSearch();
    setupMobileMenu();
    setupScrollAnimations();

    renderPriceTable();
    renderCompareSection();
    renderBestPicks();
    renderPromos();

    updateHeroStats();
    setLastUpdated();

    // Global reactive events
    window.addEventListener('languageChanged', onLanguageChanged);
    window.addEventListener('currencyChanged', onCurrencyChanged);

    // Initial i18n pass
    applyI18n();

    document.addEventListener('click', (e) => {
      const th = e.target.closest('th.sortable');
      if (!th) return;
      const key = th.dataset.sort;
      if (th.dataset.table === 'compare') {
        if (compareSort === key) { compareSortDir *= -1; }
        else { compareSort = key; compareSortDir = 1; }
        const sel = document.getElementById('compare-model-select');
        if (sel) renderCompareCards(sel.value);
      } else if (th.dataset.table === 'promo') {
        if (promoSort === key) { promoSortDir *= -1; }
        else { promoSort = key; promoSortDir = getDefaultSortDir(key); }
        renderPromos();
      } else {
        if (currentSort === key) { currentSortDir *= -1; }
        else { currentSort = key; currentSortDir = 1; }
        renderPriceTable();
      }
    });
  }

  /* ==========================================================
     LANGUAGE & CURRENCY TOGGLES
     ========================================================== */
  function setupLanguageToggle() {
    const cb = document.getElementById('lang-checkbox');
    if (!cb) return;
    // Reflect current language
    cb.checked = (typeof getLanguage === 'function' && getLanguage() === 'id');
    cb.addEventListener('change', () => {
      const lang = cb.checked ? 'id' : 'en';
      if (typeof setLanguage === 'function') setLanguage(lang);
    });
  }

  function setupCurrencyToggle() {
    const cb = document.getElementById('currency-checkbox');
    if (!cb) return;
    cb.checked = (typeof getCurrency === 'function' && getCurrency() === 'IDR');
    cb.addEventListener('change', () => {
      const cur = cb.checked ? 'IDR' : 'USD';
      if (typeof setCurrency === 'function') setCurrency(cur);
    });
  }

  function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    }
    updateThemeIcon();

    btn.addEventListener('click', () => {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const darkIcon = document.querySelector('.theme-icon-dark');
    const lightIcon = document.querySelector('.theme-icon-light');
    if (darkIcon && lightIcon) {
      darkIcon.style.display = isLight ? 'none' : 'block';
      lightIcon.style.display = isLight ? 'block' : 'none';
    }
  }

  function onLanguageChanged() {
    applyI18n();
    renderPriceTable();
    renderCompareSection();
    renderBestPicks();
    renderPromos();
  }

  function onCurrencyChanged() {
    renderPriceTable();
    renderCompareSection();
    renderBestPicks();
  }

  /* ── Apply i18n to all data-i18n / data-i18n-placeholder ── */
  function applyI18n() {
    if (typeof t !== 'function') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });
    // Sort select options
    document.querySelectorAll('#sort-select option[data-i18n]').forEach(opt => {
      const key = opt.getAttribute('data-i18n');
      const val = t(key);
      if (val) opt.textContent = val;
    });
  }

  /* ==========================================================
     NAVIGATION (tabs)
     ========================================================== */
  function setupNavigation() {
    document.querySelectorAll('.nav-link[data-tab], .mobile-nav-link[data-tab]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const tab = link.dataset.tab;
        switchTab(tab);
        closeMobileMenu();
      });
    });
  }

  /* ==========================================================
     COMPARE NAV MENU
     ========================================================== */
  function buildCompareNavMenu() {
    const menu = document.getElementById('compare-nav-menu');
    if (!menu) return;

    let models = getPricedModels();

    // Group models by provider
    const groups = {};
    models.forEach(m => {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    });

    let html = '';
    
    // Order providers: OpenAI, Anthropic, Google, etc.
    const sortedProviders = Object.keys(groups).sort((a, b) => {
      const pA = getProvider(a);
      const pB = getProvider(b);
      // Rough sorting to keep major global providers first
      const score = p => (p && p.region === 'global' ? 1 : 0);
      return score(pB) - score(pA);
    });

    sortedProviders.forEach(pid => {
      const p = getProvider(pid);
      if (!p) return;

      // Sort top models by normalized top-tier score, then curated rank as fallback.
      const providerLimit = pid === 'anthropic' ? 7 : 5;
      const pModels = [...groups[pid]]
        .filter(m => m.status !== 'deprecated')
        .sort((a, b) => {
          const scoreDiff = (b.topTierScore || 0) - (a.topTierScore || 0);
          if (scoreDiff !== 0) return scoreDiff;
          const rankA = a.arenaRank || 999;
          const rankB = b.arenaRank || 999;
          if (rankA !== rankB) return rankA - rankB;
          return b.outputPrice - a.outputPrice;
        });

      html += `
        <li class="dropdown-submenu">
          <div class="dropdown-provider-item">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="background:${p.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
              ${escHtml(p.name)}
            </span>
            <span style="opacity:0.5;font-size:0.8em;">\u25b6</span>
          </div>
          <ul class="provider-model-submenu">
      `;

      pModels.forEach(m => {
        const total = m.inputPrice + m.outputPrice;
        const displayPrice = total > 0 ? fmtPrice(total) : 'Free';
        html += `
            <li class="provider-model-item" data-id="${m.id}">
              <span>${escHtml(m.name)}</span>
              <span class="model-price-hint">${displayPrice}</span>
            </li>
        `;
      });

      html += `
          </ul>
        </li>
      `;
    });

    menu.innerHTML = html;

    // JS hover: show only the sub-menu for the hovered provider
    menu.querySelectorAll('.dropdown-submenu').forEach(submenu => {
      const subList = submenu.querySelector('.provider-model-submenu');
      if (!subList) return;
      submenu.addEventListener('mouseenter', () => {
        // Close all other sub-menus first
        menu.querySelectorAll('.provider-model-submenu.visible').forEach(s => s.classList.remove('visible'));
        subList.classList.add('visible');
      });
      submenu.addEventListener('mouseleave', e => {
        if (!submenu.contains(e.relatedTarget)) {
          subList.classList.remove('visible');
        }
      });
    });

    // Click a model → switch to compare + render results + close the whole menu
    menu.querySelectorAll('.provider-model-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const mId = item.getAttribute('data-id');
        switchTab('compare');
        const select = document.getElementById('compare-model-select');
        if (select) select.value = mId;
        renderCompareCards(mId);

        // Close all sub-menus and blur the nav container so the top dropdown hides
        menu.querySelectorAll('.provider-model-submenu.visible').forEach(s => s.classList.remove('visible'));
        const container = document.querySelector('.nav-dropdown-container');
        if (container) container.blur();
        // Force the top-level dropdown to hide by temporarily removing hover
        const navMenu = document.getElementById('compare-nav-menu');
        if (navMenu) {
          navMenu.style.opacity = '0';
          navMenu.style.visibility = 'hidden';
          setTimeout(() => {
            navMenu.style.opacity = '';
            navMenu.style.visibility = '';
          }, 300);
        }
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    // Active link
    document.querySelectorAll('.nav-link[data-tab], .mobile-nav-link[data-tab]').forEach(l => {
      l.classList.toggle('active', l.dataset.tab === tab);
    });
    // Show / hide sections
    const map = {
      models:     'section-models',
      compare:    'section-compare',
      bestPicks:  'section-best-picks',
      promos:     'section-promos',
    };
    Object.entries(map).forEach(([key, id]) => {
      const sec = document.getElementById(id);
      if (sec) sec.classList.toggle('hidden', key !== tab);
    });
    // Show / hide filter bar
    const fb = document.getElementById('filter-bar');
    if (fb) fb.classList.toggle('hidden', tab !== 'models');

    // Smooth scroll to main
    const main = document.querySelector('.main');
    if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ==========================================================
     PRICE TABLE
     ========================================================== */
  function renderPriceTable() {
    const tbody = document.getElementById('price-table-body');
    const noResults = document.getElementById('no-results');
    if (!tbody) return;

    let models = getPricedModels();

    /* ── Filter: provider ─────────────────────────────────── */
    if (currentProvider !== 'all') {
      models = models.filter(m => m.provider === currentProvider);
    }

    /* ── Filter: region ───────────────────────────────────── */
    if (currentRegion !== 'all') {
      models = models.filter(m => {
        const p = getProvider(m.provider);
        if (!p) return false;
        if (currentRegion === 'global')       return p.region === 'global';
        if (currentRegion === 'china')        return p.region === 'china';
        if (currentRegion === 'third-party')  return p.region === 'third-party';
        return true;
      });
    }

    /* ── Filter: category ─────────────────────────────────── */
    if (currentCategory !== 'all') {
      models = models.filter(m => m.category === currentCategory);
    }

    /* ── Filter: search ───────────────────────────────────── */
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      models = models.filter(m => {
        const providerName = getProviderName(m.provider).toLowerCase();
        return m.name.toLowerCase().includes(q) || providerName.includes(q) || (m.id && m.id.toLowerCase().includes(q));
      });
    }

    /* ── Sort ─────────────────────────────────────────────── */
    models = sortModels(models, currentSort, currentSortDir);

    /* ── Find cheapest input / output for highlighting ───── */
    let cheapestInput  = Infinity;
    let cheapestOutput = Infinity;
    models.forEach(m => {
      if (m.inputPrice > 0 && m.inputPrice < cheapestInput)   cheapestInput  = m.inputPrice;
      if (m.outputPrice > 0 && m.outputPrice < cheapestOutput) cheapestOutput = m.outputPrice;
    });

    /* ── Build rows ───────────────────────────────────────── */
    if (models.length === 0) {
      tbody.innerHTML = '';
      if (noResults) noResults.classList.remove('hidden');
      return;
    }
    if (noResults) noResults.classList.add('hidden');

    const frag = document.createDocumentFragment();
    models.forEach((m, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'table-row fade-in-row';
      tr.style.animationDelay = (idx * 20) + 'ms';

      const prov = getProvider(m.provider);
      const color = prov ? prov.color : '#6366f1';
      const provName = prov ? prov.name : m.provider;

      const inputPriceStr  = fmtPrice(m.inputPrice);
      const cachePriceStr  = m.cachePrice ? fmtPrice(m.cachePrice) : '-';
      const outputPriceStr = fmtPrice(m.outputPrice);

      const isInputCheap  = (m.inputPrice === cheapestInput && m.inputPrice > 0);
      const isOutputCheap = (m.outputPrice === cheapestOutput && m.outputPrice > 0);

      const ctxStr = formatContext(m.contextWindow);
      const catBadge = categoryBadge(m.category);
      const capBadges = (m.capabilities || []).map(c => `<span class="cap-badge">${escHtml(c)}</span>`).join('');
      const sourceBadge = pricingSourceBadge(m);

      const lblProvider = typeof t === 'function' ? t('table.provider') || 'Provider' : 'Provider';
      const lblModel = typeof t === 'function' ? t('table.model') || 'Model' : 'Model';
      const lblInput = typeof t === 'function' ? t('table.input_price') || 'Input' : 'Input';
      const lblCache = typeof t === 'function' ? t('table.cache_price') || 'Cache' : 'Cache';
      const lblOutput = typeof t === 'function' ? t('table.output_price') || 'Output' : 'Output';
      const lblContext = typeof t === 'function' ? t('table.context') || 'Context' : 'Context';
      const lblCategory = typeof t === 'function' ? t('table.category') || 'Category' : 'Category';
      const lblUpdated = typeof t === 'function' ? t('table.updated') || 'Updated' : 'Updated';
      const releaseStr = formatDate(m.updatedAt || m.releaseDate);

      tr.innerHTML = `
        <td data-label="${lblProvider}">
          <span class="provider-dot" style="background:${color}"></span>
          <span class="provider-name">${escHtml(provName)}</span>
          ${prov && prov.website ? `<a href="${prov.website}" target="_blank" rel="noopener" style="margin-left:4px;color:var(--text-muted);text-decoration:none;font-size:0.85em;" title="Visit ${escHtml(provName)}">🔗</a>` : ''}
        </td>
        <td data-label="${lblModel}">
          <span class="model-name-cell">${escHtml(m.name)}</span>
          <span class="cap-badges">${capBadges}${sourceBadge}</span>
        </td>
        <td data-label="${lblInput}" class="${isInputCheap ? 'cheapest' : ''}">${inputPriceStr}</td>
        <td data-label="${lblCache}" style="color:var(--text-secondary);">${cachePriceStr}</td>
        <td data-label="${lblOutput}" class="${isOutputCheap ? 'cheapest' : ''}">${outputPriceStr}</td>
        <td data-label="${lblContext}">${ctxStr}</td>
        <td data-label="${lblCategory}">${catBadge}</td>
        <td data-label="${lblUpdated}" style="color:var(--text-muted); font-size:0.85em;" title="Pricing source: ${escHtml(m.pricingSource || 'manual-curated')} (${escHtml(m.pricingSourceType || 'curated')}), confidence: ${escHtml(m.confidence || 'medium')}">${releaseStr}</td>`;

      frag.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(frag);

    document.querySelectorAll('th.sortable:not([data-table="compare"])').forEach(th => {
      th.classList.remove('active', 'asc', 'desc');
      const icon = th.querySelector('.sort-icon');
      if (th.dataset.sort === currentSort) {
        th.classList.add('active', currentSortDir === 1 ? 'asc' : 'desc');
        if (icon) icon.textContent = currentSortDir === 1 ? '↑' : '↓';
      } else {
        if (icon) icon.textContent = '↕';
      }
    });
  }

  /* ── Sorting helper ─────────────────────────────────────── */
  function sortModels(models, key, dir = 1) {
    const copy = [...models];
    return copy.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (key === 'provider' || key === 'providerName') {
        valA = a.providerName || getProviderName(a.provider) || '';
        valB = b.providerName || getProviderName(b.provider) || '';
      } else if (key === 'updatedAt') {
        valA = new Date(a.updatedAt || a.releaseDate || 0).getTime();
        valB = new Date(b.updatedAt || b.releaseDate || 0).getTime();
      } else if (key === 'category') {
        valA = a.category || '';
        valB = b.category || '';
      }

      if (valA == null) valA = dir === 1 ? Infinity : -Infinity;
      if (valB == null) valB = dir === 1 ? Infinity : -Infinity;

      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * dir;
      return (valA - valB) * dir;
    });
  }

  /* ==========================================================
     FILTERS
     ========================================================== */
  function setupFilters() {
    // Region chips
    document.querySelectorAll('[data-filter-region]').forEach(chip => {
      chip.addEventListener('click', () => {
        currentRegion = chip.dataset.filterRegion;
        document.querySelectorAll('[data-filter-region]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderPriceTable();
      });
    });

    // Category chips
    document.querySelectorAll('[data-filter-category]').forEach(chip => {
      chip.addEventListener('click', () => {
        currentCategory = chip.dataset.filterCategory;
        document.querySelectorAll('[data-filter-category]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderPriceTable();
      });
    });

    // Sort select
    const sortSel = document.getElementById('sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', () => {
        currentSort = sortSel.value;
        renderPriceTable();
      });
    }

    // Provider select
    const providerSel = document.getElementById('provider-select');
    if (providerSel) {
      if (typeof PROVIDERS !== 'undefined') {
        const allProviders = Object.values(PROVIDERS)
          .filter(p => p.type !== 'third-party')
          .sort((a, b) => a.name.localeCompare(b.name));
        let opts = '<option value="all">All Providers</option>';
        const uniqueNames = new Set();
        allProviders.forEach(p => {
          if (!uniqueNames.has(p.name)) {
            opts += `<option value="${p.id}">${p.name}</option>`;
            uniqueNames.add(p.name);
          }
        });
        providerSel.innerHTML = opts;
      }
      providerSel.addEventListener('change', () => {
        currentProvider = providerSel.value;
        renderPriceTable();
      });
    }
  }

  /* ==========================================================
     SEARCH
     ========================================================== */
  function setupSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    const handler = debounce((e) => {
      searchQuery = input.value.trim();
      renderPriceTable();
    }, 300);
    input.addEventListener('input', handler);
  }

  /* ==========================================================
     COMPARE SECTION
     ========================================================== */
  function renderCompareSection() {
    const select = document.getElementById('compare-model-select');
    const grid   = document.getElementById('compare-grid');
    if (!select || !grid) return;

    // Helper: check if a thirdPartyPricing object has at least one provider with real pricing
    function hasRealThirdPartyPricing(tp) {
      return Object.values(tp).some(pricing => {
        const inp = pricing.inputPrice ?? pricing.input ?? null;
        const out = pricing.outputPrice ?? pricing.output ?? null;
        if (!inp && !out) return false;

        const source = pricing.source || 'manual-curated';
        const type = pricing.sourceType || 'curated';
        if (type === 'estimate' || source === 'manual-estimate' || source === 'router-curated') return false;
        
        return true;
      });
    }

    // Build list of models that are active (so users can select any model they see in the main table)
    const modelsWithTP = getPricedModels();

    // Group by base model name to avoid duplicates in dropdown
    const seenNames = new Set();
    const uniqueModels = [];
    modelsWithTP.forEach(m => {
      if (!seenNames.has(m.name)) {
        seenNames.add(m.name);
        uniqueModels.push(m);
      }
    });

    // Populate select
    const placeholder = typeof t === 'function' ? (t('compare.select_model') || 'Select a model to compare') : 'Select a model to compare';
    let opts = `<option value="">${escHtml(placeholder)}</option>`;
    uniqueModels.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
      opts += `<option value="${escHtml(m.id)}">${escHtml(m.name)}</option>`;
    });
    select.innerHTML = opts;

    // On change
    select.onchange = () => {
      renderCompareCards(select.value);
    };

    grid.innerHTML = '<p class="compare-placeholder">' +
      (typeof t === 'function' ? (t('compare.select_prompt') || 'Select a model above to see price comparison across providers') : 'Select a model above to see price comparison across providers') +
      '</p>';
  }

  function renderCompareCards(modelId) {
    const grid = document.getElementById('compare-grid');
    if (!grid) return;
    if (!modelId) {
      grid.innerHTML = '<p class="compare-placeholder">' +
        (typeof t === 'function' ? (t('compare.select_prompt') || 'Select a model above to see price comparison across providers') : 'Select a model above to see price comparison across providers') +
        '</p>';
      return;
    }

    const model = getPricedModels().find(m => m.id === modelId);
    if (!model || !model.thirdPartyPricing) {
      const message = typeof t === 'function'
        ? t('compare.no_alternatives') || 'No third-party alternatives available for this model'
        : 'No third-party alternatives available for this model';
      grid.innerHTML = `<p class="compare-placeholder">${escHtml(model ? model.name + ': ' : '')}${escHtml(message)}</p>`;
      return;
    }

    // Build entries: original provider + third-party
    const entries = [];

    // Original
    const origProvider = getProvider(model.provider);
      entries.push({
        providerName: origProvider ? origProvider.name : model.provider,
        color: origProvider ? origProvider.color : '#6366f1',
        website: origProvider ? origProvider.website : null,
        inputPrice: model.inputPrice,
        cachePrice: model.cachePrice,
        outputPrice: model.outputPrice,
        pricingSource: model.pricingSource,
        pricingSourceType: model.pricingSourceType,
        isOriginal: true,
      });

    // Third party — only include if the provider has real pricing (inputPrice or outputPrice > 0)
    Object.entries(model.thirdPartyPricing).forEach(([pid, pricing]) => {
      const inputPrice  = pricing.inputPrice  ?? pricing.input  ?? null;
      const outputPrice = pricing.outputPrice ?? pricing.output ?? null;
      const cachePrice  = pricing.cachePrice  ?? pricing.cache  ?? null;

      // Skip entries with no meaningful pricing data
      if (!inputPrice && !outputPrice) return;

      const source = pricing.source || 'manual-curated';
      const type = pricing.sourceType || 'curated';

      // Skip estimated/placeholder prices (user requested to hide if no official price exists)
      if (type === 'estimate' || source === 'manual-estimate' || source === 'router-curated') {
        return;
      }

      const p = getProvider(pid);
      entries.push({
        providerName: p ? p.name : pid,
        color: p ? p.color : '#94a3b8',
        website: p ? p.website : null,
        inputPrice:  inputPrice  ?? 0,
        cachePrice:  cachePrice  ?? 0,
        outputPrice: outputPrice ?? 0,
        pricingSource: pricing.source,
        pricingSourceType: pricing.sourceType,
        isOriginal: false,
      });
    });

    entries.forEach(e => e.total = e.inputPrice + e.outputPrice);
    const sortedEntries = sortModels(entries, compareSort, compareSortDir);

    const cheapest = sortedEntries.length > 0 ? sortedEntries.reduce((p, c) => p.total < c.total ? p : c) : null;
    const expTotal = sortedEntries.length > 0 ? Math.max(...sortedEntries.map(e => e.total)) : 0;

    const releaseStr = formatDate(model.updatedAt || model.releaseDate);
    
    let html = `
      <div class="compare-results-panel">
        <div class="compare-table-note">Sorted by total estimated cost. Swipe sideways on mobile to compare providers.</div>
        <div class="table-wrapper compare-table-wrapper">
          <table class="price-table compare-price-table">
          <thead>
            <tr>
              ${sortableHeader(typeof t === 'function' ? t('table.provider') || 'Provider' : 'Provider', 'providerName', 'compare')}
              <th>Type</th>
              ${sortableHeader(typeof t === 'function' ? t('table.input_price') || 'Input' : 'Input', 'inputPrice', 'compare')}
              ${sortableHeader(typeof t === 'function' ? t('table.cache_price') || 'Cache' : 'Cache', 'cachePrice', 'compare')}
              ${sortableHeader(typeof t === 'function' ? t('table.output_price') || 'Output' : 'Output', 'outputPrice', 'compare')}
              ${sortableHeader('Total', 'total', 'compare')}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedEntries.forEach((e, i) => {
      const isCheapest = cheapest && e === cheapest;
      const total = e.inputPrice + e.outputPrice;
      const savings = expTotal > 0 ? Math.round((1 - total / expTotal) * 100) : 0;
      const savingsVal = expTotal - total;

      const lblProvider = typeof t === 'function' ? t('table.provider') || 'Provider' : 'Provider';
      const lblType = 'Type';
      const lblInput = typeof t === 'function' ? t('table.input_price') || 'Input' : 'Input';
      const lblCache = typeof t === 'function' ? t('table.cache_price') || 'Cache' : 'Cache';
      const lblOutput = typeof t === 'function' ? t('table.output_price') || 'Output' : 'Output';
      const lblTotal = 'Total';
      const lblStatus = 'Status';
      
      const cacheStr = e.cachePrice ? fmtPrice(e.cachePrice) : '-';
      const sourceBadge = pricingSourceBadge(e);

      html += `
        <tr class="${isCheapest ? 'cheapest-row' : ''}">
          <td data-label="${lblProvider}">
            <div style="display:flex;align-items:center;gap:8px;">
               <span style="background:${e.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
               ${escHtml(e.providerName)}
               ${e.website ? `<a href="${e.website}" target="_blank" rel="noopener" style="color:var(--text-muted);text-decoration:none;font-size:0.85em;" title="Visit ${escHtml(e.providerName)}">🔗</a>` : ''}
            </div>
          </td>
          <td data-label="${lblType}">${e.isOriginal ? '<span class="badge badge-original">Official</span>' : '<span class="badge badge-thirdparty">3rd Party</span>'}${sourceBadge}</td>
          <td data-label="${lblInput}" style="color:var(--text-secondary);">${fmtPrice(e.inputPrice)}</td>
          <td data-label="${lblCache}" style="color:var(--text-secondary);">${cacheStr}</td>
          <td data-label="${lblOutput}" style="color:var(--text-secondary);">${fmtPrice(e.outputPrice)}</td>
          <td data-label="${lblTotal}" style="font-weight:700;color:${isCheapest ? 'var(--accent)' : 'inherit'};">${fmtPrice(total)}</td>
          <td data-label="${lblStatus}">
            <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;">
              ${isCheapest ? `<span class="badge badge-cheapest" style="background:var(--accent-glow);color:var(--accent);border:1px solid var(--accent-glow);">Best Price</span>` : ''}
              ${!isCheapest && savingsVal > 0 ? `<span style="color:var(--text-muted);font-size:0.85em;">+${fmtPrice(savingsVal)}</span>` : ''}
              ${!isCheapest && savingsVal <= 0 ? `<span style="color:var(--text-muted);font-size:0.85em;">-</span>` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div></div>`;
    grid.innerHTML = html;

    updateSortHeaders(grid, 'compare', compareSort, compareSortDir);
  }

  /* ==========================================================
     BEST PICKS
     ========================================================== */
  function renderBestPicks() {
    const grid = document.getElementById('best-picks-grid');
    if (!grid) return;

    const picks = getBestPicks();
    if (!picks.length) {
      grid.innerHTML = '<p class="compare-placeholder">' +
        (typeof t === 'function' ? t('general.no_results') || 'No recommendations available' : 'No recommendations available') +
        '</p>';
      return;
    }

    let html = '';
    picks.forEach((pick, index) => {
      const provider = getProvider(pick.model.provider);
      const providerName = provider ? provider.name : pick.model.provider;
      const providerColor = provider ? provider.color : 'var(--primary)';
      const scoreLabel = typeof t === 'function' ? t('best_picks.why_this_pick') || 'Why this pick' : 'Why this pick';
      const contextLabel = typeof t === 'function' ? t('table.context') || 'Context Window' : 'Context Window';
      const categoryLabel = typeof t === 'function' ? t('table.category') || 'Category' : 'Category';
      const actionLabel = typeof t === 'function' ? t('best_picks.view_in_compare') || 'View in Compare' : 'View in Compare';
      const noteLabel = typeof t === 'function' ? t('best_picks.free_tier_note') || 'Free tier available' : 'Free tier available';
      const freeTierBadge = pick.promo ? `<span class="badge badge-cheapest">${noteLabel}</span>` : '';

      html += `
        <article class="best-pick-card" style="animation-delay:${index * 50}ms;border-top:3px solid ${providerColor}">
          <div class="best-pick-header">
            <div>
              <p class="best-pick-kicker">${escHtml(pick.title)}</p>
              <h3 class="best-pick-model">${escHtml(pick.model.name)}</h3>
            </div>
            <span class="provider-pill">
              <span class="provider-dot" style="background:${providerColor}"></span>
              ${escHtml(providerName)}
            </span>
          </div>

          <p class="best-pick-summary">${escHtml(pick.summary)}</p>

          <div class="best-pick-meta">
            <div class="best-pick-stat">
              <span class="best-pick-stat-label">Input</span>
              <strong>${fmtPrice(pick.model.inputPrice)}</strong>
            </div>
            <div class="best-pick-stat">
              <span class="best-pick-stat-label">Output</span>
              <strong>${fmtPrice(pick.model.outputPrice)}</strong>
            </div>
            <div class="best-pick-stat">
              <span class="best-pick-stat-label">${escHtml(contextLabel)}</span>
              <strong>${formatContext(pick.model.contextWindow)}</strong>
            </div>
            <div class="best-pick-stat">
              <span class="best-pick-stat-label">${escHtml(categoryLabel)}</span>
              <strong>${stripTags(categoryBadge(pick.model.category))}</strong>
            </div>
          </div>

          <div class="best-pick-tags">
            <span class="badge badge-original">${escHtml(scoreLabel)}</span>
            <span class="badge badge-neutral">${escHtml(pick.reason)}</span>
            ${freeTierBadge}
          </div>

          <div class="best-pick-footer">
            <button class="best-pick-action" type="button" data-best-pick-model="${escHtml(pick.model.id)}">${escHtml(actionLabel)}</button>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
    grid.querySelectorAll('[data-best-pick-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelId = btn.getAttribute('data-best-pick-model');
        switchTab('compare');
        const select = document.getElementById('compare-model-select');
        if (select) select.value = modelId;
        renderCompareCards(modelId);
      });
    });
  }

  function getBestPicks() {
    const models = getPricedModels();
    const picks = [];

    const cheapestOverall = chooseBestModel(models, model => {
      const totalCost = model.inputPrice + model.outputPrice;
      return totalCost > 0 ? 100000 / totalCost : 0;
    });
    if (cheapestOverall) {
      picks.push({
        key: 'cheapest_overall',
        title: translateBestPick('best_picks.cheapest_overall'),
        summary: translateBestPick('best_picks.cheapest_overall_summary'),
        reason: translateBestPick('best_picks.reason_lowest_total'),
        model: cheapestOverall,
        promo: findPromoForProvider(cheapestOverall.provider),
      });
    }

    const bestForCoding = chooseBestModel(models, model => {
      const capabilityBoost = hasCapability(model, 'code') ? 40 : 0;
      const rankBoost = model.arenaRank ? Math.max(0, 22 - (model.arenaRank * 2)) : 0;
      const contextBoost = Math.min(model.contextWindow / 10000, 20);
      const costPenalty = model.inputPrice + model.outputPrice;
      return capabilityBoost + rankBoost + contextBoost + (model.topTierScore || 0) - costPenalty;
    }, model => hasCapability(model, 'code') || /gpt|claude|gemini|deepseek|qwen|kimi|glm|llama/i.test(model.name));
    if (bestForCoding) {
      picks.push({
        key: 'best_for_coding',
        title: translateBestPick('best_picks.best_for_coding'),
        summary: translateBestPick('best_picks.best_for_coding_summary'),
        reason: translateBestPick('best_picks.reason_code_quality'),
        model: bestForCoding,
        promo: findPromoForProvider(bestForCoding.provider),
      });
    }

    const bestLongContext = chooseBestModel(models, model => {
      const qualityBoost = (model.topTierScore || 0) * 1.5;
      const costPenalty = (model.inputPrice + model.outputPrice) * 3;
      return model.contextWindow + (qualityBoost * 1000) - (costPenalty * 1000);
    }, model => (model.contextWindow || 0) >= 128000);
    if (bestLongContext) {
      picks.push({
        key: 'best_for_long_context',
        title: translateBestPick('best_picks.best_for_long_context'),
        summary: translateBestPick('best_picks.best_for_long_context_summary'),
        reason: translateBestPick('best_picks.reason_context_window'),
        model: bestLongContext,
        promo: findPromoForProvider(bestLongContext.provider),
      });
    }

    const bestBudgetReasoning = chooseBestModel(models, model => {
      const reasoningBoost = hasCapability(model, 'reasoning') ? 45 : 0;
      const qualityBoost = model.category === 'reasoning' ? 30 : 0;
      const rankBoost = model.arenaRank ? Math.max(0, 20 - (model.arenaRank * 2)) : 0;
      const totalCost = model.inputPrice + model.outputPrice;
      return reasoningBoost + qualityBoost + rankBoost + (model.topTierScore || 0) - (totalCost * 2);
    }, model => hasCapability(model, 'reasoning') || model.category === 'reasoning');
    if (bestBudgetReasoning) {
      picks.push({
        key: 'best_budget_reasoning',
        title: translateBestPick('best_picks.best_budget_reasoning'),
        summary: translateBestPick('best_picks.best_budget_reasoning_summary'),
        reason: translateBestPick('best_picks.reason_reasoning_value'),
        model: bestBudgetReasoning,
        promo: findPromoForProvider(bestBudgetReasoning.provider),
      });
    }

    const bestFreeTier = chooseBestFreeTierModel(models);
    if (bestFreeTier) {
      picks.push({
        key: 'best_free_tier',
        title: translateBestPick('best_picks.best_free_tier'),
        summary: translateBestPick('best_picks.best_free_tier_summary'),
        reason: translateBestPick('best_picks.reason_free_tier_available'),
        model: bestFreeTier.model,
        promo: bestFreeTier.promo,
      });
    }

    return picks;
  }

  function chooseBestModel(models, scoreFn, filterFn = null) {
    let bestModel = null;
    let bestScore = -Infinity;

    models.forEach(model => {
      if (filterFn && !filterFn(model)) return;
      const score = scoreFn(model);
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    });

    return bestModel;
  }

  function chooseBestFreeTierModel(models) {
    const promos = typeof PROMOS !== 'undefined' ? PROMOS : [];
    const activeFreePromos = promos.filter(promo => promo.isActive && ['free-tier', 'free-credit', 'trial'].includes(promo.type));
    const candidates = models.filter(model => activeFreePromos.some(promo => promo.provider === model.provider));
    const model = chooseBestModel(candidates, item => {
      const qualityBoost = (item.topTierScore || 0) * 2;
      const rankBoost = item.arenaRank ? Math.max(0, 18 - (item.arenaRank * 2)) : 0;
      const pricePenalty = (item.inputPrice + item.outputPrice) * 2;
      return qualityBoost + rankBoost - pricePenalty;
    });

    if (!model) return null;
    return {
      model,
      promo: findPromoForProvider(model.provider),
    };
  }

  function findPromoForProvider(providerId) {
    const promos = typeof PROMOS !== 'undefined' ? PROMOS : [];
    return promos.find(promo => promo.provider === providerId && promo.isActive) || null;
  }

  function hasCapability(model, capability) {
    return Array.isArray(model.capabilities) && model.capabilities.includes(capability);
  }

  function translateBestPick(key) {
    return typeof t === 'function' ? t(key) || key : key;
  }

  /* ==========================================================
     PROMO DEALS
     ========================================================== */
  function getPromoDeals(minDiscountPercent = 50) {
    const deals = [];

    getPricedModels().forEach(model => {
      const officialPricing = model.officialPricing;
      if (!officialPricing) return;

      const officialTotal = getPricingTotal(officialPricing);
      if (!(officialTotal > 0)) return;

      const thirdPartyPricing = model.thirdPartyPricing || {};
      Object.keys(thirdPartyPricing).forEach(providerId => {
        const dealPricing = thirdPartyPricing[providerId];
        if (!dealPricing) return;

        const dealTotal = getPricingTotal(dealPricing);
        if (dealTotal < 0) return;

        const discountPercent = Math.round((1 - (dealTotal / officialTotal)) * 1000) / 10;
        if (discountPercent < minDiscountPercent) return;

        const provider = getProvider(model.provider);
        const dealProviderName = getDealProviderName(providerId);
        const sourceLabel = getPricingSourceLabel(dealPricing, providerId);
        deals.push({
          id: `${model.id}:${providerId}`,
          model,
          providerName: provider ? provider.name : model.provider,
          providerColor: provider ? provider.color : 'var(--primary)',
          dealProviderId: providerId,
          dealProviderName,
          sourceLabel,
          officialPricing,
          dealPricing,
          officialTotal,
          dealTotal,
          discountPercent,
          savingsTotal: officialTotal - dealTotal,
          updatedAt: dealPricing.updatedAt || officialPricing.updatedAt || model.updatedAt || model.releaseDate || '',
          sourceUrl: dealPricing.sourceUrl || officialPricing.sourceUrl || model.sourceUrl || '',
        });
      });
    });

    return sortPromoDeals(deals, promoSort, promoSortDir);
  }

  function sortPromoDeals(deals, key, dir = 1) {
    return [...deals].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key === 'modelName') {
        valA = a.model && a.model.name ? a.model.name : '';
        valB = b.model && b.model.name ? b.model.name : '';
      } else if (key === 'providerName' || key === 'dealProviderName' || key === 'sourceLabel') {
        valA = valA || '';
        valB = valB || '';
      } else if (key === 'updatedAt') {
        valA = Date.parse(a.updatedAt || 0);
        valB = Date.parse(b.updatedAt || 0);
      }

      if (valA == null || Number.isNaN(valA)) valA = dir === 1 ? Infinity : -Infinity;
      if (valB == null || Number.isNaN(valB)) valB = dir === 1 ? Infinity : -Infinity;

      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * dir;
      const diff = (valA - valB) * dir;
      if (diff !== 0) return diff;
      return (a.model.name || '').localeCompare(b.model.name || '');
    });
  }

  function getDefaultSortDir(key) {
    return ['discountPercent', 'savingsTotal', 'updatedAt'].includes(key) ? -1 : 1;
  }

  function sortableHeader(label, key, table = '') {
    const tableAttr = table ? ` data-table="${table}"` : '';
    return `<th class="sortable" data-sort="${key}"${tableAttr}><button class="table-sort-button" type="button">${escHtml(label)} <span class="sort-icon">↕</span></button></th>`;
  }

  function updateSortHeaders(root, table, activeSort, activeDir) {
    root.querySelectorAll(`th.sortable[data-table="${table}"]`).forEach(th => {
      th.classList.remove('active', 'asc', 'desc');
      const icon = th.querySelector('.sort-icon');
      if (th.dataset.sort === activeSort) {
        th.classList.add('active', activeDir === 1 ? 'asc' : 'desc');
        if (icon) icon.textContent = activeDir === 1 ? '↑' : '↓';
      } else if (icon) {
        icon.textContent = '↕';
      }
    });
  }

  function renderPromos() {
    const grid = document.getElementById('promo-grid');
    if (!grid) return;

    const deals = getPromoDeals(50);
    if (!deals.length) {
      grid.innerHTML = '<p class="compare-placeholder">' +
        (typeof t === 'function' ? t('promo.empty') || 'No major API promos detected right now.' : 'No major API promos detected right now.') +
        '</p>';
      return;
    }

    const viewLabel = typeof t === 'function' ? t('promo.view_compare') || 'Compare' : 'Compare';
    const officialLabel = typeof t === 'function' ? t('promo.official_total') || 'Official' : 'Official';
    const promoLabel = typeof t === 'function' ? t('promo.promo_total') || 'Promo' : 'Promo';
    const savingsLabel = typeof t === 'function' ? t('promo.you_save') || 'Save' : 'Save';
    const sourceLabel = typeof t === 'function' ? t('promo.source') || 'Source' : 'Source';
    const updatedLabel = typeof t === 'function' ? t('table.updated') || 'Updated' : 'Updated';
    const modelLabel = typeof t === 'function' ? t('table.model') || 'Model' : 'Model';
    const discountLabel = typeof t === 'function' ? t('promo.discount') || 'Discount' : 'Discount';

    const rows = deals.map(deal => `
      <tr>
        <td data-label="${escHtml(modelLabel)}">
          <div class="promo-table-model">
            <span class="provider-dot" style="background:${deal.providerColor}"></span>
            <div>
              <strong>${escHtml(deal.model.name)}</strong>
              <span>${escHtml(deal.providerName)}</span>
            </div>
          </div>
        </td>
        <td data-label="${escHtml(sourceLabel)}">
          <div class="promo-table-source">
            <strong>${escHtml(deal.dealProviderName)}</strong>
            <a href="${escHtml(deal.sourceUrl || '#')}" target="_blank" rel="noopener">${escHtml(deal.sourceLabel)}</a>
          </div>
        </td>
        <td data-label="${escHtml(discountLabel)}"><span class="promo-discount-pill">-${deal.discountPercent}%</span></td>
        <td data-label="${escHtml(officialLabel)}" class="promo-table-number">${fmtPrice(deal.officialTotal)}</td>
        <td data-label="${escHtml(promoLabel)}" class="promo-table-number promo-table-deal">${fmtPrice(deal.dealTotal)}</td>
        <td data-label="${escHtml(savingsLabel)}" class="promo-table-number promo-table-save">${fmtPrice(deal.savingsTotal)}</td>
        <td data-label="${escHtml(updatedLabel)}" class="promo-table-updated">${escHtml(formatDate(deal.updatedAt))}</td>
        <td data-label="Action"><button class="promo-table-action" type="button" data-promo-model="${escHtml(deal.model.id)}">${escHtml(viewLabel)}</button></td>
      </tr>
    `).join('');

    grid.innerHTML = `
      <div class="promo-table-wrapper">
        <table class="promo-table">
          <thead>
            <tr>
              ${sortableHeader(modelLabel, 'modelName', 'promo')}
              ${sortableHeader(sourceLabel, 'dealProviderName', 'promo')}
              ${sortableHeader(discountLabel, 'discountPercent', 'promo')}
              ${sortableHeader(officialLabel, 'officialTotal', 'promo')}
              ${sortableHeader(promoLabel, 'dealTotal', 'promo')}
              ${sortableHeader(savingsLabel, 'savingsTotal', 'promo')}
              ${sortableHeader(updatedLabel, 'updatedAt', 'promo')}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    updateSortHeaders(grid, 'promo', promoSort, promoSortDir);
    grid.querySelectorAll('[data-promo-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelId = btn.getAttribute('data-promo-model');
        switchTab('compare');
        const select = document.getElementById('compare-model-select');
        if (select) select.value = modelId;
        renderCompareCards(modelId);
      });
    });
  }

  /* ==========================================================
     SCROLL ANIMATIONS (Intersection Observer)
     ========================================================== */
  function setupScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section, .promo-table-wrapper, .compare-card, .best-pick-card, .hero-content').forEach(el => {
      observer.observe(el);
    });
  }

  /* ==========================================================
     MOBILE MENU
     ========================================================== */
  function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (!btn || !mobileNav) return;

    mobileNav.setAttribute('aria-hidden', 'true');

    const syncMenuState = (isOpen) => {
      btn.classList.toggle('active', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      mobileNav.classList.toggle('active', isOpen);
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      document.body.classList.toggle('mobile-menu-open', isOpen);
    };

    window.toggleMobileNav = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      syncMenuState(!isOpen);
    };

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        window.toggleMobileNav(e);
      }
    });

    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => syncMenuState(false));
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !btn.contains(e.target)) {
        syncMenuState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) syncMenuState(false);
    });
  }

  function closeMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }
    if (mobileNav) {
      mobileNav.classList.remove('active');
      mobileNav.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('mobile-menu-open');
  }

  /* ==========================================================
     HERO STATS & LAST UPDATED
     ========================================================== */
  function updateHeroStats() {
    const provSet = new Set();
    const models = getPricedModels();
    models.forEach(m => provSet.add(m.provider));

    const provEl   = document.getElementById('stat-providers');
    const modelEl  = document.getElementById('stat-models');
    const promoEl  = document.getElementById('stat-promos');

    if (provEl)  provEl.textContent = provSet.size + '+';
    if (modelEl) modelEl.textContent = models.length + '+';
    if (promoEl) promoEl.textContent = getPromoDeals(50).length + '+';
  }

  function setLastUpdated() {
    const el = document.getElementById('last-updated');
    if (!el) return;

    const models = getPricedModels();
    const timestamps = models
      .map(m => Date.parse(m.updatedAt || m.releaseDate || ''))
      .filter(ts => !Number.isNaN(ts));

    if (timestamps.length > 0) {
      el.textContent = formatDate(new Date(Math.max(...timestamps)).toISOString());
      return;
    }

    el.textContent = formatDate(new Date().toISOString());
  }

  /* ==========================================================
     UTILITY HELPERS
     ========================================================== */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function getPricedModels() {
    const models = typeof MODELS !== 'undefined' ? MODELS : [];
    return models.filter(model => model.status !== 'deprecated' && hasValidModelPrice(model));
  }

  function hasValidModelPrice(model) {
    return isPositiveNumber(model.inputPrice) || isPositiveNumber(model.outputPrice);
  }

  function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  function getProvider(id) {
    return (typeof PROVIDERS !== 'undefined' && PROVIDERS[id]) ? PROVIDERS[id] : null;
  }

  function getProviderName(id) {
    const p = getProvider(id);
    return p ? p.name : id;
  }

  function fmtPrice(usdAmount) {
    if (typeof formatPrice === 'function') return formatPrice(usdAmount);
    return '$' + usdAmount.toFixed(2);
  }

  function getPricingTotal(pricing) {
    if (!pricing) return -1;
    const input = isNonNegativeNumber(pricing.inputPrice) ? pricing.inputPrice : 0;
    const output = isNonNegativeNumber(pricing.outputPrice) ? pricing.outputPrice : 0;
    return input + output;
  }

  function isNonNegativeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  function getDealProviderName(providerId) {
    const map = {
      openrouter: 'OpenRouter',
      sumopod: 'Sumopod',
      deepinfra: 'DeepInfra',
    };
    return map[providerId] || getProviderName(providerId);
  }

  function getPricingSourceLabel(pricing, providerId) {
    if (!pricing) return getDealProviderName(providerId);
    if (pricing.source === 'openrouter-api') return 'OpenRouter API';
    if (pricing.source === 'sumopod-api') return 'Sumopod API';
    if (pricing.source === 'deepinfra-api') return 'DeepInfra API';
    if (pricing.source) return pricing.source;
    return getDealProviderName(providerId);
  }

  function formatContext(tokens) {
    if (!tokens) return '—';
    if (tokens >= 1_000_000) return (tokens / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(0) + 'K';
    return tokens.toString();
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escHtml(value);

    const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthsId = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const isId = typeof getLanguage === 'function' && getLanguage() === 'id';
    const months = isId ? monthsId : monthsEn;

    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  }

  function pricingSourceBadge(item) {
    const source = item.pricingSource || item.source || (item.openrouterId ? 'openrouter-api' : 'manual-curated');
    const type = item.pricingSourceType || item.sourceType || (source === 'openrouter-api' ? 'curated' : 'curated');
    const label = source === 'openrouter-api'
      ? 'OpenRouter'
      : type === 'official'
        ? 'Official'
        : type === 'estimate'
          ? 'Estimate'
          : 'Curated';
    const color = source === 'openrouter-api'
      ? 'var(--primary)'
      : type === 'official'
        ? 'var(--accent)'
        : type === 'estimate'
          ? 'var(--warning, #f59e0b)'
          : 'var(--text-muted)';

    return `<span class="cap-badge" title="Pricing source: ${escHtml(source)} (${escHtml(type)})" style="border-color:${color};color:${color};">${label}</span>`;
  }

  function categoryBadge(cat) {
    const map = {
      flagship:  { label: 'Flagship',  cls: 'cat-flagship' },
      mid:       { label: 'Mid-tier',  cls: 'cat-mid' },
      budget:    { label: 'Budget',    cls: 'cat-budget' },
      reasoning: { label: 'Reasoning', cls: 'cat-reasoning' },
    };
    const info = map[cat] || { label: cat || '—', cls: '' };
    // Translate if possible
    let label = info.label;
    if (typeof t === 'function') {
      const translated = t('filter.' + cat);
      if (translated) label = translated;
    }
    return `<span class="badge ${info.cls}">${escHtml(label)}</span>`;
  }

  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function stripTags(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }


})();
