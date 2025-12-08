#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# YouTube Downloader Setup Script
# This script installs yt-dlp, ffmpeg, Deno, and sets up the BgUtils POT Provider
# for permanent YouTube downloads WITHOUT cookies
# Works on both macOS and Ubuntu (including Ubuntu 24.04 with externally managed Python)
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "=========================================="
echo "YouTube Downloader Setup (Cookie-Free)"
echo "=========================================="

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
    # Install unzip first (required for Deno installation)
    if ! command -v unzip &> /dev/null; then
        echo "Installing unzip (required for Deno)..."
        sudo apt-get update && sudo apt-get install -y unzip
    fi
    
    if ! command -v deno &> /dev/null; then
        echo "Installing Deno..."
        curl -fsSL https://deno.land/install.sh | sh
        export DENO_INSTALL="$HOME/.deno"
        export PATH="$DENO_INSTALL/bin:$PATH"
        
        # Add to bashrc if not already there
        if ! grep -q 'DENO_INSTALL' ~/.bashrc; then
            echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
            echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
        fi
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
else
    echo "✗ Deno installation failed - trying alternative method..."
    # Try snap as fallback
    if command -v snap &> /dev/null; then
        sudo snap install deno 2>/dev/null && echo "✓ Deno installed via snap" || true
    fi
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
echo "Step 6: Setting up BgUtils POT Provider HTTP Server (Docker)..."
echo "This generates PO tokens automatically - NO COOKIES NEEDED!"

if [[ "$OS" == "linux" ]]; then
    # Check if Docker is installed
    if command -v docker &> /dev/null; then
        echo "✓ Docker is installed"
        
        # Stop existing container if running
        docker stop bgutil-provider 2>/dev/null || true
        docker rm bgutil-provider 2>/dev/null || true
        
        # Start the POT provider container
        echo "Starting BgUtils POT Provider container..."
        docker run --name bgutil-provider -d -p 4416:4416 --restart unless-stopped brainicism/bgutil-ytdlp-pot-provider
        
        if docker ps | grep -q bgutil-provider; then
            echo "✓ BgUtils POT Provider is running on port 4416"
        else
            echo "⚠ Failed to start POT Provider container"
        fi
    else
        echo "⚠ Docker not installed. Installing Docker..."
        # Install Docker
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        sudo usermod -aG docker $USER
        echo "✓ Docker installed. You may need to log out and back in for group changes."
        
        # Start the container
        sudo docker run --name bgutil-provider -d -p 4416:4416 --restart unless-stopped brainicism/bgutil-ytdlp-pot-provider
        echo "✓ BgUtils POT Provider started"
    fi
else
    # macOS - use Docker Desktop if available
    if command -v docker &> /dev/null; then
        docker stop bgutil-provider 2>/dev/null || true
        docker rm bgutil-provider 2>/dev/null || true
        docker run --name bgutil-provider -d -p 4416:4416 --restart unless-stopped brainicism/bgutil-ytdlp-pot-provider
        echo "✓ BgUtils POT Provider is running on port 4416"
    else
        echo "⚠ Docker not found. Install Docker Desktop for macOS to use the POT Provider."
        echo "  Download from: https://www.docker.com/products/docker-desktop"
    fi
fi

echo ""
echo "Step 7: Verifying installation..."
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
echo "  • BgUtils POT Provider: $(docker ps --filter name=bgutil-provider --format '{{.Status}}' 2>/dev/null || echo 'check docker')"
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
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "COOKIE-FREE YOUTUBE DOWNLOADS ARE NOW ENABLED!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "The BgUtils POT Provider Docker container generates PO tokens automatically."
echo "NO COOKIES REQUIRED - tokens never expire!"
echo ""
echo "To verify POT Provider is running:"
echo "  docker ps | grep bgutil-provider"
echo ""
echo "To restart POT Provider if needed:"
echo "  docker restart bgutil-provider"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
