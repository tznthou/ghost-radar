# Ghost Radar - Find Duplicate Files with Hash

> Duplicate file ghost detector - use hash to find clones hiding in different corners

[<- Back to Muripo HQ](https://tznthou.github.io/muripo-hq/) | [中文](README.md)

---

## TL;DR

Uses file fingerprints (hash) to catch duplicate files. No matter what name you change to or where you hide, if the content is the same, you're caught!

---

## Demo

```
$ ./ghost-radar.sh ~/Downloads -r

  Ghost Detector Activating...

Target: ~/Downloads

   Scanning 1,234 files, found 56 potential duplicate groups

Ghost detected!

[Ghost Group #1] .pdf x 3 ghosts (can exorcise 2.4 MB)
   ~/Downloads/report.pdf (1.2 MB) <- Original
   ~/Downloads/report(1).pdf (1.2 MB)
   ~/Desktop/report-backup.pdf (1.2 MB)

[Ghost Group #2] .jpg x 2 ghosts (can exorcise 856 KB)
   ~/Photos/vacation.jpg (856 KB) <- Original
   ~/Backup/old-photos/IMG_1234.jpg (856 KB)

+==========================================+
| Summary                                  |
+==========================================+
|   Ghost groups: 2                        |
|   Duplicate files: 3                     |
|   Space savable: 3.2 MB                  |
+==========================================+

Achievement Unlocked!
   * Novice Ghost Hunter - First time finding duplicates

This is preview mode. Add --yes to execute exorcism (delete duplicates).
```

---

## Quick Start

### Method 1: Shell Script Quick Run (Recommended)

```bash
# Clone the project
git clone https://github.com/your-username/ghost-radar.git
cd ghost-radar

# Run directly (auto-installs dependencies)
./ghost-radar.sh ~/Downloads
```

### Method 2: Node.js Direct Run

```bash
# Install dependencies
npm install

# Run
node bin/ghost-radar.js ~/Downloads
```

### Method 3: Global Installation

```bash
npm install -g ghost-radar
ghost-radar ~/Downloads
```

---

## Features

- **Hash fingerprint detection**: Same content = caught, no escaping by renaming
- **Performance optimized**: Compare sizes first before hashing, saves 90%+ computation
- **Preview first**: Default shows only, doesn't touch files
- **Safety mechanisms**: Skips `.git`, `node_modules`, and other sensitive directories
- **Fun narration**: Ghost theme makes cleanup entertaining
- **Achievement system**: Earn exorcism experience points

---

## Usage Examples

### "I want to scan Downloads folder"

```bash
./ghost-radar.sh ~/Downloads
```

### "Include subdirectories"

```bash
./ghost-radar.sh ~/Downloads -r
```

### "Only find duplicate images"

```bash
./ghost-radar.sh ~/Photos --ext .jpg,.png,.heic -r
```

### "Ready to delete!"

```bash
./ghost-radar.sh ~/Downloads -r --yes
```

### "Keep the newest file, delete older ones"

```bash
./ghost-radar.sh ~/Downloads -r --yes --keep newest
```

### "Output JSON for other programs"

```bash
./ghost-radar.sh ~/Downloads -r --json > duplicates.json
```

---

## CLI Options

| Option | Description |
|--------|-------------|
| `-r, --recursive` | Recursively scan subdirectories |
| `-e, --ext <extensions>` | Only check specific extensions, comma-separated (e.g., `.jpg,.png`) |
| `-m, --min-size <bytes>` | Minimum file size, default 1 byte |
| `--secure` | Use SHA-256 (more secure but slower, default MD5) |
| `--hash` | Show file hash values |
| `-y, --yes` | Execute deletion (default preview only) |
| `--keep <strategy>` | Keep strategy: `oldest` (default), `newest`, `shortest` |
| `--json` | Output JSON format |
| `-h, --help` | Show help |
| `-V, --version` | Show version |

---

## Keep Strategies

| Strategy | Description |
|----------|-------------|
| `oldest` | Keep the oldest file (default, usually the original) |
| `newest` | Keep the newest file |
| `shortest` | Keep the file with shortest path (usually near root directory) |

---

## Technical Principles

### Why Use Hash?

Traditional duplicate finding relies on "filename matching", but this misses:
- Renamed duplicates (`report.pdf` vs `report-backup.pdf`)
- Same files in different paths

Hash is a file's "fingerprint":
- Same content -> Same hash
- Different content -> Different hash (collision virtually impossible)

### Performance Optimization

Not every file needs hashing! Our strategy:

```
1. Scan all files, record sizes
2. Group by size
3. Different sizes -> Can't be duplicates -> Skip
4. Only hash "same size" groups
```

This skips 90%+ of hash calculations!

### MD5 vs SHA-256

| Algorithm | Speed | Security | Use Case |
|-----------|-------|----------|----------|
| MD5 | Fast | Low (can be deliberately collided) | Finding duplicates (default) |
| SHA-256 | Slow | High | File integrity verification |

MD5 is sufficient for finding duplicates - we're not defending against hackers, just finding files with identical content.

---

## Use Cases

| Scenario | Command |
|----------|---------|
| **Photo cleanup** | `ghost-radar ~/Photos --ext .jpg,.heic -r` |
| **Downloads cleanup** | `ghost-radar ~/Downloads -r` |
| **Music deduplication** | `ghost-radar ~/Music --ext .mp3,.flac -r` |
| **Project assets** | `ghost-radar ./src/assets -r` |
| **Backup verification** | `ghost-radar /backup /original --json` |

---

## Safety Mechanisms

- **Default preview**: Files never deleted without `--yes`
- **Double confirmation**: Requires typing `yes` before deletion
- **Skip hidden files**: Files starting with `.` not processed
- **Skip sensitive directories**: `node_modules`, `.git`, `dist`, etc.
- **Error handling**: Unreadable files are skipped and reported

---

## Achievement System

| Achievement | Condition |
|-------------|-----------|
| Novice Ghost Hunter | Found 1+ duplicate group |
| Paranormal Detective | Found 5+ duplicate groups |
| Ghost Busting Expert | Found 10+ duplicate groups |
| Exorcism Master | Found 50+ duplicate groups |
| Ghost King Slayer | Found 100+ duplicate groups |
| Space Liberator | Can free 1+ MB |
| Hard Drive Savior | Can free 100+ MB |
| Storage Guardian | Can free 1+ GB |

---

## License

[MIT](LICENSE)

---

## Author

Tzu-Chao - [tznthou@gmail.com](mailto:tznthou@gmail.com)
