const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const OPENROUTER_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'openrouter-models.generated.json');
const OUTPUT_JS_PATH = path.join(PROJECT_ROOT, 'js', 'openrouter-merge.generated.js');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'openrouter-merge-report.json');

const OPENROUTER_MODEL_MAP = {
  'gpt-5-5-official': 'openai/gpt-5.5',
  'gpt-5-4-official': 'openai/gpt-5.4',
  'gpt-5-4-mini': 'openai/gpt-5.4-mini',
  'gpt-5-4-nano': 'openai/gpt-5.4-nano',

  'claude-fable-5': 'anthropic/claude-fable-5',
  'claude-opus-4-8': 'anthropic/claude-opus-4.8',
  'claude-opus-4-8-fast': 'anthropic/claude-opus-4.8-fast',
  'claude-sonnet-4-6': 'anthropic/claude-sonnet-4.6',
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-haiku-4-5': 'anthropic/claude-haiku-4.5',
  'claude-mythos-5': '~anthropic/claude-fable-latest',

  'gemini-3-5-flash': 'google/gemini-3.5-flash',
  'gemini-3-1-pro': 'google/gemini-3.1-pro-preview',
  'gemini-2-5-pro': 'google/gemini-2.5-pro',
  'gemini-2-5-flash': 'google/gemini-2.5-flash',
  'gemini-2-5-flash-lite': 'google/gemini-2.5-flash-lite',
  'gemini-2-0-flash': 'google/gemini-2.5-flash',
  'gemini-1-5-pro': 'google/gemini-2.5-pro',
  'grok-4': 'x-ai/grok-4.20',
  'grok-3': 'x-ai/grok-4.3',
  'grok-4-3': 'x-ai/grok-4.3',

  'qwen3-max': 'qwen/qwen3-max',
  'qwen3-plus': 'qwen/qwen3.7-plus',
  'qwen3-turbo': 'qwen/qwen3.6-flash',

  'mistral-large-latest': 'mistralai/mistral-large',
  'magistral-medium-latest': 'mistralai/mistral-medium-3-5',
  'codestral-latest': 'mistralai/codestral-2508',
  'mistral-small-latest': 'mistralai/mistral-small-2603',
  'ministral-8b-latest': 'mistralai/ministral-8b-2512',

  'llama-4-maverick': 'meta-llama/llama-4-maverick',
  'llama-4-scout': 'meta-llama/llama-4-scout',
  'llama-3-3-70b-instruct': 'meta-llama/llama-3.3-70b-instruct',
  'llama-3-1-405b-instruct': 'nousresearch/hermes-3-llama-3.1-405b',
  'llama-guard-4': 'meta-llama/llama-guard-4-12b',

  'command-a-03-2025': 'cohere/command-a',
  'command-r-plus': 'cohere/command-r-plus-08-2024',
  'command-r': 'cohere/command-r-08-2024',
  'command-r7b': 'cohere/command-r7b-12-2024',

  'deepseek-v3-1': 'deepseek/deepseek-chat-v3.1',
  'deepseek-r1': 'deepseek/deepseek-r1',
  'deepseek-v3': 'deepseek/deepseek-chat',
  'deepseek-chat': 'deepseek/deepseek-chat',

  'kimi-k2-7': 'moonshotai/kimi-k2.7-code',
  'kimi-k2-6': 'moonshotai/kimi-k2.6',
  'kimi-k2': 'moonshotai/kimi-k2',
  'kimi-k2-thinking': 'moonshotai/kimi-k2-thinking',
  'kimi-k1-5-long': 'moonshotai/kimi-latest',

  'glm-5-2': 'z-ai/glm-5.2',
  'glm-5-2-air': 'z-ai/glm-5.2',
  'glm-4-5': 'z-ai/glm-4.5',
  'glm-4-plus': 'z-ai/glm-4.7',
  'glm-4-air': 'z-ai/glm-4.5-air',
  'glm-4-flash': 'z-ai/glm-4.7-flash',

  'mimo-v2-5-pro': 'xiaomi/mimo-v2.5-pro',
  'mimo-vl-7b': 'xiaomi/mimo-v2.5',

  'minimax-m2-7-highspeed': 'minimax/minimax-m2.7',
  'minimax-m2-7': 'minimax/minimax-m2.7',
  'minimax-m1': 'minimax/minimax-m1',
  'minimax-m3': 'minimax/minimax-m3',
  'minimax-text-01': 'minimax/minimax-01',
  'minimax-vl-01': 'minimax/minimax-01',

  // Added by mapping audit
  'gpt-5-5': 'openai/gpt-5.5',
  'gpt-5-5-official': 'openai/gpt-5.5',
  'gpt-5-4-official': 'openai/gpt-5.4',
  'gpt-5-4-mini': 'openai/gpt-5.4-mini',
  'gpt-5-4-nano': 'openai/gpt-5.4-nano',
  'gpt-5-5-pro': 'openai/gpt-5.5-pro',
  'gpt-5-4-pro': 'openai/gpt-5.4-pro',
  'gpt-5': 'openai/gpt-5',
  'gpt-5-mini': 'openai/gpt-5-mini',
  'gpt-5-nano': 'openai/gpt-5-nano',
  'o4-mini': 'openai/o4-mini',
  'o3-mini': 'openai/o3-mini',
  'claude-fable-5': 'anthropic/claude-fable-5',
  'claude-opus-4-8': 'anthropic/claude-opus-4.8',
  'claude-opus-4-7': 'anthropic/claude-opus-4.7',
  'claude-opus-4-6': 'anthropic/claude-opus-4.6',
  'claude-sonnet-4-6': 'anthropic/claude-sonnet-4.6',
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
  'claude-haiku-4-5': 'anthropic/claude-haiku-4.5',
  'claude-haiku-4': 'anthropic/claude-haiku-4.5',
  'gemini-3-5-flash': 'google/gemini-3.5-flash',
  'gemini-3-1-pro': 'google/gemini-3.1-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
  'gemini-3-1-flash': 'google/gemini-3.1-flash-image',
  'gemini-3-1-flash-lite': 'google/gemini-3.1-flash-lite',
  'grok-4-3': 'x-ai/grok-4.3',
  'grok-4': 'x-ai/grok-4.20',
  'qwen-3-6-plus': 'qwen/qwen3.6-plus',
  'qwen-3-6-max': 'qwen/qwen3.6-max-preview',
  'qwen-3-7-max': 'qwen/qwen3.7-max',
  'qwen3-max': 'qwen/qwen3-max',
  'qwen3-coder': 'qwen/qwen3-coder',
  'qwen3-vl': 'qwen/qwen3-vl-235b-a22b-instruct',
  'minimax-m3': 'minimax/minimax-m3',
  'minimax-m2-7': 'minimax/minimax-m2.7',
  'minimax-m2-5': 'minimax/minimax-m2.5',
  'kimi-k2-7': 'moonshotai/kimi-k2.7-code',
  'kimi-k2-6': 'moonshotai/kimi-k2.6',
  'kimi-k2': 'moonshotai/kimi-k2',
  'kimi-k2-thinking': 'moonshotai/kimi-k2-thinking',
  'mimo-v2-5-pro': 'xiaomi/mimo-v2.5-pro',
  'mimo-v2-5': 'xiaomi/mimo-v2.5',
  'mimo-v2': 'xiaomi/mimo-v2.5',
  'glm-5-2': 'z-ai/glm-5.2',
  'glm-5-1': 'z-ai/glm-5.1',
  'glm-5': 'z-ai/glm-5',
  'glm-4-7': 'z-ai/glm-4.7',
  'glm-4-5': 'z-ai/glm-4.5',
  'glm-4-5-air': 'z-ai/glm-4.5-air',
  'deepseek-v3-1': 'deepseek/deepseek-v3.1-terminus',
  'deepseek-r1': 'deepseek/deepseek-r1',
  'deepseek-v3': 'deepseek/deepseek-v3.1-terminus',
  'deepseek-v4-pro': 'deepseek/deepseek-v4-pro',
  'deepseek-v4-flash': 'deepseek/deepseek-v4-flash',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function createOpenRouterIndex(openrouterModels) {
  const byId = new Map();
  const byCanonicalSlug = new Map();

  openrouterModels.forEach(model => {
    byId.set(model.id, model);
    if (model.canonicalSlug) byCanonicalSlug.set(model.canonicalSlug, model);
  });

  return { byId, byCanonicalSlug };
}

function pickOpenRouterModel(openrouterId, index) {
  return index.byId.get(openrouterId) || index.byCanonicalSlug.get(openrouterId) || null;
}

function toPricingPatch(openrouterModel) {
  return {
    inputPrice: openrouterModel.inputPrice,
    cachePrice: openrouterModel.cachePrice,
    outputPrice: openrouterModel.outputPrice,
    source: 'openrouter-api',
    sourceType: 'curated',
    sourceUrl: openrouterModel.sourceUrl,
    updatedAt: openrouterModel.updatedAt,
  };
}

function toModelPatch(internalId, openrouterId, openrouterModel) {
  const patch = {
    openrouterId,
    thirdPartyPricing: {
      openrouter: toPricingPatch(openrouterModel),
    },
    openrouter: {
      id: openrouterModel.id,
      canonicalSlug: openrouterModel.canonicalSlug,
      name: openrouterModel.name,
      sourceUrl: openrouterModel.sourceUrl,
      updatedAt: openrouterModel.updatedAt,
      supportedParameters: openrouterModel.supportedParameters,
      architecture: openrouterModel.architecture,
      topProvider: openrouterModel.topProvider,
    },
    confidence: 'high',
  };

  if (openrouterModel.contextWindow) patch.contextWindow = openrouterModel.contextWindow;
  if (openrouterModel.topProvider && openrouterModel.topProvider.max_completion_tokens) {
    patch.maxOutput = openrouterModel.topProvider.max_completion_tokens;
  }

  return [internalId, patch];
}

function generateBrowserPatch(patches, report) {
  return `// =============================================================================\n` +
    `// Generated by scripts/merge-openrouter-pricing.js\n` +
    `// Source: ${report.source}\n` +
    `// Fetched: ${report.fetchedAt}\n` +
    `// Matched: ${report.matchedCount}, Missing: ${report.missingCount}\n` +
    `// =============================================================================\n\n` +
    `(function () {\n` +
    `  'use strict';\n\n` +
    `  const OPENROUTER_MODEL_PATCHES = ${JSON.stringify(patches, null, 2)};\n\n` +
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
    `  function applyOpenRouterPatches() {\n` +
    `    if (!window.MODELS || !Array.isArray(window.MODELS)) return;\n` +
    `    const byId = new Map(window.MODELS.map(model => [model.id, model]));\n` +
    `    OPENROUTER_MODEL_PATCHES.forEach(([internalId, patch]) => {\n` +
    `      const model = byId.get(internalId);\n` +
    `      if (!model) return;\n` +
    `      mergeDeep(model, patch);\n` +
    `    });\n` +
    `  }\n\n` +
    `  window.OPENROUTER_MODEL_PATCHES = OPENROUTER_MODEL_PATCHES;\n` +
    `  window.OPENROUTER_MERGE_REPORT = ${JSON.stringify(report, null, 2)};\n` +
    `  applyOpenRouterPatches();\n` +
    `})();\n`;
}

function main() {
  const openrouterData = readJson(OPENROUTER_JSON_PATH);
  const index = createOpenRouterIndex(openrouterData.models || []);
  const patches = [];
  const matched = [];
  const missing = [];

  Object.entries(OPENROUTER_MODEL_MAP).forEach(([internalId, openrouterId]) => {
    const openrouterModel = pickOpenRouterModel(openrouterId, index);
    if (!openrouterModel) {
      missing.push({ internalId, openrouterId });
      return;
    }

    patches.push(toModelPatch(internalId, openrouterId, openrouterModel));
    matched.push({
      internalId,
      openrouterId,
      inputPrice: openrouterModel.inputPrice,
      cachePrice: openrouterModel.cachePrice,
      outputPrice: openrouterModel.outputPrice,
      contextWindow: openrouterModel.contextWindow,
    });
  });

  const report = {
    source: openrouterData.source,
    fetchedAt: openrouterData.fetchedAt,
    generatedAt: new Date().toISOString(),
    mappedCount: Object.keys(OPENROUTER_MODEL_MAP).length,
    matchedCount: matched.length,
    missingCount: missing.length,
    matched,
    missing,
  };

  fs.writeFileSync(OUTPUT_JS_PATH, generateBrowserPatch(patches, report), 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`Generated ${patches.length} OpenRouter patches at ${OUTPUT_JS_PATH}`);
  console.log(`Generated merge report at ${REPORT_PATH}`);
  if (missing.length > 0) {
    console.log(`Missing mappings: ${missing.length}`);
  }
}

main();
