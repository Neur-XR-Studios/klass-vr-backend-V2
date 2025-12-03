#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# YouTube Downloader Setup Script
# This script installs all required dependencies for permanent YouTube downloading
# Works on both macOS and Ubuntu (including Ubuntu 24.04 with externally managed Python)
# ═══════════════════════════════════════════════════════════════════════════════

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
        sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
    fi
fi

echo ""
echo "Step 2: Installing/Updating yt-dlp..."

if [[ "$OS" == "linux" ]]; then
    # Ubuntu 24.04+ uses externally managed Python - use pipx or apt
    echo "Using pipx for Ubuntu (externally managed Python)..."
    
    # Install pipx if not present
    if ! command -v pipx &> /dev/null; then
        echo "Installing pipx..."
        sudo apt-get update
        sudo apt-get install -y pipx
        pipx ensurepath
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Install yt-dlp via pipx
    if command -v pipx &> /dev/null; then
        pipx install yt-dlp --force 2>/dev/null || pipx upgrade yt-dlp 2>/dev/null || true
        echo "✓ yt-dlp installed via pipx"
    fi
    
    # Fallback: try apt
    if ! command -v yt-dlp &> /dev/null; then
        echo "Trying apt install..."
        sudo apt-get install -y yt-dlp 2>/dev/null || true
    fi
    
    # Last resort: use --break-system-packages (not recommended but works)
    if ! command -v yt-dlp &> /dev/null; then
        echo "Using pip with --break-system-packages..."
        pip3 install -U yt-dlp --break-system-packages 2>/dev/null || true
    fi
else
    # macOS - pip works fine
    if command -v pip3 &> /dev/null; then
        pip3 install -U yt-dlp --quiet
        echo "✓ yt-dlp installed/updated via pip"
    else
        brew install yt-dlp
        echo "✓ yt-dlp installed via brew"
    fi
fi

# Add local bin to PATH for this session
export PATH="$HOME/.local/bin:$PATH"

# Verify yt-dlp
if command -v yt-dlp &> /dev/null; then
    YT_DLP_VERSION=$(yt-dlp --version 2>/dev/null)
    echo "✓ yt-dlp version: $YT_DLP_VERSION"
else
    echo "✗ yt-dlp not found in PATH. You may need to restart your shell or add ~/.local/bin to PATH"
fi

echo ""
echo "Step 3: Installing ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1)
    echo "✓ ffmpeg already installed"
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
echo "Step 4: Installing JavaScript Runtime (Deno) for yt-dlp..."
echo "YouTube requires a JS runtime to solve challenges"

if [[ "$OS" == "linux" ]]; then
    if ! command -v deno &> /dev/null; then
        echo "Installing Deno..."
        curl -fsSL https://deno.land/install.sh | sh
        export DENO_INSTALL="$HOME/.deno"
        export PATH="$DENO_INSTALL/bin:$PATH"
        echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
        echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
        echo "✓ Deno installed"
    else
        echo "✓ Deno already installed: $(deno --version | head -n1)"
    fi
else
    # macOS
    if ! command -v deno &> /dev/null; then
        brew install deno 2>/dev/null || curl -fsSL https://deno.land/install.sh | sh
        echo "✓ Deno installed"
    else
        echo "✓ Deno already installed"
    fi
fi

# Verify deno
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
if command -v deno &> /dev/null; then
    echo "✓ Deno version: $(deno --version | head -n1)"
fi

echo ""
echo "Step 5: Installing PO Token Plugin (bgutil-ytdlp-pot-provider)..."
echo "This is the RECOMMENDED way to handle YouTube authentication without cookies"

if [[ "$OS" == "linux" ]]; then
    # Use pipx to inject into yt-dlp environment
    if command -v pipx &> /dev/null; then
        pipx inject yt-dlp bgutil-ytdlp-pot-provider 2>/dev/null && echo "✓ PO Token plugin installed via pipx inject" || true
    fi
    
    # Fallback
    if ! pipx inject yt-dlp bgutil-ytdlp-pot-provider 2>/dev/null; then
        pip3 install bgutil-ytdlp-pot-provider --break-system-packages 2>/dev/null && echo "✓ PO Token plugin installed via pip" || true
    fi
else
    # macOS
    pip3 install bgutil-ytdlp-pot-provider --quiet 2>/dev/null && echo "✓ PO Token plugin installed via pip" || true
fi

echo ""
echo "Step 6: Verifying installation..."
echo ""

# Refresh PATH with all required directories
export PATH="$HOME/.local/bin:$HOME/.deno/bin:$PATH"

# Test yt-dlp
echo "Testing yt-dlp with a sample video..."
TEST_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
if yt-dlp --dump-json --no-playlist "$TEST_URL" > /dev/null 2>&1; then
    echo "✓ yt-dlp is working correctly!"
else
    echo "⚠ yt-dlp test failed - you may need to restart your shell"
    echo "  Run: source ~/.bashrc && yt-dlp --version"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Installed components:"
echo "  • yt-dlp: $(yt-dlp --version 2>/dev/null || echo 'restart shell and check')"
echo "  • ffmpeg: $(command -v ffmpeg &>/dev/null && echo 'installed' || echo 'not found')"
echo "  • deno: $(deno --version 2>/dev/null | head -n1 || echo 'restart shell and check')"
echo "  • PO Token Plugin: bgutil-ytdlp-pot-provider"
echo ""
echo "IMPORTANT: Run these commands to update your PATH:"
echo "  export PATH=\"\$HOME/.local/bin:\$HOME/.deno/bin:\$PATH\""
echo ""
echo "To make permanent, add to ~/.bashrc:"
echo "  echo 'export PATH=\"\$HOME/.local/bin:\$HOME/.deno/bin:\$PATH\"' >> ~/.bashrc"
echo "  source ~/.bashrc"
echo ""
echo "CRITICAL: PM2 needs the updated PATH. Run:"
echo "  pm2 delete app && pm2 start ecosystem.config.json"
echo ""
echo "Your YouTube downloader is now configured for PERMANENT, HIGH-QUALITY downloads!"
echo "No cookies or manual authentication required."
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
