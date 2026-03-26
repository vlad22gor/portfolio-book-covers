import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const EXPECTED_LAYOUT = {
  back: 1590,
  hingeLeft: 34,
  spine: 177,
  hingeRight: 34,
  front: 1590,
  total: 3425,
  height: 2598,
};

function readArg(name, fallback = undefined) {
  const arg = process.argv.find((entry) => entry.startsWith(`--${name}=`));

  if (!arg) {
    return fallback;
  }

  return arg.slice(name.length + 3);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function assertFileExists(filePath, name) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Missing ${name}: ${filePath}`);
  }
}

async function assertImageSize(filePath, expectedWidth, expectedHeight, label) {
  const metadata = await sharp(filePath).metadata();

  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(
      `${label} has invalid size ${metadata.width}x${metadata.height}; expected ${expectedWidth}x${expectedHeight}`,
    );
  }
}

function assertLayoutConsistency() {
  const computedTotal =
    EXPECTED_LAYOUT.back +
    EXPECTED_LAYOUT.hingeLeft +
    EXPECTED_LAYOUT.spine +
    EXPECTED_LAYOUT.hingeRight +
    EXPECTED_LAYOUT.front;

  if (computedTotal !== EXPECTED_LAYOUT.total) {
    throw new Error(
      `layoutPx mismatch: total=${EXPECTED_LAYOUT.total}, computed=${computedTotal}`,
    );
  }
}

async function convertToWebp(inputPath, outputPath, width = undefined, quality = 90) {
  const pipeline = sharp(inputPath);

  if (width) {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  await pipeline.webp({ quality }).toFile(outputPath);
}

async function main() {
  const slug = readArg('slug', 'essentialism');
  const source = readArg('source');

  if (!source) {
    throw new Error('Missing required argument: --source=<path to source folder>');
  }

  assertLayoutConsistency();

  const cwd = process.cwd();
  const sourceDir = path.resolve(cwd, source);

  const spreadPng = path.join(sourceDir, 'spread.png');
  const frontPng = path.join(sourceDir, 'front.png');
  const backPng = path.join(sourceDir, 'back.png');
  const spinePng = path.join(sourceDir, 'spine.png');

  await assertFileExists(spreadPng, 'spread.png');
  await assertImageSize(
    spreadPng,
    EXPECTED_LAYOUT.total,
    EXPECTED_LAYOUT.height,
    'spread.png',
  );

  await assertFileExists(frontPng, 'front.png');
  await assertFileExists(backPng, 'back.png');
  await assertFileExists(spinePng, 'spine.png');

  await assertImageSize(frontPng, EXPECTED_LAYOUT.front, EXPECTED_LAYOUT.height, 'front.png');
  await assertImageSize(backPng, EXPECTED_LAYOUT.back, EXPECTED_LAYOUT.height, 'back.png');
  await assertImageSize(spinePng, EXPECTED_LAYOUT.spine, EXPECTED_LAYOUT.height, 'spine.png');

  const booksOutDir = path.resolve(cwd, 'public/assets/books', slug);
  const casesOutDir = path.resolve(cwd, 'public/assets/cases', slug);

  await ensureDir(booksOutDir);
  await ensureDir(casesOutDir);

  await convertToWebp(spreadPng, path.join(booksOutDir, 'spread.webp'), undefined, 92);
  await convertToWebp(frontPng, path.join(booksOutDir, 'front.webp'), undefined, 92);
  await convertToWebp(backPng, path.join(booksOutDir, 'back.webp'), undefined, 92);
  await convertToWebp(spinePng, path.join(booksOutDir, 'spine.webp'), undefined, 92);

  await convertToWebp(spreadPng, path.join(casesOutDir, 'poster.webp'), 1800, 88);
  await convertToWebp(spreadPng, path.join(casesOutDir, 'thumb.webp'), 760, 86);

  console.log(`Assets ingested for ${slug}:`);
  console.log(`- ${path.relative(cwd, path.join(booksOutDir, 'spread.webp'))}`);
  console.log(`- ${path.relative(cwd, path.join(casesOutDir, 'poster.webp'))}`);
  console.log(`- ${path.relative(cwd, path.join(casesOutDir, 'thumb.webp'))}`);
}

main().catch((error) => {
  console.error('[assets:ingest] failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
