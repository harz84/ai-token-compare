// =============================================================================
// AI Token Price Compare — Internationalization (i18n) Module
// Supports: English (en), Indonesian (id)
// =============================================================================

const TRANSLATIONS = {
  en: {
    // ─── Header ───────────────────────────────────────────────────────────────
    'site.title': 'AI Token Price Compare',
    'site.tagline': 'Compare AI Token Prices Across All Platforms',
    'site.subtitle': 'Find the best deals on AI API tokens from 20+ providers worldwide',

    // ─── Navigation ───────────────────────────────────────────────────────────
    'nav.all_models': 'All Models',
    'nav.compare': 'Compare',
    'nav.best_picks': 'Best Picks',
    'nav.promos': 'Promo',
    'nav.free_models': 'Free Models',

    // ─── Table Headers ────────────────────────────────────────────────────────
    'table.provider': 'Provider',
    'table.model': 'Model',
    'table.input_price': 'Input (per 1M)',
    'table.cache_price': 'Cache (per 1M)',
    'table.output_price': 'Output (per 1M)',
    'table.context': 'Context Window',
    'table.category': 'Category',
    'table.capabilities': 'Capabilities',
    'table.updated': 'Updated',

    // ─── Filters ──────────────────────────────────────────────────────────────
    'filter.all': 'All',
    'filter.global': 'Global',
    'filter.china': 'China',
    'filter.third_party': 'Third Party',
    'filter.flagship': 'Flagship',
    'filter.mid': 'Mid-tier',
    'filter.budget': 'Budget',
    'filter.reasoning': 'Reasoning',
    'filter.sort_by': 'Sort by',
    'filter.sort_cheapest_input': 'Cheapest Input',
    'filter.sort_cheapest_output': 'Cheapest Output',
    'filter.sort_name': 'Name (A-Z)',
    'filter.sort_context': 'Context Window',
    'filter.search_placeholder': 'Search models, providers...',

    // ─── Compare ──────────────────────────────────────────────────────────────
    'compare.title': 'Multi-Provider Price Comparison',
    'compare.subtitle': 'See how much the same model costs across different providers',
    'compare.select_model': 'Select a model to compare',
    'compare.select_prompt': 'Select a model above to see price comparison across providers',
    'compare.cheapest': 'Cheapest',
    'compare.savings': 'You save',
    'compare.vs_official': 'vs official price',
    'compare.official_price': 'Official Price',
    'compare.no_alternatives': 'No third-party alternatives available for this model',

    // ─── Free Models ─────────────────────────────────────────────────────────
    'free_models.title': 'Free AI Models',
    'free_models.subtitle': 'Models with free API access, free tiers, or near-zero cost offers for testing and lightweight production usage',
    'free_models.signup': 'Get API Key',
    'free_models.docs': 'Docs',
    'free_models.no_card': 'No card',
    'free_models.card_required': 'Card required',
    'free_models.rate_limits': 'Rate limits',
    'free_models.endpoint': 'Endpoint',
    'free_models.api_section_title': 'Free API Models',
    'free_models.api_section_subtitle': 'Call these directly with an API key — no cost, or near-zero cost as noted per model.',
    'free_models.type_free_credit': 'Free credit',
    'free_models.type_free_tier': 'Free tier',
    'free_models.type_trial': 'Trial',
    'free_models.claim_offer': 'Claim offer',

    // ─── Best Picks ───────────────────────────────────────────────────────────
    'best_picks.title': 'Best Picks',
    'best_picks.subtitle': 'Fast recommendations for the most useful model categories',
    'best_picks.cheapest_overall': 'Cheapest overall',
    'best_picks.best_for_coding': 'Best for coding',
    'best_picks.best_for_long_context': 'Best for long context',
    'best_picks.best_budget_reasoning': 'Best budget reasoning',
    'best_picks.best_free_tier': 'Best free tier',
    'best_picks.cheapest_overall_summary': 'Lowest combined input and output price for high-volume usage.',
    'best_picks.best_for_coding_summary': 'Balanced quality, coding capability, and usable context for developer workflows.',
    'best_picks.best_for_long_context_summary': 'Best fit when you need to process large documents, repositories, or long chats.',
    'best_picks.best_budget_reasoning_summary': 'Reasoning-focused model with a stronger price-to-capability tradeoff.',
    'best_picks.best_free_tier_summary': 'Strongest model option from providers with active free access, credits, or trials.',
    'best_picks.reason_lowest_total': 'Lowest input + output price',
    'best_picks.reason_code_quality': 'Strong coding fit',
    'best_picks.reason_context_window': 'Largest practical context',
    'best_picks.reason_reasoning_value': 'Reasoning value pick',
    'best_picks.reason_free_tier_available': 'Active free offer',
    'best_picks.why_this_pick': 'Why this pick',
    'best_picks.view_in_compare': 'View in Compare',
    'best_picks.free_tier_note': 'Free tier available',

    // ─── Promos ───────────────────────────────────────────────────────────────
    'promo.title': 'Promo',
    'promo.subtitle': 'AI models currently at least 50% cheaper than their official price, detected from connected API pricing sources',
    'promo.active': 'Active',
    'promo.expired': 'Expired',
    'promo.ongoing': 'Ongoing',
    'promo.valid_until': 'Valid until',
    'promo.claim': 'Claim Offer',
    'promo.free_credit': 'Free Credit',
    'promo.discount': 'Discount',
    'promo.free_tier': 'Free Tier',
    'promo.trial': 'Trial',
    'promo.empty': 'No major API promos detected right now.',
    'promo.view_compare': 'View in Compare',
    'promo.official_total': 'Official total',
    'promo.promo_total': 'Promo total',
    'promo.you_save': 'You save',
    'promo.source': 'Source',
    'promo.discount_suffix': 'cheaper vs official',

    // ─── General ──────────────────────────────────────────────────────────────
    'general.per_1m': 'per 1M tokens',
    'general.tokens': 'tokens',
    'general.last_updated': 'Last updated',
    'general.disclaimer': 'Prices may change. Always verify on the official provider website.',
    'general.currency': 'Currency',
    'general.language': 'Language',
    'general.no_results': 'No models found matching your criteria',
    'general.loading': 'Loading...',
    'general.vision': 'Vision',
    'general.function_calling': 'Function Calling',
    'general.json_mode': 'JSON Mode',
    'general.code': 'Code',
    'general.reasoning': 'Reasoning',
    'general.region': 'Region',

    // ─── Footer ───────────────────────────────────────────────────────────────
    'footer.built_with': 'Built with ❤️ for the AI community',
    'footer.disclaimer': 'This is an independent comparison tool. Prices shown are approximate and may vary. Always check official pricing pages for the most current rates.',
    'footer.contribute': 'Found an error? Let us know!',
  },

  id: {
    // ─── Header ───────────────────────────────────────────────────────────────
    'site.title': 'Bandingkan Harga Token AI',
    'site.tagline': 'Bandingkan Harga Token AI dari Semua Platform',
    'site.subtitle': 'Temukan penawaran terbaik token API AI dari 20+ penyedia di seluruh dunia',

    // ─── Navigation ───────────────────────────────────────────────────────────
    'nav.all_models': 'Semua Model',
    'nav.compare': 'Bandingkan',
    'nav.best_picks': 'Best Picks',
    'nav.promos': 'Promo',
    'nav.free_models': 'Model Gratis',

    // ─── Table Headers ────────────────────────────────────────────────────────
    'table.provider': 'Penyedia',
    'table.model': 'Model',
    'table.input_price': 'Input (per 1M)',
    'table.cache_price': 'Cache (per 1M)',
    'table.output_price': 'Output (per 1M)',
    'table.context': 'Context Window',
    'table.category': 'Kategori',
    'table.capabilities': 'Kemampuan',
    'table.updated': 'Diperbarui',

    // ─── Filters ──────────────────────────────────────────────────────────────
    'filter.all': 'Semua',
    'filter.global': 'Global',
    'filter.china': 'Tiongkok',
    'filter.third_party': 'Pihak Ketiga',
    'filter.flagship': 'Unggulan',
    'filter.mid': 'Menengah',
    'filter.budget': 'Hemat',
    'filter.reasoning': 'Reasoning',
    'filter.sort_by': 'Urutkan',
    'filter.sort_cheapest_input': 'Input Termurah',
    'filter.sort_cheapest_output': 'Output Termurah',
    'filter.sort_name': 'Nama (A-Z)',
    'filter.sort_context': 'Context Window',
    'filter.search_placeholder': 'Cari model, penyedia...',

    // ─── Compare ──────────────────────────────────────────────────────────────
    'compare.title': 'Perbandingan Harga Multi-Penyedia',
    'compare.subtitle': 'Lihat berapa biaya model yang sama dari penyedia berbeda',
    'compare.select_model': 'Pilih model untuk dibandingkan',
    'compare.select_prompt': 'Pilih model di atas untuk melihat perbandingan harga antar penyedia',
    'compare.cheapest': 'Termurah',
    'compare.savings': 'Anda hemat',
    'compare.vs_official': 'vs harga resmi',
    'compare.official_price': 'Harga Resmi',
    'compare.no_alternatives': 'Tidak ada alternatif pihak ketiga untuk model ini',

    // ─── Free Models ─────────────────────────────────────────────────────────
    'free_models.title': 'Model AI Gratis',
    'free_models.subtitle': 'Model dengan akses API gratis, free tier, atau biaya nyaris nol untuk testing dan penggunaan ringan',
    'free_models.signup': 'Ambil API Key',
    'free_models.docs': 'Dokumentasi',
    'free_models.no_card': 'Tanpa kartu',
    'free_models.card_required': 'Perlu kartu',
    'free_models.rate_limits': 'Rate limit',
    'free_models.endpoint': 'Endpoint',
    'free_models.api_section_title': 'Model API Gratis',
    'free_models.api_section_subtitle': 'Panggil langsung pakai API key — tanpa biaya, atau biaya nyaris nol sesuai catatan tiap model.',
    'free_models.type_free_credit': 'Kredit gratis',
    'free_models.type_free_tier': 'Free tier',
    'free_models.type_trial': 'Uji coba',
    'free_models.claim_offer': 'Ambil penawaran',

    // ─── Best Picks ───────────────────────────────────────────────────────────
    'best_picks.title': 'Best Picks',
    'best_picks.subtitle': 'Rekomendasi cepat untuk kategori model yang paling berguna',
    'best_picks.cheapest_overall': 'Termurah secara umum',
    'best_picks.best_for_coding': 'Terbaik untuk coding',
    'best_picks.best_for_long_context': 'Terbaik untuk konteks panjang',
    'best_picks.best_budget_reasoning': 'Reasoning hemat budget',
    'best_picks.best_free_tier': 'Free tier terbaik',
    'best_picks.cheapest_overall_summary': 'Harga gabungan input dan output paling rendah untuk penggunaan volume tinggi.',
    'best_picks.best_for_coding_summary': 'Kombinasi kualitas, kemampuan coding, dan context window yang cocok untuk workflow developer.',
    'best_picks.best_for_long_context_summary': 'Pilihan terbaik saat perlu memproses dokumen besar, repository, atau chat panjang.',
    'best_picks.best_budget_reasoning_summary': 'Model reasoning dengan tradeoff harga dan kemampuan yang lebih kuat.',
    'best_picks.best_free_tier_summary': 'Opsi model terkuat dari penyedia yang punya akses gratis, kredit, atau trial aktif.',
    'best_picks.reason_lowest_total': 'Harga input + output terendah',
    'best_picks.reason_code_quality': 'Cocok untuk coding',
    'best_picks.reason_context_window': 'Context window paling praktis',
    'best_picks.reason_reasoning_value': 'Pilihan reasoning bernilai tinggi',
    'best_picks.reason_free_tier_available': 'Promo gratis aktif',
    'best_picks.why_this_pick': 'Alasan pilihan',
    'best_picks.view_in_compare': 'Lihat di Compare',
    'best_picks.free_tier_note': 'Free tier tersedia',

    // ─── Promos ───────────────────────────────────────────────────────────────
    'promo.title': 'Promo',
    'promo.subtitle': 'Model AI yang saat ini minimal 50% lebih murah dari harga resmi, dideteksi dari source harga API yang terhubung',
    'promo.active': 'Aktif',
    'promo.expired': 'Berakhir',
    'promo.ongoing': 'Berlangsung',
    'promo.valid_until': 'Berlaku hingga',
    'promo.claim': 'Ambil Penawaran',
    'promo.free_credit': 'Kredit Gratis',
    'promo.discount': 'Diskon',
    'promo.free_tier': 'Gratis',
    'promo.trial': 'Uji Coba',
    'promo.empty': 'Tidak ada promo API besar yang terdeteksi saat ini.',
    'promo.view_compare': 'Lihat di Compare',
    'promo.official_total': 'Total resmi',
    'promo.promo_total': 'Total promo',
    'promo.you_save': 'Hemat',
    'promo.source': 'Sumber',
    'promo.discount_suffix': 'lebih murah vs harga resmi',

    // ─── General ──────────────────────────────────────────────────────────────
    'general.per_1m': 'per 1M token',
    'general.tokens': 'token',
    'general.last_updated': 'Terakhir diperbarui',
    'general.disclaimer': 'Harga dapat berubah. Selalu verifikasi di situs resmi penyedia.',
    'general.currency': 'Mata Uang',
    'general.language': 'Bahasa',
    'general.no_results': 'Tidak ada model yang sesuai dengan kriteria Anda',
    'general.loading': 'Memuat...',
    'general.vision': 'Vision',
    'general.function_calling': 'Function Calling',
    'general.json_mode': 'Mode JSON',
    'general.code': 'Kode',
    'general.reasoning': 'Reasoning',
    'general.region': 'Wilayah',

    // ─── Footer ───────────────────────────────────────────────────────────────
    'footer.built_with': 'Dibuat dengan ❤️ untuk komunitas AI',
    'footer.disclaimer': 'Ini adalah alat perbandingan independen. Harga yang ditampilkan bersifat perkiraan dan dapat berbeda. Selalu periksa halaman harga resmi untuk tarif terkini.',
    'footer.contribute': 'Menemukan kesalahan? Beritahu kami!',
  },
};

