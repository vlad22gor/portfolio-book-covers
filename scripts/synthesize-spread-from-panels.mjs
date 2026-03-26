import path from 'node:path';
import sharp from 'sharp';

function readArg(name, fallback = undefined) {
  const arg = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
}

async function main() {
  const source = readArg('source');
  const hinge = Number(readArg('hinge', '34'));

  if (!source) {
    throw new Error('Missing --source argument');
  }

  const sourceDir = path.resolve(process.cwd(), source);
  const frontPath = path.join(sourceDir, 'front.png');
  const backPath = path.join(sourceDir, 'back.png');
  const spinePath = path.join(sourceDir, 'spine.png');
  const spreadPath = path.join(sourceDir, 'spread.png');

  const frontMeta = await sharp(frontPath).metadata();
  const backMeta = await sharp(backPath).metadata();
  const spineMeta = await sharp(spinePath).metadata();

  if (!frontMeta.width || !frontMeta.height || !backMeta.width || !spineMeta.width) {
    throw new Error('Cannot read source PNG dimensions');
  }

  if (frontMeta.height !== backMeta.height || frontMeta.height !== spineMeta.height) {
    throw new Error('front/back/spine heights must match');
  }

  const height = frontMeta.height;
  const totalWidth = backMeta.width + hinge + spineMeta.width + hinge + frontMeta.width;

  const backHinge = await sharp(backPath)
    .extract({ left: backMeta.width - hinge, top: 0, width: hinge, height })
    .png()
    .toBuffer();

  const frontHinge = await sharp(frontPath)
    .extract({ left: 0, top: 0, width: hinge, height })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: totalWidth,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: backPath, left: 0, top: 0 },
      { input: backHinge, left: backMeta.width, top: 0 },
      { input: spinePath, left: backMeta.width + hinge, top: 0 },
      { input: frontHinge, left: backMeta.width + hinge + spineMeta.width, top: 0 },
      { input: frontPath, left: backMeta.width + hinge + spineMeta.width + hinge, top: 0 },
    ])
    .png()
    .toFile(spreadPath);

  console.log(`Created ${spreadPath} (${totalWidth}x${height})`);
}

main().catch((error) => {
  console.error('[synthesize-spread] failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
