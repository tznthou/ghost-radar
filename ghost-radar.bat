@echo off
setlocal enabledelayedexpansion

REM Ghost Radar - 重複檔案抓鬼雷達
REM 快速執行腳本 (Windows)

set SCRIPT_DIR=%~dp0

REM 檢查 Node.js 是否安裝
where node >nul 2>nul
if errorlevel 1 (
    echo [錯誤] 找不到 Node.js！
    echo.
    echo 請先安裝 Node.js:
    echo   https://nodejs.org
    echo.
    exit /b 1
)

REM 自動安裝依賴
if not exist "%SCRIPT_DIR%node_modules" (
    echo [安裝] 首次執行，安裝依賴中...
    npm install --prefix "%SCRIPT_DIR%" --silent
    echo [完成] 依賴安裝完成！
    echo.
)

REM 執行主程式，傳遞所有參數
node "%SCRIPT_DIR%bin\ghost-radar.js" %*
