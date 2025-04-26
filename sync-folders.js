#!/usr/bin/env node
/**
 * Synchronize a source directory to a destination directory.
 *
 * Usage: node sync-folders.js /path/to/src /path/to/dest
 *
 * Requirements handled:
 *  1. Recursively walk source & destination trees.
 *  2. Delete files that vanished from source.
 *  3. Copy new files & create missing folders.
 *  4. Overwrite files whose size OR mtime differ.
 *  5. Show a progress bar based on #files in the source tree.
 */

const fs   = require('fs').promises;
const path = require('path');
const { statSync } = require('fs');

// ---- optional pretty progress bar (npm i cli-progress) ----
const cliProgress = require('cli-progress');                // ← comment-out if not installed
// -----------------------------------------------------------

if (process.argv.length < 4) {
  console.error('Usage: node sync-folders.js <sourceDir> <destDir>');
  process.exit(1);
}
const [ , , SRC_ROOT, DEST_ROOT ] = process.argv.map(p => path.resolve(p));

/* ---------------------------------------------------------
 * Helpers
 * ------------------------------------------------------- */

// Recursively gather every file path under a directory.
async function listFiles(dir, base = dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }

  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(full, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

// Ensure destination sub-directory exists.
async function ensureDir(destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
}

// Copy file preserving mtime.
async function copyFile(src, dest) {
  await ensureDir(dest);
  await fs.copyFile(src, dest);
  const { mtime, atime } = statSync(src);
  await fs.utimes(dest, atime, mtime); // keep original timestamps
}

/* ---------------------------------------------------------
 * Main
 * ------------------------------------------------------- */
(async () => {
  const srcFiles  = await listFiles(SRC_ROOT);
  const destFiles = await listFiles(DEST_ROOT);

  // Build fast look-ups
  const srcSet  = new Set(srcFiles);
  const destSet = new Set(destFiles);

  // Progress
  const total   = srcFiles.length;
  let processed = 0;
  const bar = new cliProgress.SingleBar({ clearOnComplete: true }, cliProgress.Presets.shades_classic); // ← comment-out if not installed
  bar.start(total, 0);                                                                                  // ← comment-out if not installed

  /* ---- COPY & UPDATE ---- */
  for (const relPath of srcFiles) {
    const srcPath  = path.join(SRC_ROOT,  relPath);
    const destPath = path.join(DEST_ROOT, relPath);

    let needCopy = false;
    try {
      const srcStat  = statSync(srcPath);
      try {
        const destStat = statSync(destPath);
        if (srcStat.size !== destStat.size || srcStat.mtimeMs !== destStat.mtimeMs) {
          needCopy = true; // size or modified time differ
        }
      } catch { // dest file missing
        needCopy = true;
      }
    } catch (err) {
      console.error(`Failed to stat ${srcPath}:`, err);
      continue;
    }

    if (needCopy) {
      try {
        await copyFile(srcPath, destPath);
      } catch (err) {
        console.error(`Failed to copy ${relPath}:`, err);
      }
    }
    processed++;
    bar.update(processed);  // ← comment-out if not installed
    // If you disabled cli-progress, uncomment the next line:
    // process.stdout.write(`\rProgress: ${Math.floor((processed/total)*100)}%`);
  }

  /* ---- DELETE STALE ---- */
  for (const relPath of destSet) {
    if (!srcSet.has(relPath)) {
      const destPath = path.join(DEST_ROOT, relPath);
      try {
        await fs.unlink(destPath);
        console.log(`Deleted: ${relPath}`);
      } catch (err) {
        console.error(`Failed to delete ${relPath}:`, err);
      }
    }
  }

  bar.stop();	// ← comment-out if not installed
  console.log('Sync complete.');
})();
