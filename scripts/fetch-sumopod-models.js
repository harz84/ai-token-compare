const fs = require('fs');
const path = require('path');

const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com';
const SUMOPOD_MODEL_INFO_URL = `${SUMOPOD_BASE_URL}/model/info`;
const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY;

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'sumopod-models.generated.json');
const OUTPUT_JS_PATH = path.join(PROJECT_ROOT, 'js', 'sumopod-merge.generated.js');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'sumopod-merge-report.json');

const SUMOPOD_MODEL_MAP = {
  'claude-opus-4-8': ['claude-opus-4-8'],
  'claude-sonnet-4-6': ['claude-sonnet-4-6'],
  'claude-haiku-4-5': ['claude-haiku-4-5'],

  'gemini-3-5-flash': ['gemini/gemini-3.5-flash'],
  'gemini-3-1-pro': ['gemini/gemini-3.1-pro-preview'],
  'gemini-3-flash': ['gemini/gemini-3-flash-preview'],
  'gemini-2-5-pro': ['gemini/gemini-2.5-pro'],
  'gemini-2-5-flash': ['gemini/gemini-2.5-flash'],
  'gemini-2-5-flash-lite': ['gemini/gemini-2.5-flash-lite'],
  'gemini-2-0-flash': ['gemini/gemini-2.0-flash'],
  'gemini-1-5-pro': ['gemini/gemini-1.5-pro'],

  'gpt-5-4-official': ['gpt-5.4'],
  'gpt-5-4-mini': ['gpt-5.4-mini'],
  'gpt-5-4-nano': ['gpt-5.4-nano'],
  'gpt-5-5-official': ['gpt-5.5'],
  'gpt-5-5': ['gpt-5.5'],
  'gpt-5-5-high': ['gpt-5.5'],
  'gpt-5-5-xhigh': ['gpt-5.5'],

  'kimi-k2-7': ['kimi-k2.7'],
  'kimi-k2-6': ['kimi-k2.6'],

  'minimax-m2-7-highspeed': ['MiniMax-M2.7-highspeed'],
  'minimax-m3': ['MiniMax-M3'],

  'mimo-v2-5-pro': ['mimo-v2.5-pro'],

  'glm-5-2': ['glm-5.2'],
  'glm-5-2-air': ['glm-5.2-air'],
  'glm-4-5': ['glm-4.5'],
  'glm-4-plus': ['glm-4.7', 'glm-4-plus'],
  'glm-4-air': ['glm-4.5-air', 'glm-4-air'],
  'glm-4-flash': ['glm-4.7-flash', 'glm-4-flash'],

  'qwen3-max': ['qwen3.7-max', 'qwen3-max'],
  'qwen3-plus': ['qwen3.7-plus', 'qwen3-plus'],
  'qwen-3-6-plus': ['qwen3.6-plus'],
  'qwen3-turbo': ['qwen3.6-flash', 'qwen3-turbo'],

  // Added by mapping audit
  'gpt-5-5-xhigh': ['gpt-5'],
  'gpt-5-5-high': ['gpt-5'],
  'gpt-5-5': ['gpt-5'],
  'gpt-5-4-high': ['gpt-5'],
  'claude-opus-4-8': ['claude-opus-4-8'],
  'claude-opus-4-7': ['claude-opus-4-7'],
  'claude-sonnet-4-6': ['claude-sonnet-4-6'],
  'gemini-3-5-flash': ['gemini/gemini-3.5-flash'],
  'gemini-3-1-pro': ['gemini/gemini-3.1-pro-preview'],
  'gemini-3-flash': ['gemini/gemini-3-flash-preview'],
  'qwen-3-6-plus': ['qwen3.6-plus'],
  'minimax-m3': ['MiniMax-M3'],
  'kimi-k2-7': ['kimi-k2.7'],
  'kimi-k2-6': ['kimi-k2.6'],
  'kimi-k2': ['kimi-k2.6'],
  'mimo-v2-5-pro': ['mimo-v2.5'],
  'glm-5-2': ['glm-5'],
  'glm-5-2-air': ['glm-5'],
  'gpt-5-5-official': ['gpt-5'],
  'gpt-5-4-official': ['gpt-5'],
  'gpt-5-4-mini': ['gpt-5'],
  'gpt-5-4-nano': ['gpt-5'],
  'claude-opus-4-8-fast': ['claude-opus-4-8'],
  'claude-haiku-4-5': ['claude-haiku-4-5'],
  'gemini-2-5-flash': ['gemini/gemini-2.5-flash'],
  'gemini-2-5-flash-lite': ['gemini/gemini-2.5-flash-lite'],
  'minimax-m2-7-highspeed': ['MiniMax-M2.7-highspeed'],
  'minimax-m2-7': ['MiniMax-M2.7-highspeed'],
  'gemini-3-1-flash': ['gemini/gemini-3.1-flash-lite'],
  'gemini-3-1-flash-lite': ['gemini/gemini-3.1-flash-lite'],
  'gpt-5-5-pro': ['gpt-5'],
  'gpt-5-4-pro': ['gpt-5'],
  'gpt-5-4-thinking': ['gpt-5'],
  'gpt-5-3-instant': ['gpt-5'],
  'kimi-k2-7-code': ['kimi-k2.7'],
  'deepseek-v4-pro-max': ['deepseek-v4-pro'],
  'deepseek-v4-pro-high': ['deepseek-v4-pro'],
  'deepseek-v4-flash': ['deepseek-v4-flash'],
  'qwen-3-7-max': ['qwen3.7-max'],
  'claude-haiku-4': ['claude-haiku-4-5'],
  'gpt-5-5-thinking': ['gpt-5'],
  'gpt-5': ['gpt-5'],
  'gpt-5-mini': ['gpt-5'],
  'gpt-5-nano': ['gpt-5'],
  'deepseek-v4-pro': ['deepseek-v4-pro'],
  'glm-5-1': ['glm-5'],
  'glm-5': ['glm-5'],
  'mimo-v2-5': ['mimo-v2.5'],
  'mimo-v2': ['mimo-v2.5'],
};

