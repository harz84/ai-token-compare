const fs = require('fs');
const path = require('path');

const MODELS_DEV_URL = 'https://models.dev/api.json';
const OPENCODE_PROVIDER_ID = 'opencode';
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'opencode-models.generated.json');
const OUTPUT_JS_PATH = path.join(PROJECT_ROOT, 'js', 'opencode-models.generated.js');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'opencode-models-report.json');

// Exact-model coding benchmarks from first-party model cards or release pages.
// Models without a trustworthy public mapping intentionally remain unscored.
const FREE_MODEL_BENCHMARKS = {
  'north-mini-code-free': {
    sourceDate: '2026-06-09',
    benchmarks: [
      { metric: 'SWE-bench Verified', score: 67.6, source: 'https://huggingface.co/CohereLabs/North-Mini-Code-1.0' },
      { metric: 'LiveCodeBench v6', score: 70.3, source: 'https://huggingface.co/blog/CohereLabs/introducing-north-mini-code' },
      { metric: 'Terminal-Bench 2.0', score: 36.0, source: 'https://huggingface.co/CohereLabs/North-Mini-Code-1.0' },
    ],
  },
  'laguna-s-2.1-free': {
    sourceDate: '2026-07-21',
    benchmarks: [
      { metric: 'SWE-bench Multilingual', score: 78.5, source: 'https://huggingface.co/poolside/Laguna-S-2.1' },
      { metric: 'Terminal-Bench 2.1', score: 70.2, source: 'https://huggingface.co/poolside/Laguna-S-2.1' },
      { metric: 'SWE-bench Pro', score: 59.4, source: 'https://huggingface.co/poolside/Laguna-S-2.1' },
    ],
  },
  'deepseek-v4-flash-free': {
    sourceDate: '2026-06-22',
    note_en: 'Scores use the published max-reasoning configuration.',
    note_id: 'Skor menggunakan konfigurasi max-reasoning yang dipublikasikan.',
    benchmarks: [
      { metric: 'LiveCodeBench (max)', score: 91.6, source: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash' },
      { metric: 'SWE-bench Verified (max)', score: 79.0, source: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash' },
      { metric: 'Terminal-Bench 2.0 (max)', score: 56.9, source: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash' },
    ],
  },
  'mimo-v2.5-free': {
    sourceDate: '2026-04-22',
    benchmarks: [
      { metric: 'MiMo Coding Bench', score: 71.8, source: 'https://mimo.xiaomi.com/mimo-v2-5' },
      { metric: 'Terminal-Bench 2.0', score: 65.8, source: 'https://huggingface.co/XiaomiMiMo/MiMo-V2.5' },
      { metric: 'SWE-bench Pro', score: 56.1, source: 'https://huggingface.co/XiaomiMiMo/MiMo-V2.5' },
    ],
  },
};

function inferCapabilities(model) {
  const capabilities = [];
  const inputModalities = (model.modalities && model.modalities.input) || [];

  if (model.attachment || inputModalities.includes('image') || inputModalities.includes('pdf')) capabilities.push('vision');
  if (model.reasoning) capabilities.push('reasoning');
  if (model.tool_call) capabilities.push('function-calling');
  if (model.structured_output) capabilities.push('json-mode');

  return capabilities;
}

function inferCategory(model) {
  const name = `${model.id} ${model.name || ''}`.toLowerCase();
  const inputPrice = Number(model.cost && model.cost.input) || 0;
  const outputPrice = Number(model.cost && model.cost.output) || 0;

  if (model.reasoning && /(reason|opus|pro|thinking|deepseek|glm|kimi|gpt-5)/.test(name)) return 'reasoning';
  if (/(opus|fable|max|ultra|pro|flagship)/.test(name) || inputPrice >= 5 || outputPrice >= 20) return 'flagship';
  if (/(mini|nano|flash|lite|small|haiku|air)/.test(name) || inputPrice <= 0.5) return 'budget';
  return 'mid';
}

function normalizeModel(model) {
  const cost = model.cost || {};
  const limit = model.limit || {};

  return {
    id: model.id,
    name: model.name || model.id,
    description: model.description || '',
    family: model.family || '',
    inputPrice: Number(cost.input) || 0,
    cachePrice: Number(cost.cache_read) || 0,
    cacheWritePrice: Number(cost.cache_write) || 0,
    outputPrice: Number(cost.output) || 0,
    contextWindow: Number(limit.context) || null,
    maxOutput: Number(limit.output) || null,
    capabilities: inferCapabilities(model),
    category: inferCategory(model),
    releaseDate: model.release_date || null,
    updatedAt: model.last_updated || model.release_date || null,
    status: model.status || 'active',
    openWeights: Boolean(model.open_weights),
  };
}

function isFreeModel(model) {
  return model.status !== 'deprecated' && model.inputPrice === 0 && model.outputPrice === 0;
}

function toFreeModelEntry(model, provider) {
  const benchmarkData = FREE_MODEL_BENCHMARKS[model.id] || null;

  return {
    id: `free-opencode-${model.id}`,
    priceUsdPerMillion: 0,
    modelName: model.name,
    modelId: `opencode/${model.id}`,
    provider: OPENCODE_PROVIDER_ID,
    apiEndpoint: `${provider.api.replace(/^https?:\/\//, '')}/chat/completions`,
    contextWindow: model.contextWindow,
    capabilities: model.capabilities,
    rateLimits: 'Temporary OpenCode Zen free model; availability and limits may change',
    requiresCard: true,
    signup: 'https://opencode.ai/auth',
    docs: provider.doc || 'https://opencode.ai/docs/zen',
    note_en: 'Free for a limited time through OpenCode Zen. Review the provider privacy terms before sending sensitive data.',
    note_id: 'Gratis untuk waktu terbatas lewat OpenCode Zen. Periksa ketentuan privasi provider sebelum mengirim data sensitif.',
    benchmarks: benchmarkData ? benchmarkData.benchmarks : [],
    benchmarkSourceDate: benchmarkData ? benchmarkData.sourceDate : null,
    benchmarkNote_en: benchmarkData && benchmarkData.note_en ? benchmarkData.note_en : '',
    benchmarkNote_id: benchmarkData && benchmarkData.note_id ? benchmarkData.note_id : '',
    releaseDate: model.releaseDate,
    updatedAt: model.updatedAt,
  };
}

function generateBrowserFile(models, freeModels, metadata) {
  return `// =============================================================================\n` +
    `// Generated by scripts/fetch-opencode-models.js\n` +
    `// Source: ${metadata.source}\n` +
    `// Fetched: ${metadata.fetchedAt}\n` +
    `// Active paid models: ${models.length}; free models: ${freeModels.length}\n` +
    `// =============================================================================\n\n` +
    `(function () {\n` +
    `  'use strict';\n\n` +
    `  const OPENCODE_MODELS = ${JSON.stringify(models, null, 2)};\n` +
    `  const OPENCODE_FREE_MODELS = ${JSON.stringify(freeModels, null, 2)};\n\n` +
    `  function normalizeId(value) {\n` +
    `    return String(value || '')\n` +
    `      .toLowerCase()\n` +
    `      .replace(/[^a-z0-9]+/g, '-')\n` +
    `      .replace(/^-+|-+$/g, '');\n` +
    `  }\n\n` +
    `  function findExistingModel(models, opencodeId) {\n` +
    `    const normalizedId = normalizeId(opencodeId);\n` +
    `    return models.find(model => {\n` +
    `      const existingId = normalizeId(model.id);\n` +
    `      return existingId === normalizedId || existingId === normalizedId + '-official';\n` +
    `    }) || null;\n` +
    `  }\n\n` +
    `  if (window.PROVIDERS) {\n` +
    `    window.PROVIDERS.opencode = ${JSON.stringify(metadata.provider, null, 2)};\n` +
    `  }\n\n` +
    `  if (Array.isArray(window.MODELS)) {\n` +
    `    OPENCODE_MODELS.forEach(opencodeModel => {\n` +
    `      const existing = findExistingModel(window.MODELS, opencodeModel.id);\n` +
    `      const pricing = {\n` +
    `        inputPrice: opencodeModel.inputPrice,\n` +
    `        cachePrice: opencodeModel.cachePrice,\n` +
    `        outputPrice: opencodeModel.outputPrice,\n` +
    `        source: 'models-dev-opencode',\n` +
    `        sourceType: 'curated',\n` +
    `        sourceUrl: '${MODELS_DEV_URL}',\n` +
    `        updatedAt: opencodeModel.updatedAt\n` +
    `      };\n\n` +
    `      if (existing) {\n` +
    `        existing.thirdPartyPricing = existing.thirdPartyPricing || {};\n` +
    `        existing.thirdPartyPricing.opencode = pricing;\n` +
    `        existing.opencodeId = opencodeModel.id;\n` +
    `        if (!existing.releaseDate && opencodeModel.releaseDate) existing.releaseDate = opencodeModel.releaseDate;\n` +
    `        return;\n` +
    `      }\n\n` +
    `      window.MODELS.push({\n` +
    `        id: 'opencode-' + normalizeId(opencodeModel.id),\n` +
    `        name: opencodeModel.name,\n` +
    `        provider: 'opencode',\n` +
    `        inputPrice: opencodeModel.inputPrice,\n` +
    `        cachePrice: opencodeModel.cachePrice,\n` +
    `        outputPrice: opencodeModel.outputPrice,\n` +
    `        contextWindow: opencodeModel.contextWindow,\n` +
    `        maxOutput: opencodeModel.maxOutput,\n` +
    `        capabilities: opencodeModel.capabilities,\n` +
    `        category: opencodeModel.category,\n` +
    `        releaseDate: opencodeModel.releaseDate,\n` +
    `        updatedAt: opencodeModel.updatedAt,\n` +
    `        status: 'active',\n` +
    `        confidence: 'high',\n` +
    `        pricingSource: 'models-dev-opencode',\n` +
    `        pricingSourceType: 'curated',\n` +
    `        sourceUrl: '${MODELS_DEV_URL}',\n` +
    `        officialPricing: pricing,\n` +
    `        thirdPartyPricing: {},\n` +
    `        opencodeId: opencodeModel.id\n` +
    `      });\n` +
    `    });\n` +
    `  }\n\n` +
    `  if (Array.isArray(window.FREE_API_MODELS)) {\n` +
    `    const existingIds = new Set(window.FREE_API_MODELS.map(model => model.id));\n` +
    `    OPENCODE_FREE_MODELS.forEach(model => {\n` +
    `      if (!existingIds.has(model.id)) window.FREE_API_MODELS.push(model);\n` +
    `    });\n` +
    `  }\n\n` +
    `  window.OPENCODE_MODELS = OPENCODE_MODELS;\n` +
    `  window.OPENCODE_FREE_MODELS = OPENCODE_FREE_MODELS;\n` +
    `  window.OPENCODE_MODELS_REPORT = ${JSON.stringify(metadata.report, null, 2)};\n` +
    `})();\n`;
}

async function main() {
  const response = await fetch(MODELS_DEV_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ai-token-compare/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Models.dev request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const provider = payload[OPENCODE_PROVIDER_ID];
  if (!provider || !provider.models) {
    throw new Error('OpenCode provider is missing from Models.dev');
  }

  const fetchedAt = new Date().toISOString();
  const normalizedModels = Object.values(provider.models)
    .map(normalizeModel)
    .sort((a, b) => a.id.localeCompare(b.id));
  const freeModels = normalizedModels.filter(isFreeModel).map(model => toFreeModelEntry(model, provider));
  const paidModels = normalizedModels.filter(model => model.status !== 'deprecated' && !isFreeModel(model));
  const report = {
    source: MODELS_DEV_URL,
    provider: OPENCODE_PROVIDER_ID,
    fetchedAt,
    availableCount: normalizedModels.length,
    activePaidCount: paidModels.length,
    freeCount: freeModels.length,
    benchmarkedFreeCount: freeModels.filter(model => model.benchmarks.length > 0).length,
    deprecatedCount: normalizedModels.filter(model => model.status === 'deprecated').length,
    freeModelIds: freeModels.map(model => model.modelId),
  };
  const providerMetadata = {
    id: OPENCODE_PROVIDER_ID,
    name: provider.name || 'OpenCode Zen',
    region: 'global',
    type: 'third-party',
    website: 'https://opencode.ai/zen',
    color: '#60a5fa',
    description_en: 'Curated AI gateway maintained by the OpenCode team, with rotating free models.',
    description_id: 'Gateway AI terkurasi dari tim OpenCode, termasuk model gratis yang terus berubah.',
  };
  const output = {
    source: MODELS_DEV_URL,
    fetchedAt,
    provider: {
      id: provider.id,
      name: provider.name,
      api: provider.api,
      doc: provider.doc,
    },
    count: normalizedModels.length,
    models: normalizedModels,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUTPUT_JS_PATH, generateBrowserFile(paidModels, freeModels, {
    source: MODELS_DEV_URL,
    fetchedAt,
    provider: providerMetadata,
    report,
  }), 'utf8');

  console.log(`Generated ${paidModels.length} paid and ${freeModels.length} free OpenCode models`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
