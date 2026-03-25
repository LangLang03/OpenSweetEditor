#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build/wasm"

echo "=========================================="
echo "SweetEditor WebAssembly Build"
echo "=========================================="
echo "Project root: $PROJECT_ROOT"
echo "Build directory: $BUILD_DIR"
echo ""

# Check if emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install Emscripten first."
    echo "See: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

echo "Emscripten version:"
emcc --version
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure CMake
echo "Configuring CMake..."
emcmake cmake "$PROJECT_ROOT" \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_TESTING=OFF \
    -DBUILD_SHARED_LIB=OFF \
    -DBUILD_STATIC_LIB=OFF

# Build
echo ""
echo "Building..."
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# Copy output files
OUTPUT_DIR="$SCRIPT_DIR/js/dist"
mkdir -p "$OUTPUT_DIR"

if [ -f "$BUILD_DIR/lib/sweeteditor.js" ]; then
    cp "$BUILD_DIR/lib/sweeteditor.js" "$OUTPUT_DIR/"
    cp "$BUILD_DIR/lib/sweeteditor.wasm" "$OUTPUT_DIR/" 2>/dev/null || true
    echo ""
    echo "=========================================="
    echo "Build complete!"
    echo "=========================================="
    echo "Output files:"
    echo "  $OUTPUT_DIR/sweeteditor.js"
    if [ -f "$BUILD_DIR/lib/sweeteditor.wasm" ]; then
        echo "  $OUTPUT_DIR/sweeteditor.wasm"
    fi
    echo ""
    echo "To run the demo:"
    echo "  cd $SCRIPT_DIR/js && npm run demo"
else
    echo ""
    echo "Error: Build output not found!"
    exit 1
fi
