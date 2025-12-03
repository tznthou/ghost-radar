# Ghost Radar

> 重複檔案抓鬼雷達 - 用 hash 找出躲在不同角落的分身鬼

[← 回到 Muripo HQ](https://tznthou.github.io/muripo-hq/)

---

## TL;DR

用檔案指紋（hash）揪出重複檔案。不管你改了什麼名字、藏在哪個資料夾，內容一樣就是抓到你！

---

## Demo

```
$ ./ghost-radar.sh ~/Downloads -r

  👻 靈異探測器啟動中...

🔍 掃描目標: ~/Downloads

   掃描 1,234 個檔案，發現 56 個潛在重複群組

👻 偵測到分身鬼！

【鬼群 #1】 .pdf × 3 隻 (可驅除 2.4 MB)
   📄 ~/Downloads/report.pdf (1.2 MB) ← 本尊
   👻 ~/Downloads/report(1).pdf (1.2 MB)
   👻 ~/Desktop/report-backup.pdf (1.2 MB)

【鬼群 #2】 .jpg × 2 隻 (可驅除 856 KB)
   📄 ~/Photos/vacation.jpg (856 KB) ← 本尊
   👻 ~/Backup/old-photos/IMG_1234.jpg (856 KB)

╔══════════════════════════════════════════╗
║ 📊 統計摘要                              ║
╠══════════════════════════════════════════╣
║   鬼群數量: 2 組                         ║
║   重複檔案: 3 個                         ║
║   可節省空間: 3.2 MB                     ║
╚══════════════════════════════════════════╝

🏆 Achievement Unlocked!
   ★ 初心捉鬼人 - 第一次發現重複檔案

💡 這是預覽模式。加上 --yes 執行驅魔（刪除重複檔案）。
```

---

## Quick Start

### 方法 1：Shell Script 快速執行（推薦）

```bash
# 下載專案
git clone https://github.com/your-username/ghost-radar.git
cd ghost-radar

# 直接執行（自動安裝依賴）
./ghost-radar.sh ~/Downloads
```

### 方法 2：Node.js 直接執行

```bash
# 安裝依賴
npm install

# 執行
node bin/ghost-radar.js ~/Downloads
```

### 方法 3：全域安裝

```bash
npm install -g ghost-radar
ghost-radar ~/Downloads
```

---

## 功能特色

- 🔍 **Hash 指紋偵測**：內容相同就抓到，不怕改名躲藏
- ⚡ **效能優化**：先比大小再算 hash，節省 90%+ 計算量
- 👀 **預覽優先**：預設只顯示，不動檔案
- 🛡️ **安全機制**：跳過 `.git`、`node_modules` 等敏感目錄
- 🎮 **無厘頭旁白**：抓鬼主題讓整理變有趣
- 🏆 **成就系統**：累積驅魔經驗值

---

## 使用範例

### 「我想掃描 Downloads 資料夾」

```bash
./ghost-radar.sh ~/Downloads
```

### 「連子目錄一起掃」

```bash
./ghost-radar.sh ~/Downloads -r
```

### 「只想找重複的圖片」

```bash
./ghost-radar.sh ~/Photos --ext .jpg,.png,.heic -r
```

### 「確定要刪除了！」

```bash
./ghost-radar.sh ~/Downloads -r --yes
```

### 「我想保留最新的檔案，刪舊的」

```bash
./ghost-radar.sh ~/Downloads -r --yes --keep newest
```

### 「輸出 JSON 給其他程式用」

```bash
./ghost-radar.sh ~/Downloads -r --json > duplicates.json
```

---

## CLI 選項

| 選項 | 說明 |
|------|------|
| `-r, --recursive` | 遞迴掃描子目錄 |
| `-e, --ext <副檔名>` | 只檢查特定副檔名，逗號分隔（如 `.jpg,.png`） |
| `-m, --min-size <bytes>` | 最小檔案大小，預設 1 byte |
| `--secure` | 使用 SHA-256（更安全但較慢，預設 MD5） |
| `--hash` | 顯示檔案 hash 值 |
| `-y, --yes` | 執行刪除（預設只預覽） |
| `--keep <策略>` | 保留策略：`oldest`（預設）、`newest`、`shortest` |
| `--json` | 輸出 JSON 格式 |
| `-h, --help` | 顯示說明 |
| `-V, --version` | 顯示版本 |

---

## 保留策略

| 策略 | 說明 |
|------|------|
| `oldest` | 保留最舊的檔案（預設，通常是原始檔） |
| `newest` | 保留最新的檔案 |
| `shortest` | 保留路徑最短的檔案（通常在根目錄附近） |

---

## 技術原理

### 為什麼用 Hash？

傳統找重複檔案靠「檔名比對」，但這會漏掉：
- 改過名的重複檔（`report.pdf` vs `report-backup.pdf`）
- 不同路徑的相同檔案

Hash（雜湊）是檔案的「指紋」：
- 相同內容 → 相同 hash
- 不同內容 → 不同 hash（幾乎不可能碰撞）

### 效能優化

不是每個檔案都要算 hash！我們的策略：

```
1. 掃描所有檔案，記錄大小
2. 依大小分組
3. 大小不同的檔案 → 不可能重複 → 跳過
4. 只對「大小相同」的群組計算 hash
```

這樣可以跳過 90% 以上的 hash 計算！

### MD5 vs SHA-256

| 演算法 | 速度 | 安全性 | 適用場景 |
|--------|------|--------|----------|
| MD5 | 快 | 低（可被刻意碰撞） | 找重複檔（預設） |
| SHA-256 | 慢 | 高 | 需要確認檔案完整性 |

找重複檔案用 MD5 就夠了——我們不是在防駭客，只是在找內容相同的檔案。

---

## 應用場景

| 場景 | 指令 |
|------|------|
| 📸 **照片整理** | `ghost-radar ~/Photos --ext .jpg,.heic -r` |
| 📥 **下載清理** | `ghost-radar ~/Downloads -r` |
| 🎵 **音樂去重** | `ghost-radar ~/Music --ext .mp3,.flac -r` |
| 💻 **專案資源** | `ghost-radar ./src/assets -r` |
| 💾 **備份驗證** | `ghost-radar /backup /original --json` |

---

## 安全機制

- ✅ **預設預覽**：不加 `--yes` 絕對不刪檔案
- ✅ **二次確認**：刪除前需輸入 `yes` 確認
- ✅ **跳過隱藏檔**：`.` 開頭的檔案不處理
- ✅ **跳過敏感目錄**：`node_modules`、`.git`、`dist` 等
- ✅ **錯誤處理**：無法讀取的檔案會跳過並報告

---

## 成就系統

| 成就 | 條件 |
|------|------|
| 🌟 初心捉鬼人 | 發現 1 組以上重複 |
| 🌟 靈異偵探 | 發現 5 組以上重複 |
| 🌟 抓鬼達人 | 發現 10 組以上重複 |
| 🌟 驅魔大師 | 發現 50 組以上重複 |
| 🌟 鬼王剋星 | 發現 100 組以上重複 |
| 💾 空間解放者 | 可釋放超過 1 MB |
| 💾 硬碟救星 | 可釋放超過 100 MB |
| 💾 儲存空間守護神 | 可釋放超過 1 GB |

---

## License

[MIT](LICENSE)
