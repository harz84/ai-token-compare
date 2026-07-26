const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'pricing-update-report.json');
const DATA_JS_PATH = path.join(PROJECT_ROOT, 'js', 'data.js');
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const OPENROUTER_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'openrouter-merge.generated.js');
const OPENROUTER_FREE_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'openrouter-free-models.generated.js');
const OFFICIAL_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'official-pricing.generated.js');
const SUMOPOD_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'sumopod-merge.generated.js');
const DEEPINFRA_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'deepinfra-merge.generated.js');
const OPENCODE_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'opencode-models.generated.js');

const STEPS = [
  {
    name: 'fetch-openrouter-models',
    command: 'node',
    args: ['scripts/fetch-openrouter-models.js'],
    outputs: ['data/openrouter-models.generated.json'],
  },
  {
    name: 'merge-openrouter-pricing',
    command: 'node',
    args: ['scripts/merge-openrouter-pricing.js'],
    outputs: ['js/openrouter-merge.generated.js', 'data/openrouter-merge-report.json'],
  },
  {
    name: 'build-openrouter-free-models',
    command: 'node',
    args: ['scripts/build-openrouter-free-models.js'],
    outputs: ['js/openrouter-free-models.generated.js', 'data/openrouter-free-models-report.json'],
  },
  {
    name: 'fetch-opencode-models',
    command: 'node',
    args: ['scripts/fetch-opencode-models.js'],
    outputs: ['data/opencode-models.generated.json', 'js/opencode-models.generated.js', 'data/opencode-models-report.json'],
  },
  {
    name: 'fetch-official-pricing',
    command: 'node',
    args: ['scripts/fetch-official-pricing.js'],
    outputs: ['js/official-pricing.generated.js', 'data/official-pricing-report.json'],
  },
  {
    name: 'fetch-sumopod-models',
    command: 'node',
    args: ['scripts/fetch-sumopod-models.js'],
    outputs: ['data/sumopod-models.generated.json', 'js/sumopod-merge.generated.js', 'data/sumopod-merge-report.json'],
    requiredEnv: 'SUMOPOD_API_KEY',
    // Enrichment source: on failure, keep yesterday's generated files and continue
    optional: true,
  },
  {
    name: 'fetch-deepinfra-models',
    command: 'node',
    args: ['scripts/fetch-deepinfra-models.js'],
    outputs: ['data/deepinfra-models.generated.json', 'js/deepinfra-merge.generated.js', 'data/deepinfra-merge-report.json'],
    // No API key required — DeepInfra model list is public
    optional: true,
  },
  {
    name: 'fetch-exchange-rate',
    command: 'node',
    args: ['scripts/fetch-exchange-rate.js'],
    outputs: ['data/exchange-rate.generated.json', 'js/exchange-rate.generated.js'],
    // No API key required — public, no-auth exchange rate APIs
    optional: true,
  },
];

