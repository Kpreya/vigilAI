/**
 * Manual test script for the dashboard stats endpoint
 * Run with: npx tsx scripts/test-dashboard-stats.ts
 */

async function testDashboardStats() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing GET /api/dashboard/stats endpoint\n');

  // First, login to get a token
  console.log('Step 1: Login to get authentication token');
  let token: string | null = null;
  
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      token = loginData.data.token;
      console.log('✅ Login successful');
      console.log('   Token:', token.substring(0, 20) + '...\n');
    } else {
      console.log('❌ Login failed:', loginData.error);
      console.log('   Make sure the dev server is running and the database is seeded\n');
      return;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error);
    console.log('   Make sure the dev server is running at', baseUrl, '\n');
    return;
  }

  console.log('---\n');

  // Test 1: Get dashboard stats with valid token
  console.log('Test 1: Get dashboard stats with valid token');
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('   Stats:');
      console.log('   - Total Incidents:', data.data.totalIncidents);
      console.log('   - Total Applications:', data.data.totalApplications);
      console.log('   - Total API Keys:', data.data.totalApiKeys);
      console.log('   - Open Incidents:', data.data.openIncidents);
      console.log('   - Acknowledged Incidents:', data.data.acknowledgedIncidents);
      console.log('   - Resolved Incidents:', data.data.resolvedIncidents);
      console.log('   - Average MTTR:', data.data.averageMTTR, 'minutes');
    } else {
      console.log('❌ Failed:', response.status);
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 2: Get dashboard stats without token
  console.log('Test 2: Get dashboard stats without token');
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected with 401');
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 3: Get dashboard stats with invalid token
  console.log('Test 3: Get dashboard stats with invalid token');
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
      },
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected with 401');
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 4: Get dashboard stats with malformed Authorization header
  console.log('Test 4: Get dashboard stats with malformed Authorization header');
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': 'InvalidFormat',
      },
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected with 401');
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n✅ All tests completed!\n');
}

testDashboardStats().catch(console.error);
