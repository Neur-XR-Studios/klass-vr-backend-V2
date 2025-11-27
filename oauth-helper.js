#!/usr/bin/env node

/**
 * Simple OAuth Authentication Helper
 * Run with: node oauth-helper.js
 */

const readline = require('readline');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Google OAuth Authentication Helper\n');

// Step 1: Get auth URL
console.log('1. Getting authorization URL...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/v1/auth/google/url',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('\n✅ Authorization URL generated!');
        console.log('\n📋 Next Steps:');
        console.log('1. Copy this URL and open in your browser:');
        console.log('\n' + response.data.authUrl + '\n');
        console.log('2. Grant permission to YouTube Data API');
        console.log('3. You\'ll be redirected to: http://localhost:3000/auth/google/callback?code=...');
        console.log('4. Copy the "code" parameter from the URL');
        console.log('5. Run: node oauth-complete.js YOUR_CODE_HERE');
        console.log('\n🔄 Or I can help you complete it automatically...');
        
        rl.question('\nPress Enter to continue with automatic completion...', () => {
          console.log('\n🚀 Starting local server for OAuth callback...');
          console.log('📝 The server will automatically capture your callback code');
          console.log('🌐 Just complete the browser authentication and return here\n');
          
          startCallbackServer();
        });
      } else {
        console.error('❌ Error:', response.message);
        rl.close();
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      rl.close();
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error getting auth URL:', error.message);
  rl.close();
});

req.end();

function startCallbackServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:3000`);
    
    if (url.pathname === '/auth/google/callback') {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>❌ OAuth Error</h1>
          <p>Error: ${error}</p>
          <p>Please try again.</p>
        `);
        console.error('❌ OAuth failed:', error);
        server.close();
        rl.close();
        return;
      }
      
      if (code) {
        console.log('\n✅ Received authorization code!');
        console.log('🔄 Exchanging code for tokens...');
        
        // Make callback to your server
        const callbackOptions = {
          hostname: 'localhost',
          port: 3000,
          path: `/v1/auth/google/callback?code=${code}`,
          method: 'GET'
        };
        
        const callbackReq = http.request(callbackOptions, (callbackRes) => {
          let data = '';
          callbackRes.on('data', (chunk) => data += chunk);
          callbackRes.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.success) {
                console.log('🎉 OAuth Authentication Complete!');
                console.log('✅ You can now download high quality YouTube videos!');
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                  <h1>🎉 Authentication Successful!</h1>
                  <p>You can now download high quality YouTube videos.</p>
                  <p>You can close this window and return to the terminal.</p>
                `);
              } else {
                console.error('❌ Authentication failed:', response.message);
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`
                  <h1>❌ Authentication Failed</h1>
                  <p>Error: ${response.message}</p>
                `);
              }
            } catch (error) {
              console.error('❌ Error parsing callback response:', error.message);
            }
            server.close();
            rl.close();
          });
        });
        
        callbackReq.on('error', (error) => {
          console.error('❌ Error making callback:', error.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>❌ Server Error</h1>');
          server.close();
          rl.close();
        });
        
        callbackReq.end();
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>❌ No authorization code received</h1>');
        server.close();
        rl.close();
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>Not Found</h1>');
    }
  });
  
  server.listen(3001, () => {
    console.log('🌐 Callback server running on http://localhost:3001');
    console.log('📝 Complete the authentication in your browser');
    console.log('⏳ Waiting for callback...\n');
  });
}
