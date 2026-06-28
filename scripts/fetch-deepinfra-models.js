const fs = require('fs');
const path = require('path');

// DeepInfra exposes a PUBLIC OpenAI-compatible model list endpoint.
// Pricing is included in metadata.pricing.{input_tokens,output_tokens,cache_read_tokens}
// Units are USD per 1 MILLION tokens (same scale as this project).
// No API key is required for the public model list endpoint.
const DEEPINFRA_MODELS_URL = 'https://api.deepinfra.com/v1/openai/models';

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'deepinfra-models.generated.json');
const OUTPUT_JS_PATH = path.join(PROJECT_ROOT, 'js', 'deepinfra-merge.generated.js');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'deepinfra-merge-report.json');

// Map internal model IDs → list of DeepInfra model ID candidates.
// DeepInfra IDs follow the format: "org/model-name"
// We prefer the most capable / newest variant for each family.
const DEEPINFRA_MODEL_MAP = {
  // DeepSeek
  'deepseek-r1':       ['deepseek-ai/DeepSeek-R1-0528', 'deepseek-ai/DeepSeek-R1'],
  'deepseek-v3':       ['deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-V3'],
  'deepseek-v3-1':     ['deepseek-ai/DeepSeek-V3.2', 'deepseek-ai/DeepSeek-V3'],

  // Kimi / Moonshot
  'kimi-k2-7':         ['moonshotai/Kimi-K2.7', 'moonshotai/Kimi-K2.6'],
  'kimi-k2-6':         ['moonshotai/Kimi-K2.6'],
  'kimi-k2':           ['moonshotai/Kimi-K2.6', 'moonshotai/Kimi-K2'],

  // MiniMax
  'minimax-m2-7-highspeed': ['MiniMaxAI/MiniMax-M2.7'],
  'minimax-m2-7':           ['MiniMaxAI/MiniMax-M2.7'],
  'minimax-m2-5':           ['MiniMaxAI/MiniMax-M2.5'],

  // GLM / ZAI
  'glm-4-5':   ['zai-org/GLM-5'],
  'glm-4-plus': ['zai-org/GLM-4.6'],

  // Google Gemini (hosted on DeepInfra)
  'gemini-3-5-flash':      ['google/gemini-3.5-flash'],
  'gemini-3-1-pro':        ['google/gemini-3.1-pro'],
  'gemini-3-1-flash-lite': ['google/gemini-3.1-flash-lite'],
  'gemini-2-5-pro':        ['google/gemini-2.5-pro'],
  'gemini-2-5-flash':      ['google/gemini-2.5-flash'],
  'gemini-2-5-flash-lite': ['google/gemini-1.5-flash-8b'],
  'gemini-2-0-flash':      ['google/gemini-2.5-flash'],

  // Qwen3 (hosted on DeepInfra)
  'qwen3-235b-a22b':   ['Qwen/Qwen3-235B-A22B-Instruct-2507', 'Qwen/Qwen3-235B-A22B-Thinking-2507'],
  'qwen3-max':         ['Qwen/Qwen3-Max-Thinking'],
  'qwen3-turbo':       ['Qwen/Qwen3-32B'],
  'qwen3-plus':        ['Qwen/Qwen3-30B-A3B'],

  // Added by mapping audit
  'claude-opus-4-8': ['anthropic/claude-opus-4-8'],
  'claude-opus-4-7': ['anthropic/claude-opus-4-7'],
  'claude-sonnet-4-6': ['anthropic/claude-sonnet-4-6'],
  'kimi-k2-7': ['moonshotai/Kimi-K2.7-Code', 'moonshotai/Kimi-K2.7'],
  'kimi-k2-6': ['moonshotai/Kimi-K2.6'],
  'kimi-k2': ['moonshotai/Kimi-K2.5'],
  'mimo-v2-5-pro': ['XiaomiMiMo/MiMo-V2.5-Pro'],
  'mimo-v2-5': ['XiaomiMiMo/MiMo-V2.5'],
  'mimo-v2': ['XiaomiMiMo/MiMo-V2.5'],
  'glm-5-2': ['zai-org/GLM-5.2'],
  'glm-5-1': ['zai-org/GLM-5.1'],
  'glm-5': ['zai-org/GLM-5'],
  'glm-4-7': ['zai-org/GLM-4.7'],
  'glm-4-7-flash': ['zai-org/GLM-4.7-Flash'],
  'deepseek-v3-1': ['deepseek-ai/DeepSeek-V3.1'],
  'deepseek-r1': ['deepseek-ai/DeepSeek-R1-0528'],
  'deepseek-v3': ['deepseek-ai/DeepSeek-V3'],
  'deepseek-v4-pro': ['deepseek-ai/DeepSeek-V4-Pro'],
  'deepseek-v4-flash': ['deepseek-ai/DeepSeek-V4-Flash'],
  'claude-haiku-4-5': ['anthropic/claude-haiku-4-5'],
  'claude-haiku-4': ['anthropic/claude-haiku-4-5'],
  'qwen3-max': ['Qwen/Qwen3-Max'],
  'qwen-3-7-max': ['Qwen/Qwen3.7-Max'],
  'qwen3-coder': ['Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo'],
  'qwen3-vl': ['Qwen/Qwen3-VL-235B-A22B-Instruct'],
  'mistral-small-latest': ['mistralai/Mistral-Small-24B-Instruct-2501'],
  'llama-4-maverick': ['meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8'],
  'llama-4-scout': ['meta-llama/Llama-4-Scout-17B-16E-Instruct'],
  'llama-3-3-70b-instruct': ['meta-llama/Llama-3.3-70B-Instruct-Turbo'],
  'llama-guard-4': ['meta-llama/Llama-Guard-4-12B'],
  'minimax-m2-7': ['MiniMaxAI/MiniMax-M2.7'],
  'minimax-m2-5': ['MiniMaxAI/MiniMax-M2.5'],
  'gemma-3-27b': ['google/gemma-3-27b-it'],
  'gemma-3-12b': ['google/gemma-3-12b-it'],
  'gemma-3-4b': ['google/gemma-3-4b-it'],
};

