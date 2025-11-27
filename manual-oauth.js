#!/usr/bin/env node

/**
 * Manual OAuth Test
 */

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Manual OAuth Authentication\n');

rl.question('Please enter the authorization code from the callback URL: ', (code) => {
  if (!code) {
    console.log('❌ No code provided');
    rl.close();
    return;
  }
  
  console.log(`🔄 Testing with code: ${code.substring(0, 20)}...`);
  
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/v1/auth/google/callback?code=${encodeURIComponent(code)}`,
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('📥 Response:', data);
      try {
        const response = JSON.parse(data);
        if (response.success) {
          console.log('🎉 Authentication successful!');
          console.log('✅ You can now download high quality videos!');
        } else {
          console.log('❌ Authentication failed:', response.message);
          console.log('💡 Make sure you copied the full code correctly');
        }
      } catch (error) {
        console.log('❌ Error parsing response:', error.message);
      }
      rl.close();
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    rl.close();
  });
  
  req.end();
});

console.log('\n📋 Instructions:');
console.log('1. Open this URL in browser:');
console.log('https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutubepartner&prompt=consent&response_type=code&client_id=270085625492-sfkq0d31hfdn8fiomgvh8v727vb27c19.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback');
console.log('2. Grant permission');
console.log('3. Copy the code from the callback URL');
console.log('4. Paste it below\n');
