/**
 * 輸出格式模組
 * 負責格式化和顯示結果
 */

const path = require('path');

// 無厘頭旁白
const QUOTES = {
  scanning: [
    '靈異探測器啟動中...',
    '打開第三隻眼...',
    '感應分身鬼的氣息...'
  ],
  noGhosts: [
    '這裡很乾淨，沒有鬼作祟！',
    '一隻分身鬼都沒有，真稀奇！',
    '潔淨無瑕！連鬼都不想來。',
    '完美！你是整理大師。'
  ],
  foundGhosts: [
    '偵測到分身鬼！',
    '有東西在這裡重複出現...',
    '抓到你了，小鬼！',
    '靈異反應超標！'
  ],
  achievements: [
    { threshold: 1, title: '初心捉鬼人', desc: '第一次發現重複檔案' },
    { threshold: 5, title: '靈異偵探', desc: '發現 5 組以上的分身鬼' },
    { threshold: 10, title: '抓鬼達人', desc: '發現 10 組以上的分身鬼' },
    { threshold: 50, title: '驅魔大師', desc: '發現 50 組以上的分身鬼' },
    { threshold: 100, title: '鬼王剋星', desc: '發現 100 組以上的分身鬼' }
  ],
  spaceAchievements: [
    { threshold: 1024 * 1024, title: '空間解放者', desc: '釋放超過 1 MB' },
    { threshold: 100 * 1024 * 1024, title: '硬碟救星', desc: '釋放超過 100 MB' },
    { threshold: 1024 * 1024 * 1024, title: '儲存空間守護神', desc: '釋放超過 1 GB' }
  ]
};

/**
 * 格式化檔案大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * 隨機選擇一個旁白
 */
