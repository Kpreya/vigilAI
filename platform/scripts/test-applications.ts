/**
 * Test script for applications endpoints
 * 
 * This script tests:
 * - GET /api/applications - Get all applications
 * - POST /api/applications - Create new application
 */

const API_BASE = 'http://localhost:3000';

// Test user credentials (from seed data)
const TEST_EMAIL = 'alice@example.com';
const TEST_PASSWORD = 'password123';

async function login(): Promise<string> {
  console.log('🔐 Logging in...');
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${error.error}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.data.token;
}

async function getApplications(token: string): Promise<void> {
  console.log('\n📋 Testing GET /api/applications...');
  const response = await fetch(`${API_BASE}/api/applications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Get applications failed: ${error.error}`);
  }

  const data = await response.json();
  console.log('✅ Get applications successful');
  console.log(`   Found ${data.data.length} applications`);
  
  if (data.data.length > 0) {
    console.log('   First application:', {
      id: data.data[0].id,
      name: data.data[0].name,
      description: data.data[0].description,
    });
  }
}

async function createApplication(token: string): Promise<void> {
  console.log('\n➕ Testing POST /api/applications...');
  
  const newApp = {
    name: 'Test Application',
    description: 'A test application created by the test script',
    githubRepo: 'test-repo',
    githubOwner: 'test-owner',
    anomalyThreshold: 2.5,
    enableAutoFix: true,
    enableNotifications: true,
  };

  const response = await fetch(`${API_BASE}/api/applications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newApp),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create application failed: ${error.error}`);
  }

  const data = await response.json();
  console.log('✅ Create application successful');
  console.log('   Created application:', {
    id: data.data.id,
    name: data.data.name,
    description: data.data.description,
    githubRepo: data.data.githubRepo,
    githubOwner: data.data.githubOwner,
    anomalyThreshold: data.data.anomalyThreshold,
  });
}

async function testInvalidData(token: string): Promise<void> {
  console.log('\n❌ Testing POST /api/applications with invalid data...');
  
  // Test with missing name
  const response = await fetch(`${API_BASE}/api/applications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Missing name',
    }),
  });

  if (response.status === 400) {
    const error = await response.json();
    console.log('✅ Validation working correctly');
    console.log(`   Error: ${error.error}`);
  } else {
    throw new Error('Expected 400 status for invalid data');
  }
}

async function testUnauthorized(): Promise<void> {
  console.log('\n🔒 Testing unauthorized access...');
  
  const response = await fetch(`${API_BASE}/api/applications`);

  if (response.status === 401) {
    console.log('✅ Unauthorized access blocked correctly');
  } else {
    throw new Error('Expected 401 status for unauthorized access');
  }
}

async function main() {
  try {
    console.log('🚀 Starting applications endpoints tests\n');
    console.log('=' .repeat(50));

    // Test unauthorized access
    await testUnauthorized();

    // Login to get token
    const token = await login();

    // Test GET /api/applications
    await getApplications(token);

    // Test POST /api/applications
    await createApplication(token);

    // Test GET again to see the new application
    await getApplications(token);

    // Test validation
    await testInvalidData(token);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
