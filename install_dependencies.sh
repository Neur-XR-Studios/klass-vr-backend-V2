#!/bin/bash

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install Node.js and npm (if not already installed)
echo "Installing Node.js and npm..."
sudo apt-get install -y nodejs npm

# Install ffmpeg and python3
echo "Installing ffmpeg and python3..."
sudo apt-get install -y ffmpeg python3 python3-pip

# Install ALL Puppeteer dependencies
echo "Installing Puppeteer dependencies..."
sudo apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2t64 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Fix Node.js visibility for yt-dlp (Symlink NVM node to system path)
echo "Symlinking Node.js for system-wide access..."
current_node=$(which node)
if [ -n "$current_node" ]; then
    sudo ln -sf "$current_node" /usr/bin/node
    sudo ln -sf "$current_node" /usr/local/bin/node
    echo "Linked $current_node to /usr/bin/node"
else
    echo "Warning: Could not find node path to symlink"
fi

# Install Puppeteer Browser explicitly
echo "Installing Puppeteer Chrome browser..."
npx puppeteer browsers install chrome

echo "Installation complete! Please restart your application."
