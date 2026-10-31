import { runFighterAssetValidation } from './validateFighterAssets.js';

void runFighterAssetValidation()
  .then((output) => {
    process.stdout.write(`${output.report}\n`);
    if (!output.ok) {
      process.exitCode = 1;
    }
  })
  .catch((error: unknown) => {
    if (error instanceof Error) {
      process.stderr.write(`asset-validator runtime error: ${error.message}\n`);
    } else {
      process.stderr.write('asset-validator runtime error: unknown\n');
    }
    process.exitCode = 1;
  });
