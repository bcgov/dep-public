'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const formioPath = path.resolve(
  __dirname,
  '../../common-hosted-form-service/components'
);
const formioNodeModules = path.join(formioPath, 'node_modules');
const formioLibEntry = path.join(formioPath, 'lib/index.js');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: formioPath,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function shouldInstallDependencies() {
  return !fs.existsSync(formioNodeModules);
}

function shouldBuildPackage() {
  return !fs.existsSync(formioLibEntry);
}

if (!fs.existsSync(formioPath)) {
  console.warn(
    `Skipping @bcgov/formio bootstrap; missing path: ${formioPath}`
  );
  process.exit(0);
}

if (shouldInstallDependencies()) {
  run('npm', ['ci']);
}

if (shouldBuildPackage()) {
  run('npm', ['run', 'build']);
}
