/**
 * Hash 計算模組
 * 使用串流方式計算檔案 hash，避免大檔案記憶體問題
 */

const fs = require('fs');
const crypto = require('crypto');

/**
 * 計算單一檔案的 hash
 * @param {string} filePath - 檔案路徑
 * @param {string} algorithm - hash 演算法 ('md5' | 'sha256')
 * @returns {Promise<string>} hash 值
 */
function calculateFileHash(filePath, algorithm = 'md5') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 批次計算檔案群組的 hash
 * @param {Object[]} files - 檔案資訊陣列
 * @param {string} algorithm - hash 演算法
 * @param {Function} onProgress - 進度回調
 * @returns {Promise<Object[]>} 帶有 hash 的檔案資訊陣列
 */
async function calculateGroupHashes(files, algorithm = 'md5', onProgress = null) {
  const results = [];
  let processed = 0;

  for (const file of files) {
    try {
      const hash = await calculateFileHash(file.path, algorithm);
      results.push({ ...file, hash });
    } catch (err) {
      results.push({ ...file, hash: null, error: err.message });
    }

    processed++;
    if (onProgress) {
      onProgress(processed, files.length);
    }
  }

  return results;
}

/**
 * 依 hash 分組找出重複檔案
 * @param {Object[]} filesWithHash - 帶有 hash 的檔案陣列
 * @returns {Map<string, Object[]>} hash -> 檔案陣列的 Map（只包含重複的）
 */
function groupByHash(filesWithHash) {
  const groups = new Map();

  for (const file of filesWithHash) {
    if (!file.hash) continue; // 跳過計算失敗的

    if (!groups.has(file.hash)) {
      groups.set(file.hash, []);
    }
    groups.get(file.hash).push(file);
  }

  // 只保留有重複的群組
  const duplicates = new Map();
  for (const [hash, files] of groups) {
    if (files.length > 1) {
      duplicates.set(hash, files);
    }
  }

  return duplicates;
}

/**
 * 完整的重複檔案偵測流程
 * @param {Object[][]} potentialGroups - 潛在重複群組（已按大小分組）
 * @param {Object} options - 選項
 * @param {string} options.algorithm - hash 演算法
 * @param {Function} options.onProgress - 進度回調
 * @returns {Promise<Object>} 重複檔案結果
 */
async function findDuplicates(potentialGroups, options = {}) {
  const { algorithm = 'md5', onProgress = null } = options;

  const allDuplicates = [];
  let totalFiles = 0;
  let processedFiles = 0;

  // 計算總檔案數
  for (const group of potentialGroups) {
    totalFiles += group.length;
  }

  // 處理每個潛在重複群組
  for (const group of potentialGroups) {
    const filesWithHash = await calculateGroupHashes(group, algorithm, (done, total) => {
      if (onProgress) {
        onProgress(processedFiles + done, totalFiles);
      }
    });

    processedFiles += group.length;

    const duplicateGroups = groupByHash(filesWithHash);

    for (const [hash, files] of duplicateGroups) {
      // 按修改時間排序，最舊的在前面（建議保留）
      files.sort((a, b) => a.mtime - b.mtime);

      allDuplicates.push({
        hash,
        size: files[0].size,
        files,
        wastedSpace: files[0].size * (files.length - 1)
      });
    }
  }

  // 按浪費空間排序（大的在前）
  allDuplicates.sort((a, b) => b.wastedSpace - a.wastedSpace);

  return {
    groups: allDuplicates,
    totalGroups: allDuplicates.length,
    totalDuplicateFiles: allDuplicates.reduce((sum, g) => sum + g.files.length - 1, 0),
    totalWastedSpace: allDuplicates.reduce((sum, g) => sum + g.wastedSpace, 0)
  };
}

module.exports = {
  calculateFileHash,
  calculateGroupHashes,
  groupByHash,
  findDuplicates
};
