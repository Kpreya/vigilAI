/**
 * Test script for PATCH /api/incidents/:id/status endpoint
 * 
 * This script tests the incident status update endpoint
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

async function testIncidentStatusEndpoint() {
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

  // Get list of incidents to find a valid ID
  console.log('📋 Fetching incidents list to get a valid incident ID...\n');
  const incidentsResponse = await fetch(`${BASE_URL}/api/incidents?pageSize=1`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!incidentsResponse.ok) {
    console.error('❌ Failed to fetch incidents list');
    return;
  }

  const incidentsData = await incidentsResponse.json();
  
  if (incidentsData.data.length === 0) {
    console.log('⚠️  No incidents found. Please create some test data first.');
    return;
  }

  const testIncidentId = incidentsData.data[0].id;
  const originalStatus = incidentsData.data[0].status;
  console.log(`✅ Found test incident ID: ${testIncidentId}`);
  console.log(`   Original status: ${originalStatus}\n`);

  // Test 1: Update incident status to IN_PROGRESS
  console.log('Test 1: Update incident status to IN_PROGRESS');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.data.status === 'IN_PROGRESS') {
      results.push({
        name: 'Update status to IN_PROGRESS',
        success: true,
        message: 'Status updated successfully',
        data: {
          id: data.data.id,
          status: data.data.status,
          resolvedAt: data.data.resolvedAt,
        },
      });
      console.log(`✅ Success: Status updated to IN_PROGRESS`);
      console.log(`   Incident ID: ${data.data.id}`);
      console.log(`   New Status: ${data.data.status}`);
      console.log(`   Resolved At: ${data.data.resolvedAt || 'null'}\n`);
    } else {
      results.push({
        name: 'Update status to IN_PROGRESS',
        success: false,
        message: data.error || 'Status not updated correctly',
      });
      console.log(`❌ Failed: ${data.error || 'Status not updated correctly'}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Update status to IN_PROGRESS',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 2: Update incident status to RESOLVED (should set resolvedAt)
  console.log('Test 2: Update incident status to RESOLVED (should set resolvedAt)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'RESOLVED',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.data.status === 'RESOLVED' && data.data.resolvedAt) {
      results.push({
        name: 'Update status to RESOLVED',
        success: true,
        message: 'Status updated and resolvedAt set',
        data: {
          id: data.data.id,
          status: data.data.status,
          resolvedAt: data.data.resolvedAt,
        },
      });
      console.log(`✅ Success: Status updated to RESOLVED`);
      console.log(`   Incident ID: ${data.data.id}`);
      console.log(`   New Status: ${data.data.status}`);
      console.log(`   Resolved At: ${data.data.resolvedAt}\n`);
    } else {
      results.push({
        name: 'Update status to RESOLVED',
        success: false,
        message: data.error || 'Status not updated correctly or resolvedAt not set',
      });
      console.log(`❌ Failed: ${data.error || 'Status not updated correctly or resolvedAt not set'}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Update status to RESOLVED',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 3: Update with invalid status (should fail with 400)
  console.log('Test 3: Update with invalid status (should fail with 400)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'INVALID_STATUS',
      }),
    });

    const data = await response.json();
    
    if (response.status === 400) {
      results.push({
        name: 'Test with invalid status',
        success: true,
        message: 'Correctly returned 400 Bad Request',
      });
      console.log(`✅ Success: Correctly returned 400 Bad Request`);
      console.log(`   Error: ${data.error}\n`);
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

  // Test 4: Update without authentication (should fail with 401)
  console.log('Test 4: Update without authentication (should fail with 401)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'OPEN',
      }),
    });

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

  // Test 5: Update with non-existent incident ID (should fail with 404)
  console.log('Test 5: Update with non-existent incident ID (should fail with 404)');
  try {
    const fakeId = 'clxxxxxxxxxxxxxxxxxx';
    const response = await fetch(`${BASE_URL}/api/incidents/${fakeId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'OPEN',
      }),
    });

    const data = await response.json();
    
    if (response.status === 404) {
      results.push({
        name: 'Test with non-existent ID',
        success: true,
        message: 'Correctly returned 404 Not Found',
      });
      console.log(`✅ Success: Correctly returned 404 Not Found\n`);
    } else {
      results.push({
        name: 'Test with non-existent ID',
        success: false,
        message: 'Should have returned 404 but got ' + response.status,
      });
      console.log(`❌ Failed: Should have returned 404 but got ${response.status}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Test with non-existent ID',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 6: Update status back to OPEN
  console.log('Test 6: Update status back to OPEN (cleanup)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'OPEN',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.data.status === 'OPEN') {
      results.push({
        name: 'Update status back to OPEN',
        success: true,
        message: 'Status reset successfully',
      });
      console.log(`✅ Success: Status reset to OPEN\n`);
    } else {
      results.push({
        name: 'Update status back to OPEN',
        success: false,
        message: data.error || 'Status not updated correctly',
      });
      console.log(`❌ Failed: ${data.error || 'Status not updated correctly'}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Update status back to OPEN',
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
console.log('🚀 Starting PATCH /api/incidents/:id/status endpoint tests...\n');
testIncidentStatusEndpoint().catch(console.error);
