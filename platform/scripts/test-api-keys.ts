/**
 * Test script for API keys endpoints
 * 
 * This script tests:
 * - GET /api/api-keys - List all API keys
 * - POST /api/api-keys - Create new API key
 * - DELETE /api/api-keys/:id - Revoke API key
 */

const API_KEYS_BASE_URL = 'http://localhost:3000';

// Test user credentials (from seed data)
const API_KEYS_TEST_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

let authToken: string = '';
let testApiKeyId: string = '';

/**
 * Login and get JWT token
 */
async function login() {
  console.log('\n🔐 Logging in...');
  
  const response = await fetch(`${API_KEYS_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(API_KEYS_TEST_USER),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  authToken = data.data.token;
  console.log('✅ Login successful');
  console.log(`   Token: ${authToken.substring(0, 20)}...`);
}

/**
 * Test GET /api/api-keys
 */
async function testGetApiKeys() {
  console.log('\n📋 Testing GET /api/api-keys...');
  
  const response = await fetch(`${API_KEYS_BASE_URL}/api/api-keys`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GET /api/api-keys failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  console.log('✅ GET /api/api-keys successful');
  console.log(`   Found ${data.data.length} API keys`);
  
  if (data.data.length > 0) {
    const key = data.data[0];
    console.log(`   First key: ${key.name} (${key.keyPrefix}...)`);
    console.log(`   Application: ${key.application?.name || 'None'}`);
    console.log(`   Revoked: ${key.revokedAt ? 'Yes' : 'No'}`);
  }
}

/**
 * Test POST /api/api-keys
 */
async function testCreateApiKey() {
  console.log('\n➕ Testing POST /api/api-keys...');
  
  const keyData = {
    name: 'Test API Key',
    applicationId: null,
    expiresAt: null,
  };

  const response = await fetch(`${API_KEYS_BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(keyData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`POST /api/api-keys failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  testApiKeyId = data.data.id;
  
  console.log('✅ POST /api/api-keys successful');
  console.log(`   Key ID: ${data.data.id}`);
  console.log(`   Key Name: ${data.data.name}`);
  console.log(`   Key Prefix: ${data.data.keyPrefix}`);
  console.log(`   Full Key: ${data.data.key.substring(0, 20)}...`);
  console.log(`   Message: ${data.message}`);
}

/**
 * Test POST /api/api-keys with validation errors
 */
async function testCreateApiKeyValidation() {
  console.log('\n❌ Testing POST /api/api-keys validation...');
  
  // Test missing name
  const response1 = await fetch(`${API_KEYS_BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (response1.status !== 400) {
    throw new Error('Expected 400 for missing name');
  }
  console.log('✅ Validation: Missing name rejected');

  // Test invalid expiration date
  const response2 = await fetch(`${API_KEYS_BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test Key',
      expiresAt: '2020-01-01T00:00:00Z', // Past date
    }),
  });

  if (response2.status !== 400) {
    throw new Error('Expected 400 for past expiration date');
  }
  console.log('✅ Validation: Past expiration date rejected');
}

/**
 * Test DELETE /api/api-keys/:id
 */
async function testRevokeApiKey() {
  console.log('\n🗑️  Testing DELETE /api/api-keys/:id...');
  
  const response = await fetch(`${API_KEYS_BASE_URL}/api/api-keys/${testApiKeyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DELETE /api/api-keys/:id failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  console.log('✅ DELETE /api/api-keys/:id successful');
  console.log(`   Key ID: ${data.data.id}`);
  console.log(`   Revoked At: ${data.data.revokedAt}`);
  console.log(`   Message: ${data.message}`);
}

/**
 * Test DELETE /api/api-keys/:id with already revoked key
 */
async function testRevokeAlreadyRevokedKey() {
  console.log('\n❌ Testing DELETE /api/api-keys/:id (already revoked)...');
  
  const response = await fetch(`${API_KEYS_BASE_URL}/api/api-keys/${testApiKeyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (response.status !== 400) {
    throw new Error('Expected 400 for already revoked key');
  }
  
  const data = await response.json();
  console.log('✅ Already revoked key rejected');
  console.log(`   Error: ${data.error}`);
}

/**
 * Test unauthorized access
 */
async function testUnauthorized() {
  console.log('\n🔒 Testing unauthorized access...');
  
  const response = await fetch(`${API_KEYS_BASE_URL}/api/api-keys`, {
    method: 'GET',
  });

  if (response.status !== 401) {
    throw new Error('Expected 401 for unauthorized access');
  }
  console.log('✅ Unauthorized access rejected');
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('🚀 Starting API Keys Endpoints Tests');
    console.log('=====================================');

    await testUnauthorized();
    await login();
    await testGetApiKeys();
    await testCreateApiKeyValidation();
    await testCreateApiKey();
    await testGetApiKeys(); // Check the new key appears
    await testRevokeApiKey();
    await testRevokeAlreadyRevokedKey();

    console.log('\n=====================================');
    console.log('✅ All tests passed!');
    console.log('=====================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
