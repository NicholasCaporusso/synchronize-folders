# Folder Sync Utility

> A lightweight Node.js script that mirrors a **source** directory to a **destination** directory—adding, updating, and deleting files so the destination is always an exact copy.

---

## Features

| # | Capability |
|---|-------------|
| 1 | **Recursive sync** of all files and sub‑directories |
| 2 | **Deletes** files that were removed from the source |
| 3 | **Copies & creates** new or updated files/folders |
| 4 | **Smart comparison**: only overwrites when _size_ or _modified‑time_ differs |
| 5 | **Progress bar** driven by total file count (pretty CLI bar via [cli-progress](https://www.npmjs.com/package/cli-progress) or simple fallback) |

---

## Prerequisites

- **Node.js ≥ 14** (uses modern async/await and `fs.promises` API)
- _(Optional)_ **cli-progress** for a nicer progress indicator

```bash
npm install cli-progress  # optional but recommended
```

---

## Installation

Clone or download this repository and make the script executable:

```bash
git clone https://github.com/your-user/folder-sync.git
cd folder-sync
chmod +x sync-folders.js
```

---

## Usage

```bash
node sync-folders.js <sourceDir> <destDir>
```

### Example

```bash
node sync-folders.js /Users/alex/Documents /Volumes/Backup/Documents
```

The command will:
1. Count every file under `/Users/alex/Documents` to size the progress bar.
2. Copy over new or modified files to the backup location.
3. Remove any file that no longer exists in the source.
4. Preserve original **modified** and **access** timestamps.

> **Tip:** Run with `--dry-run` support is not implemented yet, but you can duplicate the destination to test safely.

---

## How It Works

1. **Index source & destination** → Creates two in‑memory sets of relative file paths.
2. **Copy / update loop** → Compares size & mtime; uses `fs.copyFile` and `fs.utimes` to replicate files.
3. **Garbage‑collect loop** → Unlinks anything present in dest but missing in src.
4. **Progress reporting** → Updates the CLI bar after each copy/update.

All heavy I/O is performed with async functions to keep things responsive.

---

## Customisation Ideas

- **Ignore patterns** (e.g. `.git`, `node_modules`) via glob or regex
- **Watch mode** using `fs.watch` for real‑time sync
- **Concurrency** (copy multiple files in parallel)
- **Dry‑run** flag to preview changes without writing

PRs are welcome!

---