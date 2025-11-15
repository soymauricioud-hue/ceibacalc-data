@echo off
echo =================================================
echo CeibaCalc Build & Pack Script
echo =================================================
echo.
echo [1/3] Verificando Node.js y npm...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado. Por favor, instalelo desde https://nodejs.org/
    pause
    exit /b 1
)
npm -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no esta instalado. Por favor, reinstale Node.js.
    pause
    exit /b 1
)
echo      Node.js y npm encontrados.
echo.

echo [2/3] Instalando dependencias desde package.json...
npm install
if %errorlevel% neq 0 (
    echo ERROR: La instalacion de dependencias fallo.
    pause
    exit /b 1
)
echo      Dependencias instaladas correctamente.
echo.

echo [3/3] Empaquetando la aplicacion con electron-builder...
npm run dist
if %errorlevel% neq 0 (
    echo ERROR: El empaquetado fallo. Revise los logs de electron-builder.
    pause
    exit /b 1
)
echo.
echo =================================================
echo PROCESO COMPLETADO
echo =================================================
echo El instalador 'CeibaCalc-Setup-1.0.0.exe' se encuentra en la carpeta 'dist'.
echo.
pause
