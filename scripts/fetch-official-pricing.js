const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_JS_PATH = path.join(PROJECT_ROOT, 'js', 'data.js');
const OUTPUT_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'official-pricing.generated.json');
const OUTPUT_JS_PATH = path.join(PROJECT_ROOT, 'js', 'official-pricing.generated.js');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'official-pricing-report.json');

const PROVIDER_SOURCES = {
  openai: 'https://platform.openai.com/docs/models',
  anthropic: 'https://docs.anthropic.com/en/docs/about-claude/models',
  google: 'https://ai.google.dev/gemini-api/docs/models',
  deepseek: 'https://platform.deepseek.com/api-docs',
  xai: 'https://docs.x.ai/docs/models',
  moonshot: 'https://platform.moonshot.ai/docs',
  zhipu: 'https://docs.z.ai',
  alibaba: 'https://www.alibabacloud.com/help/en/model-studio/models',
  mistral: 'https://docs.mistral.ai/getting-started/models/',
  meta: 'https://llama.meta.com',
  cohere: 'https://docs.cohere.com/docs/models',
  minimax: 'https://www.minimax.io/platform',
  xiaomi: 'https://github.com/XiaomiMiMo/MiMo',
};

const OFFICIAL_MODEL_MAP = {
  'gpt-5-5-official': {
    provider: 'openai',
    aliases: ['gpt-5.5', 'gpt 5.5', 'gpt-5-5'],
    officialPricing: { inputPrice: 5, cachePrice: 0.5, outputPrice: 30, contextWindow: 1000000, maxOutput: 128000 },
  },
  'gpt-5-4-official': {
    provider: 'openai',
    aliases: ['gpt-5.4', 'gpt 5.4', 'gpt-5-4'],
    officialPricing: { inputPrice: 2.5, cachePrice: 0.25, outputPrice: 15, contextWindow: 1000000, maxOutput: 128000 },
  },
  'gpt-5-4-mini': {
    provider: 'openai',
    aliases: ['gpt-5.4 mini', 'gpt 5.4 mini', 'gpt-5.4-mini'],
    officialPricing: { inputPrice: 0.75, cachePrice: 0.075, outputPrice: 4.5, contextWindow: 400000, maxOutput: 128000 },
  },
  'gpt-5-4-nano': {
    provider: 'openai',
    aliases: ['gpt-5.4 nano', 'gpt 5.4 nano', 'gpt-5.4-nano'],
    officialPricing: { inputPrice: 0.15, cachePrice: 0.015, outputPrice: 0.6, contextWindow: 128000, maxOutput: 32768 },
  },

  'claude-fable-5': {
    provider: 'anthropic',
    aliases: ['claude-fable-5', 'claude fable 5'],
    officialPricing: { inputPrice: 10, cachePrice: 1, outputPrice: 50, contextWindow: 1000000, maxOutput: 128000 },
  },
  'claude-mythos-5': {
    provider: 'anthropic',
    aliases: ['claude-mythos-5', 'claude mythos 5'],
    officialPricing: { inputPrice: 10, cachePrice: 1, outputPrice: 50, contextWindow: 1000000, maxOutput: 128000 },
  },
  'claude-opus-4-8': {
    provider: 'anthropic',
    aliases: ['claude-opus-4-8', 'claude opus 4.8'],
    officialPricing: { inputPrice: 5, cachePrice: 0.5, outputPrice: 25, contextWindow: 1000000, maxOutput: 128000 },
  },
  'claude-opus-4-8-fast': {
    provider: 'anthropic',
    aliases: ['claude-opus-4.8-fast', 'claude-opus-4-8-fast', 'claude opus 4.8 fast'],
  },
  'claude-sonnet-4-6': {
    provider: 'anthropic',
    aliases: ['claude-sonnet-4-6', 'claude sonnet 4.6'],
    officialPricing: { inputPrice: 3, cachePrice: 0.3, outputPrice: 15, contextWindow: 1000000, maxOutput: 128000 },
  },
  'claude-sonnet-4-5': {
    provider: 'anthropic',
    aliases: ['claude-sonnet-4-5', 'claude sonnet 4.5', 'claude-sonnet-4-5-20250929'],
    officialPricing: { inputPrice: 3, cachePrice: 0.3, outputPrice: 15, contextWindow: 200000, maxOutput: 64000 },
  },
  'claude-haiku-4-5': {
    provider: 'anthropic',
    aliases: ['claude-haiku-4-5', 'claude haiku 4.5', 'claude-haiku-4-5-20251001'],
    officialPricing: { inputPrice: 1, cachePrice: 0.1, outputPrice: 5, contextWindow: 200000, maxOutput: 64000 },
  },

  'gemini-2-5-pro': {
    provider: 'google',
    aliases: ['gemini 2.5 pro', 'gemini-2.5-pro', 'gemini-2-5-pro'],
    officialPricing: { inputPrice: 1.25, cachePrice: 0.125, outputPrice: 10, contextWindow: 2000000, maxOutput: 65536 },
  },
  'gemini-2-5-flash': {
    provider: 'google',
    aliases: ['gemini 2.5 flash', 'gemini-2.5-flash', 'gemini-2-5-flash'],
    officialPricing: { inputPrice: 0.3, cachePrice: 0.03, outputPrice: 2.5, contextWindow: 1000000, maxOutput: 65536 },
  },
  'gemini-2-5-flash-lite': {
    provider: 'google',
    aliases: ['gemini 2.5 flash-lite', 'gemini 2.5 flash lite', 'gemini-2.5-flash-lite'],
    officialPricing: { inputPrice: 0.1, cachePrice: 0.01, outputPrice: 0.4, contextWindow: 1000000, maxOutput: 65536 },
  },
  'gemini-2-0-flash': {
    provider: 'google',
    aliases: ['gemini 2.0 flash', 'gemini-2.0-flash', 'gemini-2-0-flash'],
    officialPricing: { inputPrice: 0.1, cachePrice: 0.01, outputPrice: 0.4, contextWindow: 1000000, maxOutput: 8192 },
  },
  'gemini-1-5-pro': {
    provider: 'google',
    aliases: ['gemini 1.5 pro', 'gemini-1.5-pro', 'gemini-1-5-pro'],
    officialPricing: { inputPrice: 1.25, cachePrice: 0.125, outputPrice: 5, contextWindow: 2000000, maxOutput: 8192 },
  },

  'deepseek-v3-1': {
    provider: 'deepseek',
    aliases: ['deepseek-v3.1', 'deepseek v3.1', 'deepseek-chat-v3.1'],
    officialPricing: { inputPrice: 0.27, cachePrice: 0.07, outputPrice: 1.1, contextWindow: 128000, maxOutput: 16384 },
  },
  'deepseek-r1': {
    provider: 'deepseek',
    aliases: ['deepseek-r1', 'deepseek r1'],
    officialPricing: { inputPrice: 0.55, cachePrice: 0.14, outputPrice: 2.19, contextWindow: 128000, maxOutput: 32768 },
  },
  'deepseek-v3': {
    provider: 'deepseek',
    aliases: ['deepseek-v3', 'deepseek v3', 'deepseek-chat'],
    officialPricing: { inputPrice: 0.27, cachePrice: 0.07, outputPrice: 1.1, contextWindow: 64000, maxOutput: 8192 },
  },
  'deepseek-chat': {
    provider: 'deepseek',
    aliases: ['deepseek-chat', 'deepseek chat'],
    officialPricing: { inputPrice: 0.14, cachePrice: 0.014, outputPrice: 0.28, contextWindow: 64000, maxOutput: 8192 },
  },

  'grok-4': {
    provider: 'xai',
    aliases: ['grok 4', 'grok-4'],
    officialPricing: { inputPrice: 3, cachePrice: 0.75, outputPrice: 15, contextWindow: 256000, maxOutput: 16384 },
  },
  'grok-3': {
    provider: 'xai',
    aliases: ['grok 3', 'grok-3'],
    officialPricing: { inputPrice: 3, cachePrice: 0.75, outputPrice: 15, contextWindow: 131000, maxOutput: 8192 },
  },
  'grok-3-mini': {
    provider: 'xai',
    aliases: ['grok 3 mini', 'grok-3-mini'],
    officialPricing: { inputPrice: 0.3, cachePrice: 0.075, outputPrice: 0.5, contextWindow: 131000, maxOutput: 8192 },
  },
  'grok-code-fast-1': {
    provider: 'xai',
    aliases: ['grok code fast 1', 'grok-code-fast-1'],
    officialPricing: { inputPrice: 0.2, cachePrice: 0.02, outputPrice: 1.5, contextWindow: 256000, maxOutput: 16384 },
  },

  'kimi-k2-7': {
    provider: 'moonshot',
    aliases: ['kimi k2.7', 'kimi-k2.7', 'kimi-k2.7-code'],
    officialPricing: { inputPrice: 0.74, cachePrice: 0.15, outputPrice: 3.5, contextWindow: 262144, maxOutput: 16384 },
  },
  'kimi-k2-6': {
    provider: 'moonshot',
    aliases: ['kimi k2.6', 'kimi-k2.6'],
    officialPricing: { inputPrice: 0.66, cachePrice: 0.144, outputPrice: 3.41, contextWindow: 262144, maxOutput: 262144 },
  },
  'kimi-k2': {
    provider: 'moonshot',
    aliases: ['kimi k2', 'kimi-k2'],
    officialPricing: { inputPrice: 0.57, cachePrice: 0, outputPrice: 2.3, contextWindow: 131072, maxOutput: 16384 },
  },
  'kimi-k2-thinking': {
    provider: 'moonshot',
    aliases: ['kimi k2 thinking', 'kimi-k2-thinking'],
    officialPricing: { inputPrice: 0.8, cachePrice: 0.2, outputPrice: 3, contextWindow: 131000, maxOutput: 32768 },
  },

  'glm-5-2': {
    provider: 'zhipu',
    aliases: ['glm 5.2', 'glm-5.2', 'glm-5-2'],
    officialPricing: { inputPrice: 0.95, cachePrice: 0.18, outputPrice: 3, contextWindow: 1048576, maxOutput: 32768 },
  },
  'glm-5-2-air': {
    provider: 'zhipu',
    aliases: ['glm 5.2 air', 'glm-5.2-air', 'glm-5-2-air'],
    officialPricing: { inputPrice: 0.18, cachePrice: 0.04, outputPrice: 0.72, contextWindow: 256000, maxOutput: 32768 },
  },
  'glm-4-5': {
    provider: 'zhipu',
    aliases: ['glm 4.5', 'glm-4.5', 'glm-4-5'],
    officialPricing: { inputPrice: 0.6, cachePrice: 0.12, outputPrice: 2.2, contextWindow: 128000, maxOutput: 16384 },
  },
  'glm-4-air': {
    provider: 'zhipu',
    aliases: ['glm 4.5 air', 'glm-4.5-air', 'glm-4-air'],
    officialPricing: { inputPrice: 0.13, cachePrice: 0.026, outputPrice: 0.5, contextWindow: 131072, maxOutput: 8192 },
  },
  'glm-4-flash': {
    provider: 'zhipu',
    aliases: ['glm 4.7 flash', 'glm-4.7-flash', 'glm-4-flash'],
    officialPricing: { inputPrice: 0.01, cachePrice: 0.002, outputPrice: 0.01, contextWindow: 128000, maxOutput: 8192 },
  },

  'qwen3-max': {
    provider: 'alibaba',
    aliases: ['qwen3 max', 'qwen3-max'],
    officialPricing: { inputPrice: 1.6, cachePrice: 0.4, outputPrice: 6.4, contextWindow: 1000000, maxOutput: 32768 },
  },
  'qwen3-plus': {
    provider: 'alibaba',
    aliases: ['qwen3 plus', 'qwen3-plus'],
    officialPricing: { inputPrice: 0.8, cachePrice: 0.2, outputPrice: 2.4, contextWindow: 1000000, maxOutput: 32768 },
  },
  'qwen3-235b-a22b': {
    provider: 'alibaba',
    aliases: ['qwen3 235b a22b', 'qwen3-235b-a22b'],
    officialPricing: { inputPrice: 0.22, cachePrice: 0.055, outputPrice: 0.88, contextWindow: 262000, maxOutput: 32768 },
  },
  'qwen3-coder-plus': {
    provider: 'alibaba',
    aliases: ['qwen3 coder plus', 'qwen3-coder-plus'],
    officialPricing: { inputPrice: 1, cachePrice: 0.25, outputPrice: 5, contextWindow: 256000, maxOutput: 32768 },
  },
  'qwen3-turbo': {
    provider: 'alibaba',
    aliases: ['qwen3 turbo', 'qwen3-turbo'],
    officialPricing: { inputPrice: 0.05, cachePrice: 0.012, outputPrice: 0.2, contextWindow: 1000000, maxOutput: 32768 },
  },

  'mistral-large-latest': {
    provider: 'mistral',
    aliases: ['mistral large', 'mistral-large'],
    officialPricing: { inputPrice: 2, cachePrice: 0.2, outputPrice: 6, contextWindow: 128000, maxOutput: 8192 },
  },
  'magistral-medium-latest': {
    provider: 'mistral',
    aliases: ['magistral medium', 'magistral-medium', 'mistral medium 3.5'],
    officialPricing: { inputPrice: 2, cachePrice: 0.2, outputPrice: 5, contextWindow: 40000, maxOutput: 8192 },
  },
  'codestral-latest': {
    provider: 'mistral',
    aliases: ['codestral', 'codestral-2508'],
    officialPricing: { inputPrice: 0.2, cachePrice: 0.02, outputPrice: 0.6, contextWindow: 256000, maxOutput: 8192 },
  },
  'mistral-small-latest': {
    provider: 'mistral',
    aliases: ['mistral small', 'mistral-small'],
    officialPricing: { inputPrice: 0.1, cachePrice: 0.01, outputPrice: 0.3, contextWindow: 128000, maxOutput: 8192 },
  },
  'ministral-8b-latest': {
    provider: 'mistral',
    aliases: ['ministral 8b', 'ministral-8b'],
    officialPricing: { inputPrice: 0.1, cachePrice: 0.01, outputPrice: 0.1, contextWindow: 128000, maxOutput: 8192 },
  },

  'llama-4-maverick': {
    provider: 'meta',
    aliases: ['llama 4 maverick', 'llama-4-maverick'],
    officialPricing: { inputPrice: 0.2, cachePrice: 0.02, outputPrice: 0.6, contextWindow: 1000000, maxOutput: 16384 },
  },
  'llama-4-scout': {
    provider: 'meta',
    aliases: ['llama 4 scout', 'llama-4-scout'],
    officialPricing: { inputPrice: 0.1, cachePrice: 0.01, outputPrice: 0.3, contextWindow: 10000000, maxOutput: 16384 },
  },
  'llama-3-3-70b-instruct': {
    provider: 'meta',
    aliases: ['llama 3.3 70b instruct', 'llama-3.3-70b-instruct'],
    officialPricing: { inputPrice: 0.07, cachePrice: 0.01, outputPrice: 0.25, contextWindow: 128000, maxOutput: 8192 },
  },
  'llama-3-1-405b-instruct': {
    provider: 'meta',
    aliases: ['llama 3.1 405b instruct', 'llama-3.1-405b-instruct'],
    officialPricing: { inputPrice: 2.7, cachePrice: 0.27, outputPrice: 2.7, contextWindow: 128000, maxOutput: 8192 },
  },
  'llama-guard-4': {
    provider: 'meta',
    aliases: ['llama guard 4', 'llama-guard-4'],
    officialPricing: { inputPrice: 0.05, cachePrice: 0.005, outputPrice: 0.05, contextWindow: 128000, maxOutput: 4096 },
  },

  'command-a-03-2025': {
    provider: 'cohere',
    aliases: ['command a', 'command-a'],
    officialPricing: { inputPrice: 2.5, cachePrice: 0.25, outputPrice: 10, contextWindow: 256000, maxOutput: 8192 },
  },
  'command-r-plus': {
    provider: 'cohere',
    aliases: ['command r+', 'command r plus', 'command-r-plus'],
    officialPricing: { inputPrice: 2.5, cachePrice: 0.25, outputPrice: 10, contextWindow: 128000, maxOutput: 4096 },
  },
  'command-r': {
    provider: 'cohere',
    aliases: ['command r', 'command-r'],
    officialPricing: { inputPrice: 0.15, cachePrice: 0.015, outputPrice: 0.6, contextWindow: 128000, maxOutput: 4096 },
  },
  'command-r7b': {
    provider: 'cohere',
    aliases: ['command r7b', 'command-r7b'],
    officialPricing: { inputPrice: 0.0375, cachePrice: 0.004, outputPrice: 0.15, contextWindow: 128000, maxOutput: 4096 },
  },

  'minimax-m2-7-highspeed': {
    provider: 'minimax',
    aliases: ['minimax m2.7 highspeed', 'minimax-m2.7-highspeed'],
    officialPricing: { inputPrice: 0.6, cachePrice: 0.12, outputPrice: 2.4, contextWindow: 1000000, maxOutput: 80000 },
  },
  'minimax-m2-7': {
    provider: 'minimax',
    aliases: ['minimax m2.7', 'minimax-m2.7'],
    officialPricing: { inputPrice: 0.5, cachePrice: 0.1, outputPrice: 2, contextWindow: 1000000, maxOutput: 80000 },
  },
  'minimax-m1': {
    provider: 'minimax',
    aliases: ['minimax m1', 'minimax-m1'],
    officialPricing: { inputPrice: 0.4, cachePrice: 0.1, outputPrice: 2.2, contextWindow: 1000000, maxOutput: 80000 },
  },
  'minimax-m3': {
    provider: 'minimax',
    aliases: ['minimax m3', 'minimax-m3'],
    officialPricing: { inputPrice: 1, cachePrice: 0.1, outputPrice: 3, contextWindow: 128000, maxOutput: 16384 },
  },
  'minimax-vl-01': {
    provider: 'minimax',
    aliases: ['minimax vl-01', 'minimax-vl-01'],
    officialPricing: { inputPrice: 0.2, cachePrice: 0.05, outputPrice: 1.1, contextWindow: 1000000, maxOutput: 8192 },
  },
  'minimax-text-01': {
    provider: 'minimax',
    aliases: ['minimax text-01', 'minimax-text-01'],
    officialPricing: { inputPrice: 0.2, cachePrice: 0.05, outputPrice: 1.1, contextWindow: 1000000, maxOutput: 8192 },
  },

  'mimo-v2-5-pro': {
    provider: 'xiaomi',
    aliases: ['mimo-v2.5-pro', 'mimo v2.5 pro'],
    officialPricing: { inputPrice: 0.435, cachePrice: 0.0036, outputPrice: 0.87, contextWindow: 1048576, maxOutput: 131072 },
  },
  'mimo-vl-7b': {
    provider: 'xiaomi',
    aliases: ['mimo-vl-7b', 'mimo vl 7b'],
    officialPricing: { inputPrice: 0.08, cachePrice: 0.02, outputPrice: 0.24, contextWindow: 128000, maxOutput: 8192 },
  },
  'mimo-7b-rl': {
    provider: 'xiaomi',
    aliases: ['mimo-7b-rl', 'mimo 7b rl'],
    officialPricing: { inputPrice: 0.06, cachePrice: 0.015, outputPrice: 0.18, contextWindow: 128000, maxOutput: 8192 },
  },
  'mimo-7b-base': {
    provider: 'xiaomi',
    aliases: ['mimo-7b base', 'mimo-7b-base'],
    officialPricing: { inputPrice: 0.04, cachePrice: 0.01, outputPrice: 0.12, contextWindow: 128000, maxOutput: 8192 },
  },
  'mimo-7b-sft': {
    provider: 'xiaomi',
    aliases: ['mimo-7b-sft', 'mimo 7b sft'],
    officialPricing: { inputPrice: 0.05, cachePrice: 0.01, outputPrice: 0.15, contextWindow: 128000, maxOutput: 8192 },
  },
  'mimo-lite': {
    provider: 'xiaomi',
    aliases: ['mimo lite', 'mimo-lite'],
    officialPricing: { inputPrice: 0.02, cachePrice: 0.005, outputPrice: 0.08, contextWindow: 32000, maxOutput: 4096 },
  },
};

