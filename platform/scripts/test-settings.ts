/**
 * Test script for settings endpoints
 * 
 * This script tests:
 * - GET /api/settings/profile
 * - PATCH /api/settings/profile
 * - GET /api/settings/notifications
 * - PATCH /api/settings/notifications
 */

const API_BASE = 'http://localhost:3000';

// Test user credentials (should exist in database)
const TEST_EMAIL = 'alice@example.com';
const TEST_PASSWORD = 'password123';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

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
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.data.token;
}

async function testGetProfile(token: string): Promise<void> {
  console.log('\n📋 Testing GET /api/settings/profile...');
  try {
    const response = await fetch(`${API_BASE}/api/settings/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.id || !data.data.email) {
      throw new Error('Invalid response structure');
    }

    console.log('✅ GET /api/settings/profile passed');
    console.log('   Profile:', data.data);
    results.push({ name: 'GET /api/settings/profile', passed: true });
  } catch (error) {
    console.error('❌ GET /api/settings/profile failed:', error);
    results.push({ 
      name: 'GET /api/settings/profile', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function testUpdateProfile(token: string): Promise<void> {
  console.log('\n📝 Testing PATCH /api/settings/profile...');
  try {
    const newName = `Test User ${Date.now()}`;
    const response = await fetch(`${API_BASE}/api/settings/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.name !== newName) {
      throw new Error('Profile not updated correctly');
    }

    console.log('✅ PATCH /api/settings/profile passed');
    console.log('   Updated profile:', data.data);
    results.push({ name: 'PATCH /api/settings/profile', passed: true });
  } catch (error) {
    console.error('❌ PATCH /api/settings/profile failed:', error);
    results.push({ 
      name: 'PATCH /api/settings/profile', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function testGetNotifications(token: string): Promise<void> {
  console.log('\n🔔 Testing GET /api/settings/notifications...');
  try {
    const response = await fetch(`${API_BASE}/api/settings/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || typeof data.data.emailEnabled !== 'boolean') {
      throw new Error('Invalid response structure');
    }

    console.log('✅ GET /api/settings/notifications passed');
    console.log('   Preferences:', data.data);
    results.push({ name: 'GET /api/settings/notifications', passed: true });
  } catch (error) {
    console.error('❌ GET /api/settings/notifications failed:', error);
    results.push({ 
      name: 'GET /api/settings/notifications', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function testUpdateNotifications(token: string): Promise<void> {
  console.log('\n🔔 Testing PATCH /api/settings/notifications...');
  try {
    const response = await fetch(`${API_BASE}/api/settings/notifications`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailEnabled: true,
        emailCritical: true,
        emailHigh: false,
        emailMedium: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.emailHigh !== false || data.data.emailMedium !== true) {
      throw new Error('Preferences not updated correctly');
    }

    console.log('✅ PATCH /api/settings/notifications passed');
    console.log('   Updated preferences:', data.data);
    results.push({ name: 'PATCH /api/settings/notifications', passed: true });
  } catch (error) {
    console.error('❌ PATCH /api/settings/notifications failed:', error);
    results.push({ 
      name: 'PATCH /api/settings/notifications', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function runTests() {
  console.log('🚀 Starting settings endpoints tests...\n');
  console.log('=' .repeat(60));

  try {
    // Login to get token
    const token = await login();

    // Run all tests
    await testGetProfile(token);
    await testUpdateProfile(token);
    await testGetNotifications(token);
    await testUpdateNotifications(token);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
