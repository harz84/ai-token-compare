const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(PROJECT_ROOT, 'data', 'pricing-update-report.json');
const DATA_JS_PATH = path.join(PROJECT_ROOT, 'js', 'data.js');
const OPENROUTER_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'openrouter-merge.generated.js');
const OFFICIAL_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'official-pricing.generated.js');
const SUMOPOD_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'sumopod-merge.generated.js');
const DEEPINFRA_PATCH_PATH = path.join(PROJECT_ROOT, 'js', 'deepinfra-merge.generated.js');

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
  },
  {
    name: 'fetch-deepinfra-models',
    command: 'node',
    args: ['scripts/fetch-deepinfra-models.js'],
    outputs: ['data/deepinfra-models.generated.json', 'js/deepinfra-merge.generated.js', 'data/deepinfra-merge-report.json'],
    // No API key required — DeepInfra model list is public
  },
];

function runStep(step) {
  const startedAt = new Date().toISOString();

  if (step.requiredEnv && !process.env[step.requiredEnv]) {
    const finishedAt = new Date().toISOString();
    return {
      name: step.name,
      command: [step.command, ...step.args].join(' '),
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
  const officialReport = readJsonIfExists('data/official-pricing-report.json');
  const sumopodReport = readJsonIfExists('data/sumopod-merge-report.json');
  const deepinfraReport = readJsonIfExists('data/deepinfra-merge-report.json');

  return {
    openrouter: openrouterReport
      ? {
          matched: openrouterReport.matchedCount,
          missing: openrouterReport.missingCount,
          fetchedAt: openrouterReport.fetchedAt,
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

  [DATA_JS_PATH, OFFICIAL_PATCH_PATH, OPENROUTER_PATCH_PATH, SUMOPOD_PATCH_PATH, DEEPINFRA_PATCH_PATH].forEach(filePath => {
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
  });

  const models = context.window.MODELS;
  assert(Array.isArray(models), 'window.MODELS is not available after runtime validation');
  assert(models.length > 0, 'window.MODELS is empty after runtime validation');

  const openrouterPatched = models.filter(model => model.openrouterId).length;
  const officialPatched = models.filter(model => model.officialPricing && model.officialPricing.sourceType === 'official').length;
  const sumopodPatched = models.filter(model => model.thirdPartyPricing && model.thirdPartyPricing.sumopod && model.thirdPartyPricing.sumopod.source === 'sumopod-api').length;
  const deepinfraPatched = models.filter(model => model.thirdPartyPricing && model.thirdPartyPricing.deepinfra && model.thirdPartyPricing.deepinfra.source === 'deepinfra-api').length;

  assert(openrouterPatched > 0, 'No models received OpenRouter patches');
  assert(officialPatched > 0, 'No models received official pricing patches');

  return {
    modelCount: models.length,
    openrouterPatched,
    officialPatched,
    sumopodPatched,
    deepinfraPatched,
  };
}

function validateOutputs() {
  const files = [
    validateGeneratedFile('data/openrouter-models.generated.json'),
    validateGeneratedFile('data/openrouter-merge-report.json'),
    validateGeneratedFile('data/official-pricing.generated.json'),
    validateGeneratedFile('data/official-pricing-report.json'),
    validateGeneratedFile('js/openrouter-merge.generated.js'),
    validateGeneratedFile('js/official-pricing.generated.js'),
    validateGeneratedFile('js/sumopod-merge.generated.js'),
    validateGeneratedFile('js/deepinfra-merge.generated.js'),
  ];

  if (process.env.SUMOPOD_API_KEY) {
    files.push(validateGeneratedFile('data/sumopod-models.generated.json'));
    files.push(validateGeneratedFile('data/sumopod-merge-report.json'));
  }
  files.push(validateGeneratedFile('data/deepinfra-models.generated.json'));
  files.push(validateGeneratedFile('data/deepinfra-merge-report.json'));

  checkSyntax('scripts/update-all-pricing.js');
  checkSyntax('scripts/fetch-sumopod-models.js');
  checkSyntax('scripts/fetch-deepinfra-models.js');
  checkSyntax('js/deepinfra-merge.generated.js');

  const openrouterReport = readJsonIfExists('data/openrouter-merge-report.json');
  const officialReport = readJsonIfExists('data/official-pricing-report.json');
  const sumopodReport = readJsonIfExists('data/sumopod-merge-report.json');
  const deepinfraReport = readJsonIfExists('data/deepinfra-merge-report.json');
  assert(openrouterReport && Number.isFinite(openrouterReport.matchedCount), 'OpenRouter merge report is invalid');
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
  const failedStep = steps.find(step => step.status === 'failed');

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
      let dataJs = fs.readFileSync(DATA_JS_PATH, 'utf8');
      dataJs = dataJs.replace(/const DEFAULT_DATA_UPDATED_AT = '[^']+';/, `const DEFAULT_DATA_UPDATED_AT = '${today}';`);
      fs.writeFileSync(DATA_JS_PATH, dataJs, 'utf8');
      console.log(`Updated DEFAULT_DATA_UPDATED_AT in data.js to ${today}`);
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