// ─── State ──────────────────────────────────────────────────────────────────────

let currentLang = localStorage.getItem('preferred-lang') || 'en';

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Translate a key to the current language.
 * Falls back to the English translation, then to the raw key if not found.
 * @param {string} key - Dot-notation translation key (e.g. 'site.title')
 * @returns {string} Translated string
 */
function t(key) {
  if (!key || typeof key !== 'string') return '';

  // Try current language first
  if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined) {
    return TRANSLATIONS[currentLang][key];
  }

  // Fallback to English
  if (currentLang !== 'en' && TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) {
    return TRANSLATIONS.en[key];
  }

  // Last resort: return the key itself
  return key;
}

/**
 * Set the active language, persist to localStorage, and dispatch a change event.
 * @param {string} lang - Language code ('en' or 'id')
 */
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) {
    console.warn(`[i18n] Unknown language "${lang}". Available: ${Object.keys(TRANSLATIONS).join(', ')}`);
    return;
  }

  if (lang === currentLang) return;

  currentLang = lang;

  try {
    localStorage.setItem('preferred-lang', lang);
  } catch (e) {
    // localStorage may be unavailable (private browsing, storage quota, etc.)
    console.warn('[i18n] Could not persist language preference:', e.message);
  }

  // Dispatch custom event for reactive UI updates
  window.dispatchEvent(
    new CustomEvent('languageChanged', {
      detail: { language: lang },
      bubbles: true,
    })
  );
}

