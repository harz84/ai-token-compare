const fs = require('fs');
const path = require('path');

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'data', 'openrouter-models.generated.json');

function usdPerTokenToUsdPerMillion(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number * 1_000_000 * 1_000_000) / 1_000_000;
}

function inferProvider(modelId) {
  const providerSlug = String(modelId || '').split('/')[0];
  const providerMap = {
    anthropic: 'anthropic',
    openai: 'openai',
    google: 'google',
    'google-gemini': 'google',
    deepseek: 'deepseek',
    moonshotai: 'moonshot',
    'z-ai': 'zhipu',
    qwen: 'alibaba',
    'x-ai': 'xai',
    mistralai: 'mistral',
    'meta-llama': 'meta',
    cohere: 'cohere',
    minimax: 'minimax',
    xiaomi: 'xiaomi',
  };

  return providerMap[providerSlug] || providerSlug || 'unknown';
}

function extractModelSlug(modelId) {
  const parts = String(modelId || '').split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : String(modelId || '');
}

function pickCachePrice(pricing) {
  return usdPerTokenToUsdPerMillion(
    pricing.input_cache_read
      ?? pricing.cache_read
      ?? pricing.prompt_cache
      ?? pricing.cache
      ?? null
  );
}

function normalizeOpenRouterModel(model, updatedAt) {
  const pricing = model.pricing || {};
  const inputPrice = usdPerTokenToUsdPerMillion(pricing.prompt);
  const outputPrice = usdPerTokenToUsdPerMillion(pricing.completion);
  const cachePrice = pickCachePrice(pricing);

  return {
    id: model.id,
    name: model.name || model.id,
    provider: inferProvider(model.id),
    modelSlug: extractModelSlug(model.id),
    canonicalSlug: model.canonical_slug || null,
    contextWindow: model.context_length || null,
    inputPrice,
    outputPrice,
    cachePrice,
    source: 'openrouter-api',
    sourceType: 'curated',
    sourceUrl: OPENROUTER_MODELS_URL,
    updatedAt,
    supportedParameters: Array.isArray(model.supported_parameters) ? model.supported_parameters : [],
    architecture: model.architecture || null,
    topProvider: model.top_provider || null,
    modality: model.modality || null,
    rawPricing: pricing,
  };
}

async function fetchOpenRouterModels() {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-token-compare/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const payload = await fetchOpenRouterModels();
  const models = Array.isArray(payload.data) ? payload.data : [];
  const updatedAt = new Date().toISOString();

  const normalizedModels = models
    .map(model => normalizeOpenRouterModel(model, updatedAt.slice(0, 10)))
    .filter(model => model.inputPrice !== null || model.outputPrice !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  const output = {
    source: OPENROUTER_MODELS_URL,
    fetchedAt: updatedAt,
    count: normalizedModels.length,
    models: normalizedModels,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`Generated ${normalizedModels.length} OpenRouter models at ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