function roundTo6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Normalize a raw DeepInfra model entry into a clean, flat structure.
 * DeepInfra pricing units are already in USD / 1M tokens.
 */
function normalizeDeepinfraModel(item, updatedAt) {
  const meta = item.metadata || {};
  const pricing = meta.pricing || {};
  const tags = meta.tags || [];

  return {
    id: item.id,
    ownedBy: item.owned_by || null,
    contextLength: meta.context_length || null,
    maxTokens: meta.max_tokens || null,
    inputPrice:  Number.isFinite(pricing.input_tokens)       ? roundTo6(pricing.input_tokens)       : null,
    outputPrice: Number.isFinite(pricing.output_tokens)      ? roundTo6(pricing.output_tokens)      : null,
    cachePrice:  Number.isFinite(pricing.cache_read_tokens)  ? roundTo6(pricing.cache_read_tokens)  : null,
    hasVision:   tags.includes('vlm') || tags.includes('vision'),
    hasReasoning: tags.includes('reasoning'),
    tags,
    source: 'deepinfra-api',
    sourceType: 'inference-platform',
    sourceUrl: DEEPINFRA_MODELS_URL,
    updatedAt,
    raw: item,
  };
}

function createIndex(models) {
  const byId = new Map();
  const byNormalizedId = new Map();

  models.forEach(model => {
    byId.set(model.id, model);
    byNormalizedId.set(normalizeKey(model.id), model);
  });

  return { byId, byNormalizedId };
}

function pickDeepinfraModel(candidates, index) {
  for (const candidate of candidates) {
    if (index.byId.has(candidate)) return index.byId.get(candidate);
    const normalized = normalizeKey(candidate);
    if (index.byNormalizedId.has(normalized)) return index.byNormalizedId.get(normalized);
  }
  return null;
}

function toPricingPatch(deepinfraModel) {
  return {
    inputPrice:  deepinfraModel.inputPrice,
    cachePrice:  deepinfraModel.cachePrice,
    outputPrice: deepinfraModel.outputPrice,
    deepinfraId: deepinfraModel.id,
    source: 'deepinfra-api',
    sourceType: 'inference-platform',
    sourceUrl: DEEPINFRA_MODELS_URL,
    updatedAt: deepinfraModel.updatedAt,
  };
}

function toModelPatch(internalId, deepinfraModel) {
  const patch = {
    thirdPartyPricing: {
      deepinfra: toPricingPatch(deepinfraModel),
    },
    confidence: 'high',
  };

  if (deepinfraModel.contextLength) patch.contextWindow = deepinfraModel.contextLength;

  return [internalId, patch, { deepinfraId: deepinfraModel.id }];
}

