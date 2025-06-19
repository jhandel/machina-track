// Test script for the upload endpoints
// Run with: node scripts/test-uploads.js

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'temp_uploads', '2e00c355-5dc9-40a7-b47e-d1718bda876b.png');

async function testSimpleUpload() {
  console.log('\n=== Testing Simple Upload ===');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ Test image not found:', TEST_IMAGE_PATH);
    return;
  }

  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const file = new File([blob], 'test-image.png', { type: 'image/png' });
    
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Simple upload successful');
      console.log('   URL:', result.data.url);
      console.log('   Storage:', result.data.storageType);
      console.log('   Size:', result.data.size, 'bytes');
    } else {
      console.log('❌ Simple upload failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Simple upload error:', error.message);
  }
}

async function testDMSUpload() {
  console.log('\n=== Testing DMS Upload ===');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ Test image not found:', TEST_IMAGE_PATH);
    return;
  }

  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const file = new File([blob], 'test-certificate.png', { type: 'image/png' });
    
    formData.append('file', file);
    formData.append('documentType', 'Test Certificate');
    formData.append('title', 'Test Upload - DMS Integration');
    formData.append('tags', JSON.stringify(['test', 'automation', 'upload']));
    formData.append('customFields', JSON.stringify({
      testId: 'TEST-001',
      uploadDate: new Date().toISOString(),
      automated: true
    }));

    const response = await fetch(`${BASE_URL}/api/dms-upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ DMS upload successful');
      console.log('   URL:', result.data.url);
      console.log('   Storage:', result.data.storageType);
      console.log('   Document ID:', result.data.documentId);
      console.log('   Document Type:', result.data.documentType);
      if (result.warning) {
        console.log('   Warning:', result.warning);
      }
    } else {
      console.log('❌ DMS upload failed:', result.error);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    }
  } catch (error) {
    console.log('❌ DMS upload error:', error.message);
  }
}

async function testInvalidFile() {
  console.log('\n=== Testing Invalid File Upload ===');
  
  try {
    const formData = new FormData();
    const invalidFile = new File(['invalid content'], 'test.exe', { type: 'application/octet-stream' });
    
    formData.append('file', invalidFile);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!result.success) {
      console.log('✅ Invalid file correctly rejected');
      console.log('   Error:', result.error);
    } else {
      console.log('❌ Invalid file was unexpectedly accepted');
    }
  } catch (error) {
    console.log('❌ Invalid file test error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting upload endpoint tests...');
  console.log('Base URL:', BASE_URL);
  
  await testSimpleUpload();
  await testDMSUpload();
  await testInvalidFile();
  
  console.log('\n✨ Tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSimpleUpload, testDMSUpload, testInvalidFile };