function randomQuote(category) {
  const quotes = QUOTES[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * 取得成就
 */
function getAchievements(groupCount, wastedSpace) {
  const achievements = [];

  for (const a of QUOTES.achievements) {
    if (groupCount >= a.threshold) {
      achievements.push(a);
    }
  }

  for (const a of QUOTES.spaceAchievements) {
    if (wastedSpace >= a.threshold) {
      achievements.push(a);
    }
  }

  return achievements;
}

/**
 * 縮短路徑顯示
 */
function shortenPath(filePath, maxLength = 60) {
  if (filePath.length <= maxLength) return filePath;

  const home = process.env.HOME || process.env.USERPROFILE || '';
  let shortened = filePath;

  // 替換 home 目錄為 ~
  if (home && filePath.startsWith(home)) {
    shortened = '~' + filePath.slice(home.length);
  }

  if (shortened.length <= maxLength) return shortened;

  // 還是太長就截斷中間
  const start = shortened.slice(0, 20);
  const end = shortened.slice(-(maxLength - 23));
  return `${start}...${end}`;
}

/**
 * 印出掃描開始訊息
 */
function printStart(targetPath) {
  console.log('');
  console.log(`\u001b[36m\u001b[1m  \u001b[0m ${randomQuote('scanning')}`);
  console.log('');
  console.log(`\u001b[33m\u{1F50D}\u001b[0m 掃描目標: \u001b[4m${targetPath}\u001b[0m`);
  console.log('');
}

/**
 * 印出掃描統計
 */
function printScanStats(fileCount, potentialCount) {
  console.log(`\u001b[90m   掃描 ${fileCount} 個檔案，發現 ${potentialCount} 個潛在重複群組\u001b[0m`);
  console.log('');
}

/**
 * 印出進度
 */
function printProgress(current, total) {
  const percent = Math.round((current / total) * 100);
  const bar = '\u2588'.repeat(Math.floor(percent / 5)) + '\u2591'.repeat(20 - Math.floor(percent / 5));
  process.stdout.write(`\r\u001b[90m   計算 hash 中... [${bar}] ${percent}%\u001b[0m`);
}

/**
 * 清除進度列
 */
function clearProgress() {
  process.stdout.write('\r\u001b[K');
}

/**
 * 印出無重複訊息
 */
function printNoGhosts() {
  console.log(`\u001b[32m\u2728\u001b[0m ${randomQuote('noGhosts')}`);
  console.log('');
}

/**
 * 印出重複檔案結果
 */
function printDuplicates(result, showHash = false) {
  console.log(`\u001b[31m\u001b[1m\u{1F47B} ${randomQuote('foundGhosts')}\u001b[0m`);
  console.log('');

  let groupNum = 1;
  for (const group of result.groups) {
    const ext = path.extname(group.files[0].name) || '(無副檔名)';
    const wastedStr = formatSize(group.wastedSpace);

    console.log(`\u001b[33m\u3010\u9B3C\u7FA4 #${groupNum}\u3011\u001b[0m ${ext} \u00D7 ${group.files.length} \u96BB \u001b[90m(\u53EF\u9A45\u9664 ${wastedStr})\u001b[0m`);

    if (showHash) {
      console.log(`   \u001b[90mHash: ${group.hash}\u001b[0m`);
    }

    group.files.forEach((file, index) => {
      const isFirst = index === 0;
      const icon = isFirst ? '\u001b[32m\u{1F4C4}\u001b[0m' : '\u001b[31m\u{1F47B}\u001b[0m';
      const label = isFirst ? '\u001b[32m\u2190 \u672C\u5C0A\u001b[0m' : '';
      const sizeStr = formatSize(file.size);

      console.log(`   ${icon} ${shortenPath(file.path)} \u001b[90m(${sizeStr})\u001b[0m ${label}`);
    });

    console.log('');
    groupNum++;
  }
}

/**
 * 印出統計摘要
 */
function printSummary(result) {
  const box = '\u2550'.repeat(40);

  console.log(`\u001b[36m\u2554${box}\u2557\u001b[0m`);
  console.log(`\u001b[36m\u2551\u001b[0m \u{1F4CA} \u7D71\u8A08\u6458\u8981                              \u001b[36m\u2551\u001b[0m`);
  console.log(`\u001b[36m\u2560${box}\u2563\u001b[0m`);
  console.log(`\u001b[36m\u2551\u001b[0m   \u9B3C\u7FA4\u6578\u91CF: ${result.totalGroups} \u7D44                          \u001b[36m\u2551\u001b[0m`);
  console.log(`\u001b[36m\u2551\u001b[0m   \u91CD\u8907\u6A94\u6848: ${result.totalDuplicateFiles} \u500B                          \u001b[36m\u2551\u001b[0m`);
  console.log(`\u001b[36m\u2551\u001b[0m   \u53EF\u7BC0\u7701\u7A7A\u9593: \u001b[33m${formatSize(result.totalWastedSpace)}\u001b[0m                    \u001b[36m\u2551\u001b[0m`);
  console.log(`\u001b[36m\u255A${box}\u255D\u001b[0m`);
  console.log('');
}

/**
 * 印出成就
 */
function printAchievements(result) {
  const achievements = getAchievements(result.totalGroups, result.totalWastedSpace);

  if (achievements.length > 0) {
    console.log('\u001b[35m\u{1F3C6} Achievement Unlocked!\u001b[0m');
    for (const a of achievements) {
      console.log(`   \u001b[33m\u2605\u001b[0m ${a.title} - ${a.desc}`);
    }
    console.log('');
  }
}

/**
 * 印出提示訊息
 */
function printHint(isDryRun) {
  if (isDryRun) {
    console.log('\u001b[90m\u{1F4A1} \u9019\u662F\u9810\u89BD\u6A21\u5F0F\u3002\u52A0\u4E0A --yes \u57F7\u884C\u9A45\u9B54\uFF08\u522A\u9664\u91CD\u8907\u6A94\u6848\uFF09\u3002\u001b[0m');
    console.log('');
  }
}

/**
 * 印出 JSON 格式
 */
function printJson(result) {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * 印出錯誤訊息
 */
function printErrors(errors) {
  if (errors.length > 0) {
    console.log('\u001b[33m\u26A0\uFE0F  \u90E8\u5206\u6A94\u6848\u7121\u6CD5\u8B80\u53D6:\u001b[0m');
    for (const err of errors.slice(0, 5)) {
      console.log(`   \u001b[90m${shortenPath(err.path)}: ${err.error}\u001b[0m`);
    }
    if (errors.length > 5) {
      console.log(`   \u001b[90m... \u9084\u6709 ${errors.length - 5} \u500B\u932F\u8AA4\u001b[0m`);
    }
    console.log('');
  }
}

/**
 * 印出刪除確認
 */
function printDeleteConfirmation(result) {
  console.log(`\u001b[31m\u26A0\uFE0F  \u5373\u5C07\u522A\u9664 ${result.totalDuplicateFiles} \u500B\u91CD\u8907\u6A94\u6848\uFF0C\u91CB\u653E ${formatSize(result.totalWastedSpace)}\u001b[0m`);
  console.log('');
}

module.exports = {
  formatSize,
  shortenPath,
  printStart,
  printScanStats,
  printProgress,
  clearProgress,
  printNoGhosts,
  printDuplicates,
  printSummary,
  printAchievements,
  printHint,
  printJson,
  printErrors,
  printDeleteConfirmation,
  getAchievements
};
