/**
 * Test script for GET /api/incidents/:id endpoint
 * 
 * This script tests the incident detail endpoint
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

async function testIncidentDetailEndpoint() {
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
  console.log(`✅ Found test incident ID: ${testIncidentId}\n`);

  // Test 1: Get incident detail with valid ID
  console.log('Test 1: Get incident detail with valid ID');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      results.push({
        name: 'Get incident detail with valid ID',
        success: true,
        message: `Retrieved incident: ${data.data.title}`,
        data: {
          id: data.data.id,
          title: data.data.title,
          severity: data.data.severity,
          status: data.data.status,
          applicationName: data.data.application.name,
        },
      });
      console.log(`✅ Success: Retrieved incident "${data.data.title}"`);
      console.log(`   ID: ${data.data.id}`);
      console.log(`   Severity: ${data.data.severity}`);
      console.log(`   Status: ${data.data.status}`);
      console.log(`   Application: ${data.data.application.name}`);
      console.log(`   Error Count: ${data.data.errorCount}`);
      console.log(`   AI Diagnosis: ${data.data.aiDiagnosis ? 'Present' : 'Not available'}`);
      console.log(`   Suggested Fix: ${data.data.suggestedFix ? 'Present' : 'Not available'}\n`);
    } else {
      results.push({
        name: 'Get incident detail with valid ID',
        success: false,
        message: data.error || 'Unknown error',
      });
      console.log(`❌ Failed: ${data.error}\n`);
    }
  } catch (error) {
    results.push({
      name: 'Get incident detail with valid ID',
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`❌ Error: ${error}\n`);
  }

  // Test 2: Get incident detail without authentication (should fail)
  console.log('Test 2: Get incident detail without authentication (should fail with 401)');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}`);
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

  // Test 3: Get incident detail with non-existent ID (should fail with 404)
  console.log('Test 3: Get incident detail with non-existent ID (should fail with 404)');
  try {
    const fakeId = 'clxxxxxxxxxxxxxxxxxx';
    const response = await fetch(`${BASE_URL}/api/incidents/${fakeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

  // Test 4: Verify application details are included
  console.log('Test 4: Verify application details are included');
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.data.application) {
      const app = data.data.application;
      const hasRequiredFields = app.id && app.name;
      
      if (hasRequiredFields) {
        results.push({
          name: 'Verify application details',
          success: true,
          message: 'Application details are properly included',
        });
        console.log(`✅ Success: Application details are properly included`);
        console.log(`   Application ID: ${app.id}`);
        console.log(`   Application Name: ${app.name}`);
        console.log(`   Description: ${app.description || 'N/A'}`);
        console.log(`   GitHub Repo: ${app.githubRepo || 'N/A'}\n`);
      } else {
        results.push({
          name: 'Verify application details',
          success: false,
          message: 'Application details are missing required fields',
        });
        console.log(`❌ Failed: Application details are missing required fields\n`);
      }
    } else {
      results.push({
        name: 'Verify application details',
        success: false,
        message: 'Application details not included in response',
      });
      console.log(`❌ Failed: Application details not included in response\n`);
    }
  } catch (error) {
    results.push({
      name: 'Verify application details',
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
console.log('🚀 Starting GET /api/incidents/:id endpoint tests...\n');
testIncidentDetailEndpoint().catch(console.error);