function generateBrowserPatch(patches, report) {
  return (
    `// =============================================================================\n` +
    `// Generated by scripts/fetch-deepinfra-models.js\n` +
    `// Source: ${report.source}\n` +
    `// Fetched: ${report.fetchedAt}\n` +
    `// Matched: ${report.matchedCount}, Missing: ${report.missingCount}\n` +
    `// Pricing: Real per-token prices from DeepInfra public API\n` +
    `// =============================================================================\n\n` +
    `(function () {\n` +
    `  'use strict';\n\n` +
    `  const DEEPINFRA_MODEL_PATCHES = ${JSON.stringify(patches, null, 2)};\n\n` +
    `  function mergeDeep(target, patch) {\n` +
    `    Object.keys(patch).forEach(key => {\n` +
    `      const value = patch[key];\n` +
    `      if (value && typeof value === 'object' && !Array.isArray(value)) {\n` +
    `        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};\n` +
    `        mergeDeep(target[key], value);\n` +
    `      } else {\n` +
    `        target[key] = value;\n` +
    `      }\n` +
    `    });\n` +
    `    return target;\n` +
    `  }\n\n` +
    `  function applyDeepinfraPatches() {\n` +
    `    if (!window.MODELS || !Array.isArray(window.MODELS)) return;\n` +
    `    const byId = new Map(window.MODELS.map(model => [model.id, model]));\n` +
    `    DEEPINFRA_MODEL_PATCHES.forEach(([internalId, patch]) => {\n` +
    `      const model = byId.get(internalId);\n` +
    `      if (!model) return;\n` +
    `      mergeDeep(model, patch);\n` +
    `    });\n` +
    `  }\n\n` +
    `  window.DEEPINFRA_MODEL_PATCHES = DEEPINFRA_MODEL_PATCHES;\n` +
    `  window.DEEPINFRA_MERGE_REPORT = ${JSON.stringify(report, null, 2)};\n` +
    `  applyDeepinfraPatches();\n` +
    `})();\n`
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ai-token-compare/1.0',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepInfra request failed: ${response.status} ${response.statusText} – ${body.slice(0, 300)}`);
  }

  return response.json();
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const payload = await fetchJson(DEEPINFRA_MODELS_URL);
  const rows = Array.isArray(payload.data) ? payload.data : [];

  // Only keep chat / text-generation models that have token-based pricing
  const normalizedModels = rows
    .map(item => normalizeDeepinfraModel(item, fetchedAt.slice(0, 10)))
    .filter(model => model.id && (model.inputPrice !== null || model.outputPrice !== null))
    .sort((a, b) => a.id.localeCompare(b.id));

  const output = {
    source: DEEPINFRA_MODELS_URL,
    fetchedAt,
    count: normalizedModels.length,
    note: 'DeepInfra /v1/openai/models exposes real per-token pricing in metadata.pricing.',
    models: normalizedModels,
  };

  const index = createIndex(normalizedModels);
  const patches = [];
  const matched = [];
  const missing = [];

  Object.entries(DEEPINFRA_MODEL_MAP).forEach(([internalId, candidates]) => {
    const deepinfraModel = pickDeepinfraModel(candidates, index);
    if (!deepinfraModel) {
      missing.push({ internalId, candidates });
      return;
    }

    const [patchedId, patch] = toModelPatch(internalId, deepinfraModel);
    patches.push([patchedId, patch]);
    matched.push({
      internalId,
      deepinfraId: deepinfraModel.id,
      inputPrice:  deepinfraModel.inputPrice,
      cachePrice:  deepinfraModel.cachePrice,
      outputPrice: deepinfraModel.outputPrice,
      contextLength: deepinfraModel.contextLength,
    });
  });

  const report = {
    source: DEEPINFRA_MODELS_URL,
    fetchedAt,
    generatedAt: new Date().toISOString(),
    availableCount: normalizedModels.length,
    mappedCount: Object.keys(DEEPINFRA_MODEL_MAP).length,
    matchedCount: matched.length,
    missingCount: missing.length,
    matched,
    missing,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_JS_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUTPUT_JS_PATH, generateBrowserPatch(patches, report), 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`Fetched ${rows.length} DeepInfra models, kept ${normalizedModels.length} with token pricing`);
  console.log(`Matched ${matched.length}/${Object.keys(DEEPINFRA_MODEL_MAP).length} internal models`);
  console.log(`Generated ${OUTPUT_JS_PATH}`);
  if (missing.length > 0) {
    console.warn(`Missing ${missing.length} models:`, missing.map(m => m.internalId).join(', '));
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
