#!/bin/bash

# Ghost Radar - 重複檔案抓鬼雷達
# 快速執行腳本 (macOS/Linux)

set -e

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo -e "${RED}錯誤: 找不到 Node.js！${NC}"
    echo ""
    echo "請先安裝 Node.js:"
    echo "  - macOS: brew install node"
    echo "  - 或到 https://nodejs.org 下載"
    echo ""
    exit 1
fi

# 檢查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}警告: Node.js 版本過低 (需要 v16+)${NC}"
    echo "目前版本: $(node -v)"
    echo ""
fi

# 自動安裝依賴
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo -e "${CYAN}首次執行，安裝依賴中...${NC}"
    npm install --prefix "$SCRIPT_DIR" --silent
    echo -e "${GREEN}依賴安裝完成！${NC}"
    echo ""
fi

# 執行主程式，傳遞所有參數
node "$SCRIPT_DIR/bin/ghost-radar.js" "$@"
