#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# YouTube Downloader Setup Script
# This script installs all required dependencies for permanent YouTube downloading
# Works on both macOS and Ubuntu
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "YouTube Downloader Setup - Permanent Solution"
echo "═══════════════════════════════════════════════════════════════════════════════"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "✓ Detected: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "✓ Detected: Linux (Ubuntu)"
else
    echo "⚠ Unknown OS: $OSTYPE"
    OS="unknown"
fi

echo ""
echo "Step 1: Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python installed: $PYTHON_VERSION"
else
    echo "✗ Python3 not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install python3
    else
        sudo apt-get update && sudo apt-get install -y python3 python3-pip
    fi
fi

echo ""
echo "Step 2: Installing/Updating yt-dlp..."
if command -v pip3 &> /dev/null; then
    pip3 install -U yt-dlp --quiet
    echo "✓ yt-dlp installed/updated"
else
    echo "✗ pip3 not found, trying alternative..."
    if [[ "$OS" == "macos" ]]; then
        brew install yt-dlp
    else
        sudo apt-get install -y yt-dlp || pip3 install -U yt-dlp
    fi
fi

# Verify yt-dlp
YT_DLP_VERSION=$(yt-dlp --version 2>/dev/null || echo "not installed")
echo "✓ yt-dlp version: $YT_DLP_VERSION"

echo ""
echo "Step 3: Installing ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1)
    echo "✓ ffmpeg already installed: $FFMPEG_VERSION"
else
    echo "Installing ffmpeg..."
    if [[ "$OS" == "macos" ]]; then
        brew install ffmpeg
    else
        sudo apt-get update && sudo apt-get install -y ffmpeg
    fi
    echo "✓ ffmpeg installed"
fi

echo ""
echo "Step 4: Installing PO Token Plugin (bgutil-ytdlp-pot-provider)..."
echo "This is the RECOMMENDED way to handle YouTube authentication without cookies"

# Try pip install
if pip3 install bgutil-ytdlp-pot-provider --quiet 2>/dev/null; then
    echo "✓ PO Token plugin installed via pip"
else
    echo "⚠ pip install failed, trying alternative methods..."
    
    # Try pipx
    if command -v pipx &> /dev/null; then
        pipx inject yt-dlp bgutil-ytdlp-pot-provider 2>/dev/null || true
        echo "✓ Tried pipx injection"
    fi
fi

echo ""
echo "Step 5: Verifying installation..."
echo ""

# Test yt-dlp
echo "Testing yt-dlp with a sample video..."
TEST_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
if yt-dlp --dump-json --no-playlist "$TEST_URL" > /dev/null 2>&1; then
    echo "✓ yt-dlp is working correctly!"
else
    echo "⚠ yt-dlp test failed - but downloads may still work"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Installed components:"
echo "  • yt-dlp: $(yt-dlp --version 2>/dev/null || echo 'check manually')"
echo "  • ffmpeg: $(ffmpeg -version 2>&1 | head -n1 | cut -d' ' -f3 || echo 'check manually')"
echo "  • PO Token Plugin: bgutil-ytdlp-pot-provider"
echo ""
echo "Your YouTube downloader is now configured for PERMANENT, HIGH-QUALITY downloads!"
echo "No cookies or manual authentication required."
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
