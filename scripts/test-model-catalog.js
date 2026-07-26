const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.join(__dirname, '..');
const files = [
  'js/data.js',
  'js/opencode-models.generated.js',
];
const context = {
  window: {},
  console: { log() {}, warn() {}, error() {} },
};
context.globalThis = context;
vm.createContext(context);

files.forEach(relativePath => {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const models = context.window.MODELS;
const freeModels = context.window.FREE_API_MODELS;
const report = context.window.OPENCODE_MODELS_REPORT;

assert(Array.isArray(models), 'MODELS was not initialized');
assert(Array.isArray(freeModels), 'FREE_API_MODELS was not initialized');
assert(report && report.activePaidCount > 0, 'OpenCode report has no paid models');
assert(report.freeCount > 0, 'OpenCode report has no free models');
assert(models.some(model => model.opencodeId === 'claude-opus-5'), 'Claude Opus 5 is missing');
assert(freeModels.some(model => model.modelId === 'opencode/ling-3.0-flash-free'), 'Ling 3.0 Flash Free is missing');
assert(context.window.OPENCODE_FREE_MODELS.filter(model => model.benchmarks.length > 0).length >= 4, 'Expected benchmark data for at least four OpenCode free models');
assert(context.window.OPENCODE_FREE_MODELS.some(model => model.modelId === 'opencode/north-mini-code-free' && model.benchmarks.some(benchmark => benchmark.metric === 'SWE-bench Verified')), 'North Mini Code benchmark is missing');
assert(!context.window.OPENCODE_MODELS.some(model => model.status === 'deprecated'), 'Deprecated OpenCode models were exposed');

const duplicateFreeIds = freeModels
  .map(model => model.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
assert(duplicateFreeIds.length === 0, `Duplicate free model IDs: ${duplicateFreeIds.join(', ')}`);

console.log(`Model catalog OK: ${report.activePaidCount} OpenCode paid models, ${report.freeCount} free models`);
