#!/usr/bin/env node

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testUserAPI() {
  const baseUrl = 'http://localhost:9002';
  
  try {
    console.log('Testing Users API...');
    
    // Test GET /api/users
    console.log('\n1. Testing GET /api/users');
    const usersResponse = await makeRequest(`${baseUrl}/api/users`);
    console.log('Status:', usersResponse.status);
    console.log('Response:', JSON.stringify(usersResponse.data, null, 2));
    
    if (usersResponse.data.success && usersResponse.data.data.length > 0) {
      const userId = usersResponse.data.data[0].id;
      
      // Test GET /api/users/[id]
      console.log(`\n2. Testing GET /api/users/${userId}`);
      const userResponse = await makeRequest(`${baseUrl}/api/users/${userId}`);
      console.log('Status:', userResponse.status);
      console.log('Response:', JSON.stringify(userResponse.data, null, 2));
    }
    
    console.log('\n✅ User API test completed successfully!');
    
  } catch (error) {
    console.error('❌ User API test failed:', error);
  }
}

testUserAPI();
