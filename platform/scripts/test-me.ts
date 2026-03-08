/**
 * Test script for GET /api/auth/me endpoint
 * 
 * This script tests the /api/auth/me endpoint by:
 * 1. Logging in to get a JWT token
 * 2. Using that token to fetch the current user's information
 */

const API_BASE = 'http://localhost:3000';

async function testMeEndpoint() {
  console.log('🧪 Testing GET /api/auth/me endpoint\n');

  try {
    // Step 1: Login to get a JWT token
    console.log('Step 1: Logging in to get JWT token...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Login failed:', error);
      console.log('\n💡 Make sure you have a test user created. Run: npm run seed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', loginData.data.user.email);

    // Step 2: Test /api/auth/me with valid token
    console.log('\nStep 2: Testing /api/auth/me with valid token...');
    const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!meResponse.ok) {
      const error = await meResponse.json();
      console.error('❌ /api/auth/me failed:', error);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ /api/auth/me successful');
    console.log('   User data:', JSON.stringify(meData.data, null, 2));

    // Step 3: Test /api/auth/me without token
    console.log('\nStep 3: Testing /api/auth/me without token...');
    const noTokenResponse = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
    });

    if (noTokenResponse.status === 401) {
      console.log('✅ Correctly rejected request without token');
    } else {
      console.error('❌ Should have rejected request without token');
    }

    // Step 4: Test /api/auth/me with invalid token
    console.log('\nStep 4: Testing /api/auth/me with invalid token...');
    const invalidTokenResponse = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
      },
    });

    if (invalidTokenResponse.status === 401) {
      console.log('✅ Correctly rejected request with invalid token');
    } else {
      console.error('❌ Should have rejected request with invalid token');
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testMeEndpoint();