function perTokenToPerMillion(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number * 1_000_000 * 1_000_000) / 1_000_000;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeSumopodModel(item, updatedAt) {
  const info = item.model_info || {};
  const litellmParams = item.litellm_params || {};
  const modelName = item.model_name || info.key || litellmParams.model;

  return {
    id: modelName,
    provider: info.litellm_provider || litellmParams.custom_llm_provider || null,
    mode: info.mode || null,
    inputPrice: perTokenToPerMillion(info.input_cost_per_token),
    cachePrice: perTokenToPerMillion(
      info.cache_read_input_token_cost
        ?? info.cache_creation_input_token_cost
        ?? null
    ),
    outputPrice: perTokenToPerMillion(info.output_cost_per_token),
    contextWindow: info.max_input_tokens || info.max_tokens || null,
    maxOutput: info.max_output_tokens || null,
    supportsPromptCaching: !!info.supports_prompt_caching,
    supportsVision: !!info.supports_vision,
    supportsFunctionCalling: !!info.supports_function_calling,
    supportsReasoning: !!info.supports_reasoning,
    source: 'sumopod-api',
    sourceType: 'router',
    sourceUrl: SUMOPOD_MODEL_INFO_URL,
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

function pickSumopodModel(candidates, index) {
  for (const candidate of candidates) {
    if (index.byId.has(candidate)) return index.byId.get(candidate);
    const normalized = normalizeKey(candidate);
    if (index.byNormalizedId.has(normalized)) return index.byNormalizedId.get(normalized);
  }
  return null;
}

function toPricingPatch(sumopodModel) {
  return {
    inputPrice: sumopodModel.inputPrice,
    cachePrice: sumopodModel.cachePrice,
    outputPrice: sumopodModel.outputPrice,
    source: 'sumopod-api',
    sourceType: 'router',
    sourceUrl: SUMOPOD_MODEL_INFO_URL,
    updatedAt: sumopodModel.updatedAt,
  };
}

function toModelPatch(internalId, sumopodId, sumopodModel) {
  const patch = {
    thirdPartyPricing: {
      sumopod: toPricingPatch(sumopodModel),
    },
    confidence: 'high',
  };

  if (sumopodModel.contextWindow) patch.contextWindow = sumopodModel.contextWindow;
  if (sumopodModel.maxOutput) patch.maxOutput = sumopodModel.maxOutput;

  return [internalId, patch, { sumopodId, provider: sumopodModel.provider, mode: sumopodModel.mode }];
}

function generateBrowserPatch(patches, report) {
  return `// =============================================================================\n` +
    `// Generated by scripts/fetch-sumopod-models.js\n` +
    `// Source: ${report.source}\n` +
    `// Fetched: ${report.fetchedAt}\n` +
    `// Matched: ${report.matchedCount}, Missing: ${report.missingCount}\n` +
    `// =============================================================================\n\n` +
    `(function () {\n` +
    `  'use strict';\n\n` +
    `  const SUMOPOD_MODEL_PATCHES = ${JSON.stringify(patches, null, 2)};\n\n` +
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
    `  function applySumopodPatches() {\n` +
    `    if (!window.MODELS || !Array.isArray(window.MODELS)) return;\n` +
    `    const byId = new Map(window.MODELS.map(model => [model.id, model]));\n` +
    `    SUMOPOD_MODEL_PATCHES.forEach(([internalId, patch]) => {\n` +
    `      const model = byId.get(internalId);\n` +
    `      if (!model) return;\n` +
    `      mergeDeep(model, patch);\n` +
    `    });\n` +
    `  }\n\n` +
    `  window.SUMOPOD_MODEL_PATCHES = SUMOPOD_MODEL_PATCHES;\n` +
    `  window.SUMOPOD_MERGE_REPORT = ${JSON.stringify(report, null, 2)};\n` +
    `  applySumopodPatches();\n` +
    `})();\n`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${SUMOPOD_API_KEY}`,
      'User-Agent': 'ai-token-compare/1.0',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sumopod request failed: ${response.status} ${response.statusText} ${body}`);
  }

  return response.json();
}

