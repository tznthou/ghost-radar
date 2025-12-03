/**
 * 檔案掃描模組
 * 掃描目錄中的所有檔案，並依大小分組
 */

const fs = require('fs');
const path = require('path');

// 預設跳過的目錄
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.cache',
  '.Trash',
  '$RECYCLE.BIN'
]);

/**
 * 掃描目錄中的檔案
 * @param {string} targetPath - 要掃描的路徑
 * @param {Object} options - 掃描選項
 * @param {boolean} options.recursive - 是否遞迴子目錄
 * @param {string[]} options.extensions - 只處理的副檔名列表
 * @param {number} options.minSize - 最小檔案大小 (bytes)
 * @returns {Object[]} 檔案資訊陣列
 */
function scanDirectory(targetPath, options = {}) {
  const { recursive = false, extensions = null, minSize = 1 } = options;
  const files = [];
  const errors = [];

  function scan(dirPath) {
    let entries;

    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      errors.push({ path: dirPath, error: err.message });
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // 跳過隱藏檔案（以 . 開頭）
      if (entry.name.startsWith('.')) {
        continue;
      }

      // 跳過特定目錄
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) {
        continue;
      }

      // 處理符號連結 - 跳過
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        if (recursive) {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);

          // 檢查最小大小
          if (stat.size < minSize) {
            continue;
          }

          // 檢查副檔名
          if (extensions && extensions.length > 0) {
            const ext = path.extname(entry.name).toLowerCase();
            if (!extensions.includes(ext)) {
              continue;
            }
          }

          files.push({
            path: fullPath,
            name: entry.name,
            size: stat.size,
            mtime: stat.mtime
          });
        } catch (err) {
          errors.push({ path: fullPath, error: err.message });
        }
      }
    }
  }

  // 確認目標路徑存在
  if (!fs.existsSync(targetPath)) {
    throw new Error(`路徑不存在: ${targetPath}`);
  }

  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    // 如果是單一檔案，直接加入
    files.push({
      path: targetPath,
      name: path.basename(targetPath),
      size: stat.size,
      mtime: stat.mtime
    });
  } else if (stat.isDirectory()) {
    scan(targetPath);
  } else {
    throw new Error(`不支援的路徑類型: ${targetPath}`);
  }

  return { files, errors };
}

/**
 * 依檔案大小分組
 * 大小不同的檔案不可能是重複的，所以先分組可以減少 hash 計算
 * @param {Object[]} files - 檔案資訊陣列
 * @returns {Map<number, Object[]>} 大小 -> 檔案陣列的 Map
 */
function groupBySize(files) {
  const groups = new Map();

  for (const file of files) {
    const size = file.size;
    if (!groups.has(size)) {
      groups.set(size, []);
    }
    groups.get(size).push(file);
  }

  return groups;
}

/**
 * 過濾出只有多個檔案的群組（潛在重複）
 * @param {Map<number, Object[]>} sizeGroups - 大小分組
 * @returns {Object[][]} 可能重複的檔案群組
 */
function filterPotentialDuplicates(sizeGroups) {
  const potentialDuplicates = [];

  for (const [size, files] of sizeGroups) {
    if (files.length > 1) {
      potentialDuplicates.push(files);
    }
  }

  return potentialDuplicates;
}

module.exports = {
  scanDirectory,
  groupBySize,
  filterPotentialDuplicates,
  SKIP_DIRS
};