/**
 * Get the currently active language code.
 * @returns {string} Current language code
 */
function getLanguage() {
  return currentLang;
}

/**
 * Get all available language codes.
 * @returns {string[]} Array of language codes
 */
function getAvailableLanguages() {
  return Object.keys(TRANSLATIONS);
}

/**
 * Get the display name for a language code.
 * @param {string} lang - Language code
 * @returns {string} Human-readable language name
 */
function getLanguageName(lang) {
  const names = {
    en: 'English',
    id: 'Bahasa Indonesia',
  };
  return names[lang] || lang;
}

/**
 * Translate a provider/model field that has _en and _id suffixed variants.
 * E.g., translateField(provider, 'description') reads description_en or description_id.
 * @param {object} obj - Object containing the translatable fields
 * @param {string} field - Base field name (without _en/_id suffix)
 * @returns {string} Translated string
 */
function translateField(obj, field) {
  if (!obj) return '';

  const langKey = `${field}_${currentLang}`;
  const fallbackKey = `${field}_en`;

  return obj[langKey] || obj[fallbackKey] || obj[field] || '';
}

// ─── Global Exports ─────────────────────────────────────────────────────────────

window.TRANSLATIONS = TRANSLATIONS;
window.t = t;
window.setLanguage = setLanguage;
window.getLanguage = getLanguage;
window.getAvailableLanguages = getAvailableLanguages;
window.getLanguageName = getLanguageName;
window.translateField = translateField;