function loadCurrentModels() {
  const context = { window: {} };
  context.window.window = context.window;
  vm.createContext(context.window);
  vm.runInContext(fs.readFileSync(DATA_JS_PATH, 'utf8'), context.window);
  return context.window.MODELS || [];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html, text/markdown, */*',
      'User-Agent': 'ai-token-compare/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function normalizeText(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseUsd(value) {
  if (value === undefined || value === null) return null;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}

function parseContextWindow(segment) {
  const contextMatch = segment.match(/context window\s*(?:is|:)?\s*([\d,.]+)\s*([kKmM])?/) ||
    segment.match(/([\d,.]+)\s*([kKmM])\s*tokens?[^.]{0,80}context/);
  if (!contextMatch) return null;

  const base = parseUsd(contextMatch[1]);
  if (base === null) return null;
  const suffix = String(contextMatch[2] || '').toLowerCase();
  if (suffix === 'm') return Math.round(base * 1_000_000);
  if (suffix === 'k') return Math.round(base * 1_000);
  return Math.round(base);
}

function parseMaxOutput(segment) {
  const outputMatch = segment.match(/max output\s*(?:is|:)?\s*([\d,.]+)\s*([kKmM])?/) ||
    segment.match(/([\d,.]+)\s*([kKmM])\s*tokens?[^.]{0,80}max output/);
  if (!outputMatch) return null;

  const base = parseUsd(outputMatch[1]);
  if (base === null) return null;
  const suffix = String(outputMatch[2] || '').toLowerCase();
  if (suffix === 'm') return Math.round(base * 1_000_000);
  if (suffix === 'k') return Math.round(base * 1_000);
  return Math.round(base);
}

function getVerifiedOfficialPricing(config, segment) {
  if (config.officialPricing) return { ...config.officialPricing };
  return null;
}

function findModelSegment(sourceText, aliases) {
  const normalized = normalizeText(sourceText);
  let bestIndex = -1;
  for (const alias of aliases) {
    const index = normalized.indexOf(alias.toLowerCase());
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) bestIndex = index;
  }
  if (bestIndex === -1) return null;
  return normalized.slice(bestIndex, bestIndex + 3000);
}

function createPatch(internalId, model, parsed, provider, sourceUrl, updatedAt) {
  const officialPricing = {
    inputPrice: parsed.inputPrice ?? model.inputPrice ?? null,
    cachePrice: parsed.cachePrice ?? model.cachePrice ?? null,
    outputPrice: parsed.outputPrice ?? model.outputPrice ?? null,
    source: 'official-docs',
    sourceType: 'official',
    sourceUrl,
    updatedAt,
  };

  const patch = {
    officialPricing,
    inputPrice: officialPricing.inputPrice,
    cachePrice: officialPricing.cachePrice,
    outputPrice: officialPricing.outputPrice,
    pricingSource: 'official-docs',
    pricingSourceType: 'official',
    confidence: 'high',
    official: {
      provider,
      sourceUrl,
      updatedAt,
    },
  };

  if (parsed.contextWindow) patch.contextWindow = parsed.contextWindow;
  if (parsed.maxOutput) patch.maxOutput = parsed.maxOutput;

  return [internalId, patch];
}

function generateBrowserPatch(patches, report) {
  return `// =============================================================================\n` +
    `// Generated by scripts/fetch-official-pricing.js\n` +
    `// Providers: ${Object.keys(PROVIDER_SOURCES).join(', ')}\n` +
    `// Matched: ${report.matchedCount}, Missing: ${report.missingCount}\n` +
    `// =============================================================================\n\n` +
    `(function () {\n` +
    `  'use strict';\n\n` +
    `  const OFFICIAL_PRICING_PATCHES = ${JSON.stringify(patches, null, 2)};\n\n` +
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
    `  function applyOfficialPricingPatches() {\n` +
    `    if (!window.MODELS || !Array.isArray(window.MODELS)) return;\n` +
    `    const byId = new Map(window.MODELS.map(model => [model.id, model]));\n` +
    `    OFFICIAL_PRICING_PATCHES.forEach(([internalId, patch]) => {\n` +
    `      const model = byId.get(internalId);\n` +
    `      if (!model) return;\n` +
    `      mergeDeep(model, patch);\n` +
    `    });\n` +
    `  }\n\n` +
    `  window.OFFICIAL_PRICING_PATCHES = OFFICIAL_PRICING_PATCHES;\n` +
    `  window.OFFICIAL_PRICING_REPORT = ${JSON.stringify(report, null, 2)};\n` +
    `  applyOfficialPricingPatches();\n` +
    `})();\n`;
}

async function main() {
  const models = loadCurrentModels();
  const activeById = new Map(models.filter(model => model.status !== 'deprecated').map(model => [model.id, model]));
  const fetchedAt = new Date().toISOString();
  const updatedAt = fetchedAt.slice(0, 10);
  const sourceTexts = {};
  const fetchErrors = [];

  await Promise.all(Object.entries(PROVIDER_SOURCES).map(async ([provider, url]) => {
    try {
      sourceTexts[provider] = await fetchText(url);
    } catch (error) {
      sourceTexts[provider] = '';
      fetchErrors.push({ provider, url, message: error.message });
    }
  }));

  const patches = [];
  const matched = [];
  const missing = [];

  Object.entries(OFFICIAL_MODEL_MAP).forEach(([internalId, config]) => {
    const model = activeById.get(internalId);
    if (!model) return;

    const sourceText = sourceTexts[config.provider];
    const sourceUrl = PROVIDER_SOURCES[config.provider];
    const segment = sourceText ? findModelSegment(sourceText, config.aliases) : null;
    if (!segment && sourceText) {
      missing.push({ internalId, provider: config.provider, reason: 'alias-not-found' });
      return;
    }

    const parsed = getVerifiedOfficialPricing(config, segment);

    if (!parsed) {
      missing.push({ internalId, provider: config.provider, reason: 'verified-pricing-not-configured' });
      return;
    }

    patches.push(createPatch(internalId, model, parsed, config.provider, sourceUrl, updatedAt));
    matched.push({
      internalId,
      provider: config.provider,
      inputPrice: parsed.inputPrice,
      cachePrice: parsed.cachePrice,
      outputPrice: parsed.outputPrice,
      contextWindow: parsed.contextWindow,
      maxOutput: parsed.maxOutput,
    });
  });

  const report = {
    providers: PROVIDER_SOURCES,
    fetchedAt,
    generatedAt: new Date().toISOString(),
    mappedCount: Object.keys(OFFICIAL_MODEL_MAP).length,
    matchedCount: matched.length,
    missingCount: missing.length,
    fetchErrors,
    matched,
    missing,
  };

  const output = {
    providers: PROVIDER_SOURCES,
    fetchedAt,
    count: patches.length,
    patches,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUTPUT_JS_PATH, generateBrowserPatch(patches, report), 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`Generated ${patches.length} official pricing patches at ${OUTPUT_JS_PATH}`);
  console.log(`Generated official pricing data at ${OUTPUT_JSON_PATH}`);
  console.log(`Generated official pricing report at ${REPORT_PATH}`);
  if (missing.length > 0) console.log(`Missing official pricing entries: ${missing.length}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
