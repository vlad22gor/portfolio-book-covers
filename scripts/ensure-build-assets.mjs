import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

function readArg(name, fallback = undefined) {
  const arg = process.argv.find((entry) => entry.startsWith(`--${name}=`));

  if (!arg) {
    return fallback;
  }

  return arg.slice(name.length + 3);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function assertFileExists(filePath) {
  if (!(await pathExists(filePath))) {
    throw new Error(`Missing required prebuilt asset: ${filePath}`);
  }
}

async function runNodeScript(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Child process exited with code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const slug = readArg('slug', 'essentialism');
  const source = readArg('source');

  if (!source) {
    throw new Error('Missing required argument: --source=<path to source folder>');
  }

  const cwd = process.cwd();
  const sourceDir = path.resolve(cwd, source);

  if (await pathExists(sourceDir)) {
    await runNodeScript([
      path.join('scripts', 'ingest-cover-assets.mjs'),
      `--slug=${slug}`,
      `--source=${source}`,
    ]);
    return;
  }

  const requiredAssets = [
    path.resolve(cwd, 'public/assets/books', slug, 'front.webp'),
    path.resolve(cwd, 'public/assets/books', slug, 'back.webp'),
    path.resolve(cwd, 'public/assets/books', slug, 'spine.webp'),
    path.resolve(cwd, 'public/assets/books', slug, 'spread.webp'),
    path.resolve(cwd, 'public/assets/cases', slug, 'poster.webp'),
    path.resolve(cwd, 'public/assets/cases', slug, 'thumb.webp'),
  ];

  await Promise.all(requiredAssets.map(assertFileExists));

  console.log(
    `[ensure-build-assets] Source directory is unavailable, using committed assets for ${slug}.`,
  );
}

main().catch((error) => {
  console.error('[ensure-build-assets] failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
