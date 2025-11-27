#!/usr/bin/env node

// Simple JavaScript runtime for yt-dlp
console.log('JavaScript runtime is working');

// Process yt-dlp JavaScript code if provided
if (process.argv.length > 2) {
  try {
    const code = process.argv[2];
    const result = eval(code);
    if (result !== undefined) {
      console.log(JSON.stringify(result));
    }
  } catch (error) {
    console.error('JavaScript execution error:', error.message);
    process.exit(1);
  }
}