async function main() {
  if (!SUMOPOD_API_KEY) {
    throw new Error('Missing SUMOPOD_API_KEY environment variable');
  }

  const fetchedAt = new Date().toISOString();
  const payload = await fetchJson(SUMOPOD_MODEL_INFO_URL);
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const normalizedModels = rows
    .map(item => normalizeSumopodModel(item, fetchedAt.slice(0, 10)))
    .filter(model => model.id && (model.inputPrice !== null || model.outputPrice !== null))
    .sort((a, b) => a.id.localeCompare(b.id));

  const output = {
    source: SUMOPOD_MODEL_INFO_URL,
    fetchedAt,
    count: normalizedModels.length,
    models: normalizedModels,
  };

  const index = createIndex(normalizedModels);
  const patches = [];
  const matched = [];
  const missing = [];

  Object.entries(SUMOPOD_MODEL_MAP).forEach(([internalId, candidates]) => {
    const sumopodModel = pickSumopodModel(candidates, index);
    if (!sumopodModel) {
      missing.push({ internalId, candidates });
      return;
    }

    const [patchedInternalId, patch, meta] = toModelPatch(internalId, sumopodModel.id, sumopodModel);
    patches.push([patchedInternalId, patch]);
    matched.push({
      internalId,
      sumopodId: meta.sumopodId,
      provider: meta.provider,
      mode: meta.mode,
      inputPrice: sumopodModel.inputPrice,
      cachePrice: sumopodModel.cachePrice,
      outputPrice: sumopodModel.outputPrice,
      contextWindow: sumopodModel.contextWindow,
    });
  });

  const report = {
    source: SUMOPOD_MODEL_INFO_URL,
    fetchedAt,
    generatedAt: new Date().toISOString(),
    availableCount: normalizedModels.length,
    mappedCount: Object.keys(SUMOPOD_MODEL_MAP).length,
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

  console.log(`Generated ${normalizedModels.length} Sumopod models at ${OUTPUT_JSON_PATH}`);
  console.log(`Generated ${patches.length} Sumopod patches at ${OUTPUT_JS_PATH}`);
  console.log(`Generated Sumopod merge report at ${REPORT_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
