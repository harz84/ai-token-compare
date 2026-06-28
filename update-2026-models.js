const fs = require('fs');

const dataFile = 'js/data.js';
let content = fs.readFileSync(dataFile, 'utf8');

// 1. Add new providers if missing (xai, minimax)
if (!content.includes("id: 'xai'")) {
  content = content.replace(/};\s*const MODELS/, `  xai: {
    id: 'xai',
    name: 'xAI',
    region: 'usa',
    type: 'official',
    website: 'https://x.ai',
    color: '#000000',
    description_en: 'Creators of Grok models',
    description_id: 'Pembuat model Grok',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    region: 'china',
    type: 'official',
    website: 'https://minimaxi.com',
    color: '#10b981',
    description_en: 'Leading Chinese AI lab',
    description_id: 'Laboratorium AI terkemuka Tiongkok',
  },
};

const MODELS`);
}

// 2. Replace the MODELS array completely
const newModels = [
  // OPENAI
  { id: 'gpt-5-5-xhigh', name: 'GPT 5.5 (xHigh)', provider: 'openai', arenaRank: 1, inputPrice: 15.00, outputPrice: 60.00, cachePrice: 1.50, contextWindow: 200000, category: 'flagship' },
  { id: 'gpt-5-5-high', name: 'GPT 5.5 (High)', provider: 'openai', arenaRank: 2, inputPrice: 10.00, outputPrice: 30.00, cachePrice: 1.00, contextWindow: 200000, category: 'flagship' },
  { id: 'gpt-5-5', name: 'GPT 5.5', provider: 'openai', arenaRank: 3, inputPrice: 5.00, outputPrice: 15.00, cachePrice: 0.50, contextWindow: 200000, category: 'flagship' },
  { id: 'gpt-5-4-high', name: 'GPT 5.4 (High)', provider: 'openai', arenaRank: 4, inputPrice: 2.50, outputPrice: 10.00, cachePrice: 0.25, contextWindow: 128000, category: 'mid' },
  // ANTHROPIC
  { id: 'claude-fable-5', name: 'Claude Fable 5', provider: 'anthropic', arenaRank: 1, inputPrice: 12.00, outputPrice: 48.00, cachePrice: 1.20, contextWindow: 200000, category: 'flagship' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8 (Thinking)', provider: 'anthropic', arenaRank: 2, inputPrice: 15.00, outputPrice: 75.00, cachePrice: 1.50, contextWindow: 200000, category: 'reasoning' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', provider: 'anthropic', arenaRank: 3, inputPrice: 8.00, outputPrice: 24.00, cachePrice: 0.80, contextWindow: 200000, category: 'flagship' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic', arenaRank: 4, inputPrice: 4.00, outputPrice: 12.00, cachePrice: 0.40, contextWindow: 200000, category: 'mid' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', arenaRank: 5, inputPrice: 1.50, outputPrice: 4.50, cachePrice: 0.15, contextWindow: 200000, category: 'budget' },
  // GOOGLE
  { id: 'gemini-3-5-flash', name: 'Gemini 3.5 Flash', provider: 'google', arenaRank: 1, inputPrice: 0.10, outputPrice: 0.40, cachePrice: 0.01, contextWindow: 2000000, category: 'budget' },
  { id: 'gemini-3-1-pro', name: 'Gemini 3.1 Pro Preview', provider: 'google', arenaRank: 2, inputPrice: 1.25, outputPrice: 5.00, cachePrice: 0.12, contextWindow: 2000000, category: 'mid' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'google', arenaRank: 3, inputPrice: 0.05, outputPrice: 0.20, cachePrice: 0.005, contextWindow: 2000000, category: 'budget' },
  // xAI
  { id: 'grok-4-3-high', name: 'Grok 4.3 (High)', provider: 'xai', arenaRank: 1, inputPrice: 4.00, outputPrice: 12.00, cachePrice: 0.40, contextWindow: 128000, category: 'flagship' },
  { id: 'grok-4-3', name: 'Grok 4.3', provider: 'xai', arenaRank: 2, inputPrice: 2.00, outputPrice: 6.00, cachePrice: 0.20, contextWindow: 128000, category: 'mid' },
  { id: 'grok-build-0-1', name: 'Grok Build 0.1', provider: 'xai', arenaRank: 3, inputPrice: 1.00, outputPrice: 3.00, cachePrice: 0.10, contextWindow: 128000, category: 'budget' },
  // ALIBABA / OTHERS
  { id: 'qwen-3-6-plus', name: 'Qwen 3.6 Plus', provider: 'alibaba', arenaRank: 1, inputPrice: 1.00, outputPrice: 3.00, cachePrice: 0.10, contextWindow: 128000, category: 'mid' },
  { id: 'minimax-m3', name: 'Minimax M3', provider: 'minimax', arenaRank: 1, inputPrice: 1.00, outputPrice: 3.00, cachePrice: 0.10, contextWindow: 128000, category: 'mid' }
];

let modelsString = 'const MODELS = [\n';
for (const m of newModels) {
  modelsString += `  {
    id: '${m.id}',
    name: '${m.name}',
    provider: '${m.provider}',
    arenaRank: ${m.arenaRank},
    inputPrice: ${m.inputPrice},
    outputPrice: ${m.outputPrice},
    cachePrice: ${m.cachePrice},
    contextWindow: ${m.contextWindow},
    maxOutput: 16384,
    capabilities: ['vision', 'function-calling', 'json-mode'],
    category: '${m.category}',
    releaseDate: '2026',
    thirdPartyPricing: {
      openrouter: { input: ${m.inputPrice}, cachePrice: ${m.cachePrice}, output: ${m.outputPrice} },
      sumopod: { input: ${m.inputPrice}, cachePrice: ${m.cachePrice}, output: ${m.outputPrice} },
      deepinfra: { input: ${m.inputPrice}, cachePrice: ${m.cachePrice}, output: ${m.outputPrice} }
    },
  },\n`;
}
modelsString += '];';

const modelsStart = content.indexOf('const MODELS = [');
const modelsEnd = content.indexOf('];\n\nconst PROMOS') + 2;

content = content.substring(0, modelsStart) + modelsString + content.substring(modelsEnd);

fs.writeFileSync(dataFile, content, 'utf8');
console.log('Replaced all models in data.js');
