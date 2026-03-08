/**
 * Test script for GET /api/incidents endpoint
 * 
 * This script tests the incidents endpoint with various query parameters
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

async function testIncidentsEndpoint() {
  const results: TestResult[] = [];

  // First, login to get a token
  console.log('🔐 Logging in to get authentication token...\n');
  
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'alice@example.com',
      password: 'password123',
    }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed. Make sure you have a test user created.');
    console.error('Response:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.data.token;
  console.log('✅ Login successful\n');

  // Test 1: Get incidents without filters
  console.log('Test 1: Get incidents without filters');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incidents without filters',
        success: true,
        message: `Retrieved ${data.data.length} incidents`,
        data: {
          totalCount: data.pagination.totalCount,
          page: data.pagination.page,
          pageSize: data.pagination.pageSize,
        },
      });
      console.log(`✅ Success: Retrieved ${data.data.length} incidents`);
      console.log(`   Total count: ${data.pagination.totalCount}`);
      console.log(`   Page: ${data.pagination.page}/${data.pagination.totalPages}\n`);
    } else {
      results.push({
        name: 'Get incidents without filters',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incidents without filters',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 2: Get incidents with pagination
  console.log('Test 2: Get incidents with pagination (page 1, pageSize 5)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents?page=1&pageSize=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incidents with pagination',
        success: true,
        message: `Retrieved ${data.data.length} incidents`,
      });
      console.log(`✅ Success: Retrieved ${data.data.length} incidents`);
      console.log(`   Page size: ${data.pagination.pageSize}\n`);
    } else {
      results.push({
        name: 'Get incidents with pagination',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incidents with pagination',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 3: Get incidents filtered by status
  console.log('Test 3: Get incidents filtered by status (OPEN)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents?status=OPEN`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incidents filtered by status',
        success: true,
        message: `Retrieved ${data.data.length} OPEN incidents`,
      });
      console.log(`✅ Success: Retrieved ${data.data.length} OPEN incidents\n`);
    } else {
      results.push({
        name: 'Get incidents filtered by status',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incidents filtered by status',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 4: Get incidents filtered by severity
  console.log('Test 4: Get incidents filtered by severity (CRITICAL)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents?severity=CRITICAL`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incidents filtered by severity',
        success: true,
        message: `Retrieved ${data.data.length} CRITICAL incidents`,
      });
      console.log(`✅ Success: Retrieved ${data.data.length} CRITICAL incidents\n`);
    } else {
      results.push({
        name: 'Get incidents filtered by severity',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incidents filtered by severity',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 5: Get incidents with multiple filters
  console.log('Test 5: Get incidents with multiple filters (status=OPEN, severity=HIGH)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents?status=OPEN&severity=HIGH`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incidents with multiple filters',
        success: true,
        message: `Retrieved ${data.data.length} OPEN HIGH incidents`,
      });
      console.log(`✅ Success: Retrieved ${data.data.length} OPEN HIGH incidents\n`);
    } else {
      results.push({
        name: 'Get incidents with multiple filters',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incidents with multiple filters',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 6: Test without authentication (should fail)
  console.log('Test 6: Test without authentication (should fail with 401)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents`);
    const data = await response.json();
    
    if (response.status === 401) {
      results.push({
        name: 'Test without authentication',
        success: true,
        message: 'Correctly returned 401 Unauthorized',
      });
      console.log(`✅ Success: Correctly returned 401 Unauthorized\n`);
    } else {
      results.push({
        name: 'Test without authentication',
        success: false,
        message: 'Should have returned 401 but got ' + response.status,
      });
      console.log(`❌ Failed: Should have returned 401 but got ${response.status}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Test without authentication',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 7: Test with invalid status parameter
  console.log('Test 7: Test with invalid status parameter (should fail with 400)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents?status=INVALID`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    
    if (response.status === 400) {
      results.push({
        name: 'Test with invalid status',
        success: true,
        message: 'Correctly returned 400 Bad Request',
      });
      console.log(`✅ Success: Correctly returned 400 Bad Request\n`);
    } else {
      results.push({
        name: 'Test with invalid status',
        success: false,
        message: 'Should have returned 400 but got ' + response.status,
      });
      console.log(`❌ Failed: Should have returned 400 but got ${response.status}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Test with invalid status',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
  }
}

// Run the tests
console.log('🚀 Starting GET /api/incidents endpoint tests...\n');
testIncidentsEndpoint().catch(console.error);