function runStep(step) {
  const startedAt = new Date().toISOString();

  if (step.requiredEnv && !process.env[step.requiredEnv]) {
    const finishedAt = new Date().toISOString();
    return {
      name: step.name,
      command: [step.command, ...step.args].join(' '),
      optional: Boolean(step.optional),
      startedAt,
      finishedAt,
      status: 'skipped',
      exitCode: null,
      stdout: '',
      stderr: `Skipped: missing ${step.requiredEnv}`,
      outputs: step.outputs.map(relativePath => ({
        path: relativePath,
        exists: fs.existsSync(path.join(PROJECT_ROOT, relativePath)),
        size: fs.existsSync(path.join(PROJECT_ROOT, relativePath)) ? fs.statSync(path.join(PROJECT_ROOT, relativePath)).size : 0,
        updatedAt: fs.existsSync(path.join(PROJECT_ROOT, relativePath)) ? fs.statSync(path.join(PROJECT_ROOT, relativePath)).mtime.toISOString() : null,
      })),
    };
  }

  const result = spawnSync(step.command, step.args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  const finishedAt = new Date().toISOString();

  const outputs = step.outputs.map(relativePath => {
    const absolutePath = path.join(PROJECT_ROOT, relativePath);
    const exists = fs.existsSync(absolutePath);
    const stat = exists ? fs.statSync(absolutePath) : null;
    return {
      path: relativePath,
      exists,
      size: stat ? stat.size : 0,
      updatedAt: stat ? stat.mtime.toISOString() : null,
    };
  });

  return {
    name: step.name,
    command: [step.command, ...step.args].join(' '),
    optional: Boolean(step.optional),
    startedAt,
    finishedAt,
    status: result.status === 0 ? 'ok' : 'failed',
    exitCode: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    outputs,
  };
}

function readJsonIfExists(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function buildSummary() {
  const openrouterReport = readJsonIfExists('data/openrouter-merge-report.json');
  const openrouterFreeReport = readJsonIfExists('data/openrouter-free-models-report.json');
  const officialReport = readJsonIfExists('data/official-pricing-report.json');
  const sumopodReport = readJsonIfExists('data/sumopod-merge-report.json');
  const deepinfraReport = readJsonIfExists('data/deepinfra-merge-report.json');
  const exchangeRateReport = readJsonIfExists('data/exchange-rate.generated.json');
  const opencodeReport = readJsonIfExists('data/opencode-models-report.json');

  return {
    openrouter: openrouterReport
      ? {
          matched: openrouterReport.matchedCount,
          missing: openrouterReport.missingCount,
          fetchedAt: openrouterReport.fetchedAt,
        }
      : null,
    openrouterFreeModels: openrouterFreeReport
      ? {
          count: openrouterFreeReport.count,
          fetchedAt: openrouterFreeReport.fetchedAt,
        }
      : null,
    opencode: opencodeReport
      ? {
          available: opencodeReport.availableCount,
          activePaid: opencodeReport.activePaidCount,
          free: opencodeReport.freeCount,
          deprecated: opencodeReport.deprecatedCount,
          fetchedAt: opencodeReport.fetchedAt,
        }
      : null,
    official: officialReport
      ? {
          matched: officialReport.matchedCount,
          missing: officialReport.missingCount,
          fetchErrors: officialReport.fetchErrors || [],
          fetchedAt: officialReport.fetchedAt,
        }
      : null,
    sumopod: sumopodReport
      ? {
          matched: sumopodReport.matchedCount,
          missing: sumopodReport.missingCount,
          available: sumopodReport.availableCount,
          fetchedAt: sumopodReport.fetchedAt,
        }
      : null,
    deepinfra: deepinfraReport
      ? {
          matched: deepinfraReport.matchedCount,
          missing: deepinfraReport.missingCount,
          available: deepinfraReport.availableCount,
          fetchedAt: deepinfraReport.fetchedAt,
        }
      : null,
    exchangeRate: exchangeRateReport
      ? {
          rate: exchangeRateReport.rate,
          source: exchangeRateReport.source,
          fetchedAt: exchangeRateReport.fetchedAt,
        }
      : null,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateGeneratedFile(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  assert(fs.existsSync(absolutePath), `Missing generated file: ${relativePath}`);
  const stat = fs.statSync(absolutePath);
  assert(stat.size > 0, `Generated file is empty: ${relativePath}`);
  return { path: relativePath, size: stat.size, updatedAt: stat.mtime.toISOString() };
}

function checkSyntax(relativePath) {
  const result = spawnSync('node', ['--check', relativePath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  });

  assert(result.status === 0, `Syntax check failed for ${relativePath}: ${(result.stderr || result.stdout || '').trim()}`);
}

function validateRuntimePatches() {
  const context = {
    window: {},
    console: { log() {}, warn() {}, error() {} },
  };
  context.globalThis = context;
  vm.createContext(context);

  [DATA_JS_PATH, OFFICIAL_PATCH_PATH, OPENROUTER_PATCH_PATH, OPENROUTER_FREE_PATCH_PATH, SUMOPOD_PATCH_PATH, DEEPINFRA_PATCH_PATH, OPENCODE_PATCH_PATH].forEach(filePath => {
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
  });

  const models = context.window.MODELS;
  assert(Array.isArray(models), 'window.MODELS is not available after runtime validation');
  assert(models.length > 0, 'window.MODELS is empty after runtime validation');

  const openrouterPatched = models.filter(model => model.openrouterId).length;
  const officialPatched = models.filter(model => model.officialPricing && model.officialPricing.sourceType === 'official').length;
  const sumopodPatched = models.filter(model => model.thirdPartyPricing && model.thirdPartyPricing.sumopod && model.thirdPartyPricing.sumopod.source === 'sumopod-api').length;
  const deepinfraPatched = models.filter(model => model.thirdPartyPricing && model.thirdPartyPricing.deepinfra && model.thirdPartyPricing.deepinfra.source === 'deepinfra-api').length;

  const freeModels = context.window.FREE_API_MODELS;
  assert(Array.isArray(freeModels), 'window.FREE_API_MODELS is not available after runtime validation');
  const openrouterFreeCount = freeModels.filter(model => model.provider === 'openrouter').length;
  const opencodeFreeCount = freeModels.filter(model => model.provider === 'opencode').length;
  assert(openrouterFreeCount > 0, 'No OpenRouter free models were merged into FREE_API_MODELS');
  assert(opencodeFreeCount > 0, 'No OpenCode free models were merged into FREE_API_MODELS');
  assert(models.some(model => model.opencodeId === 'claude-opus-5'), 'Claude Opus 5 was not captured from OpenCode');
  assert(freeModels.some(model => model.modelId === 'opencode/ling-3.0-flash-free'), 'Ling 3.0 Flash Free was not captured from OpenCode');

  assert(openrouterPatched > 0, 'No models received OpenRouter patches');
  assert(officialPatched > 0, 'No models received official pricing patches');

  return {
    modelCount: models.length,
    openrouterPatched,
    officialPatched,
    sumopodPatched,
    deepinfraPatched,
    freeModelCount: freeModels.length,
    openrouterFreeCount,
    opencodeFreeCount,
  };
}

function updateIndexScriptVersions(version) {
  let indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const scriptFiles = [
    'js/data.js',
    'js/official-pricing.generated.js',
    'js/openrouter-merge.generated.js',
    'js/openrouter-free-models.generated.js',
    'js/sumopod-merge.generated.js',
    'js/deepinfra-merge.generated.js',
    'js/opencode-models.generated.js',
    'js/i18n.js',
    'js/currency.js',
    'js/exchange-rate.generated.js',
    'js/app.js',
  ];

  scriptFiles.forEach(file => {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<script\\s+src=["']${escaped})\\?v=[^"']+(["'])`, 'g');
    indexHtml = indexHtml.replace(regex, `$1?v=${version}$2`);
  });

  fs.writeFileSync(INDEX_HTML_PATH, indexHtml, 'utf8');
}

function validateOutputs() {
  const files = [
    validateGeneratedFile('data/openrouter-models.generated.json'),
    validateGeneratedFile('data/openrouter-merge-report.json'),
    validateGeneratedFile('data/openrouter-free-models-report.json'),
    validateGeneratedFile('data/opencode-models.generated.json'),
    validateGeneratedFile('data/opencode-models-report.json'),
    validateGeneratedFile('data/official-pricing.generated.json'),
    validateGeneratedFile('data/official-pricing-report.json'),
    validateGeneratedFile('js/openrouter-merge.generated.js'),
    validateGeneratedFile('js/openrouter-free-models.generated.js'),
    validateGeneratedFile('js/opencode-models.generated.js'),
    validateGeneratedFile('js/official-pricing.generated.js'),
    validateGeneratedFile('js/sumopod-merge.generated.js'),
    validateGeneratedFile('js/deepinfra-merge.generated.js'),
    validateGeneratedFile('data/exchange-rate.generated.json'),
    validateGeneratedFile('js/exchange-rate.generated.js'),
  ];

  if (process.env.SUMOPOD_API_KEY) {
    files.push(validateGeneratedFile('data/sumopod-models.generated.json'));
    files.push(validateGeneratedFile('data/sumopod-merge-report.json'));
  }
  files.push(validateGeneratedFile('data/deepinfra-models.generated.json'));
  files.push(validateGeneratedFile('data/deepinfra-merge-report.json'));

  checkSyntax('scripts/update-all-pricing.js');
  checkSyntax('scripts/build-openrouter-free-models.js');
  checkSyntax('scripts/fetch-opencode-models.js');
  checkSyntax('scripts/fetch-sumopod-models.js');
  checkSyntax('scripts/fetch-deepinfra-models.js');
  checkSyntax('js/openrouter-free-models.generated.js');
  checkSyntax('js/opencode-models.generated.js');
  checkSyntax('js/deepinfra-merge.generated.js');
  checkSyntax('js/exchange-rate.generated.js');

  const openrouterReport = readJsonIfExists('data/openrouter-merge-report.json');
  const openrouterFreeReport = readJsonIfExists('data/openrouter-free-models-report.json');
  const officialReport = readJsonIfExists('data/official-pricing-report.json');
  const opencodeReport = readJsonIfExists('data/opencode-models-report.json');
  const sumopodReport = readJsonIfExists('data/sumopod-merge-report.json');
  const deepinfraReport = readJsonIfExists('data/deepinfra-merge-report.json');
  assert(openrouterReport && Number.isFinite(openrouterReport.matchedCount), 'OpenRouter merge report is invalid');
  assert(openrouterFreeReport && Number.isFinite(openrouterFreeReport.count), 'OpenRouter free-models report is invalid');
  assert(opencodeReport && Number.isFinite(opencodeReport.freeCount), 'OpenCode models report is invalid');
  assert(officialReport && Number.isFinite(officialReport.matchedCount), 'Official pricing report is invalid');
  if (process.env.SUMOPOD_API_KEY) {
    assert(sumopodReport && Number.isFinite(sumopodReport.matchedCount), 'Sumopod merge report is invalid');
  }
  assert(deepinfraReport && Number.isFinite(deepinfraReport.matchedCount), 'DeepInfra merge report is invalid');

  return {
    files,
    runtime: validateRuntimePatches(),
  };
}

function main() {
  const generatedAt = new Date().toISOString();
  const steps = STEPS.map(runStep);
  steps.filter(step => step.status === 'failed').forEach(step => {
    console.error(`Step "${step.name}" failed (exit ${step.exitCode})${step.optional ? ' — optional, pipeline continues with previous data' : ''}`);
    if (step.stderr) console.error(step.stderr);
  });
  const failedStep = steps.find(step => step.status === 'failed' && !step.optional);

  let validation = null;
  let validationError = null;

  if (!failedStep) {
    try {
      validation = validateOutputs();
    } catch (error) {
      validationError = error;
    }
  }

  const report = {
    generatedAt,
    status: failedStep || validationError ? 'failed' : 'ok',
    steps,
    validation,
    validationError: validationError ? validationError.message : null,
    summary: buildSummary(),
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(`Generated combined pricing report at ${REPORT_PATH}`);
  console.log(JSON.stringify(report.summary, null, 2));
  if (validation) {
    console.log(JSON.stringify({ validation }, null, 2));
  }

  // If successful, update the default date in data.js
  if (!failedStep && !validationError) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheVersion = today.replace(/-/g, '');
      let dataJs = fs.readFileSync(DATA_JS_PATH, 'utf8');
      dataJs = dataJs.replace(/const DEFAULT_DATA_UPDATED_AT = '[^']+';/, `const DEFAULT_DATA_UPDATED_AT = '${today}';`);
      fs.writeFileSync(DATA_JS_PATH, dataJs, 'utf8');
      updateIndexScriptVersions(cacheVersion);
      console.log(`Updated DEFAULT_DATA_UPDATED_AT in data.js to ${today}`);
      console.log(`Updated script cache version in index.html to ${cacheVersion}`);
    } catch (err) {
      console.warn('Failed to update DEFAULT_DATA_UPDATED_AT in data.js:', err.message);
    }
  }

  if (failedStep) {
    console.error(`Pipeline failed at step: ${failedStep.name}`);
    process.exit(1);
  }

  if (validationError) {
    console.error(`Pipeline validation failed: ${validationError.message}`);
    process.exit(1);
  }
}

main();
