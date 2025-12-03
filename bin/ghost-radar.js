#!/usr/bin/env node

/**
 * Ghost Radar - 重複檔案抓鬼雷達
 * 用 hash 找出躲在不同角落的分身鬼
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { scanDirectory, groupBySize, filterPotentialDuplicates } = require('../lib/scanner');
const { findDuplicates } = require('../lib/hasher');
const reporter = require('../lib/reporter');

// 版本資訊
const packageJson = require('../package.json');

program
  .name('ghost-radar')
  .description('重複檔案抓鬼雷達 - 用 hash 找出躲在不同角落的分身鬼')
  .version(packageJson.version)
  .argument('[path]', '要掃描的目錄路徑', '.')
  .option('-r, --recursive', '遞迴掃描子目錄')
  .option('-e, --ext <extensions>', '只檢查特定副檔名，逗號分隔 (例: .jpg,.png)')
  .option('-m, --min-size <bytes>', '最小檔案大小 (bytes)', '1')
  .option('--secure', '使用 SHA-256 (更安全但較慢，預設 MD5)')
  .option('--hash', '顯示檔案 hash 值')
  .option('-y, --yes', '執行刪除 (預設只預覽)')
  .option('--keep <strategy>', '保留策略: oldest (預設), newest, shortest', 'oldest')
  .option('--json', '輸出 JSON 格式')
  .action(async (targetPath, options) => {
    try {
      await run(targetPath, options);
    } catch (err) {
      console.error(`\n\u001b[31m\u274C 錯誤: ${err.message}\u001b[0m\n`);
      process.exit(1);
    }
  });

program.parse();

async function run(targetPath, options) {
  const absolutePath = path.resolve(targetPath);

  // 解析副檔名
  let extensions = null;
  if (options.ext) {
    extensions = options.ext.split(',').map(e => {
      e = e.trim().toLowerCase();
      return e.startsWith('.') ? e : `.${e}`;
    });
  }

  const minSize = parseInt(options.minSize, 10) || 1;
  const algorithm = options.secure ? 'sha256' : 'md5';
  const isJson = options.json;

  // 非 JSON 模式才印開始訊息
  if (!isJson) {
    reporter.printStart(absolutePath);
  }

  // 掃描檔案
  const { files, errors } = scanDirectory(absolutePath, {
    recursive: options.recursive,
    extensions,
    minSize
  });

  if (files.length === 0) {
    if (!isJson) {
      console.log('\u001b[90m   找不到符合條件的檔案\u001b[0m\n');
    }
    return;
  }

  // 依大小分組
  const sizeGroups = groupBySize(files);
  const potentialGroups = filterPotentialDuplicates(sizeGroups);

  if (!isJson) {
    reporter.printScanStats(files.length, potentialGroups.length);
  }

  if (potentialGroups.length === 0) {
    if (!isJson) {
      reporter.printNoGhosts();
    } else {
      console.log(JSON.stringify({ groups: [], totalGroups: 0, totalDuplicateFiles: 0, totalWastedSpace: 0 }));
    }
    return;
  }

  // 計算 hash 找重複
  const result = await findDuplicates(potentialGroups, {
    algorithm,
    onProgress: isJson ? null : (current, total) => {
      reporter.printProgress(current, total);
    }
  });

  if (!isJson) {
    reporter.clearProgress();
  }

  // 印出錯誤
  if (!isJson && errors.length > 0) {
    reporter.printErrors(errors);
  }

  // 沒有重複
  if (result.totalGroups === 0) {
    if (!isJson) {
      reporter.printNoGhosts();
    } else {
      console.log(JSON.stringify(result));
    }
    return;
  }

  // 輸出結果
  if (isJson) {
    reporter.printJson(result);
    return;
  }

  reporter.printDuplicates(result, options.hash);
  reporter.printSummary(result);
  reporter.printAchievements(result);

  // 預覽或刪除
  if (!options.yes) {
    reporter.printHint(true);
    return;
  }

  // 執行刪除
  await executeDelete(result, options.keep);
}

async function executeDelete(result, keepStrategy) {
  reporter.printDeleteConfirmation(result);

  // 二次確認
  const answer = await askQuestion('\u001b[33m輸入 "yes" 確認刪除，或按 Enter 取消: \u001b[0m');

  if (answer.toLowerCase() !== 'yes') {
    console.log('\n\u001b[90m已取消刪除\u001b[0m\n');
    return;
  }

  console.log('\n\u001b[36m\u{1F9F9} 開始驅魔...\u001b[0m\n');

  let deletedCount = 0;
  let deletedSize = 0;
  const failedDeletes = [];

  for (const group of result.groups) {
    // 根據策略決定保留哪個
    let sortedFiles = [...group.files];

    switch (keepStrategy) {
      case 'newest':
        sortedFiles.sort((a, b) => b.mtime - a.mtime);
        break;
      case 'shortest':
        sortedFiles.sort((a, b) => a.path.length - b.path.length);
        break;
      case 'oldest':
      default:
        sortedFiles.sort((a, b) => a.mtime - b.mtime);
        break;
    }

    // 保留第一個，刪除其他
    const [keep, ...toDelete] = sortedFiles;

    console.log(`\u001b[32m\u2713\u001b[0m 保留: ${reporter.shortenPath(keep.path)}`);

    for (const file of toDelete) {
      try {
        fs.unlinkSync(file.path);
        console.log(`\u001b[31m\u2717\u001b[0m 刪除: ${reporter.shortenPath(file.path)}`);
        deletedCount++;
        deletedSize += file.size;
      } catch (err) {
        failedDeletes.push({ path: file.path, error: err.message });
        console.log(`\u001b[33m\u26A0\u001b[0m 失敗: ${reporter.shortenPath(file.path)} (${err.message})`);
      }
    }

    console.log('');
  }

  // 刪除結果
  console.log('\u001b[36m\u2550'.repeat(42) + '\u001b[0m');
  console.log(`\u001b[32m\u2728 驅魔完成！\u001b[0m`);
  console.log(`   刪除了 ${deletedCount} 個分身鬼`);
  console.log(`   釋放了 ${reporter.formatSize(deletedSize)} 空間`);

  if (failedDeletes.length > 0) {
    console.log(`\u001b[33m   ${failedDeletes.length} 個檔案刪除失敗\u001b[0m`);
  }

  console.log('');
}

function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
