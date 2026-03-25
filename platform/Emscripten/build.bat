@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo SweetEditor WebAssembly Build (Windows)
echo ==========================================

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..
set BUILD_DIR=%PROJECT_ROOT%\build\wasm

echo Project root: %PROJECT_ROOT%
echo Build directory: %BUILD_DIR%
echo.

where emcc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Emscripten not found. Please install Emscripten first.
    echo See: https://emscripten.org/docs/getting_started/downloads.html
    exit /b 1
)

echo Emscripten version:
emcc --version
echo.

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

echo Configuring CMake...
emcmake cmake "%PROJECT_ROOT%" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_TESTING=OFF ^
    -DBUILD_SHARED_LIB=OFF ^
    -DBUILD_STATIC_LIB=OFF ^
    -G "MinGW Makefiles"

if %ERRORLEVEL% neq 0 (
    echo CMake configuration failed!
    exit /b 1
)

echo.
echo Building...
emmake mingw32-make -j%NUMBER_OF_PROCESSORS%

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b 1
)

set OUTPUT_DIR=%SCRIPT_DIR%js\dist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

if exist "%BUILD_DIR%\lib\sweeteditor.js" (
    copy /Y "%BUILD_DIR%\lib\sweeteditor.js" "%OUTPUT_DIR%\" >nul
    if exist "%BUILD_DIR%\lib\sweeteditor.wasm" (
        copy /Y "%BUILD_DIR%\lib\sweeteditor.wasm" "%OUTPUT_DIR%\" >nul
    )
    
    echo.
    echo ==========================================
    echo Build complete!
    echo ==========================================
    echo Output files:
    echo   %OUTPUT_DIR%\sweeteditor.js
    if exist "%BUILD_DIR%\lib\sweeteditor.wasm" (
        echo   %OUTPUT_DIR%\sweeteditor.wasm
    )
    echo.
    echo To run the demo:
    echo   cd %SCRIPT_DIR%js ^&^& npm run demo
) else (
    echo.
    echo Error: Build output not found!
    exit /b 1
)

endlocal
