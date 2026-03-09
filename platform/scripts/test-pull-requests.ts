/**
 * Test script for GET /api/pull-requests endpoint
 * 
 * This script tests the pull requests endpoint by:
 * 1. Logging in to get a JWT token
 * 2. Fetching pull requests for the authenticated user
 * 
 * Usage: npx tsx scripts/test-pull-requests.ts
 */

const BASE_URL = 'http://localhost:3000';

async function testPullRequestsEndpoint() {
  console.log('🧪 Testing GET /api/pull-requests endpoint\n');

  try {
    // Step 1: Login to get JWT token
    console.log('1️⃣  Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      const error = await loginResponse.json();
      console.error('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Fetch pull requests
    console.log('2️⃣  Fetching pull requests...');
    const prResponse = await fetch(`${BASE_URL}/api/pull-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!prResponse.ok) {
      console.error('❌ Fetch pull requests failed:', prResponse.status);
      const error = await prResponse.json();
      console.error('Error:', error);
      return;
    }

    const prData = await prResponse.json();
    console.log('✅ Pull requests fetched successfully');
    console.log(`   Found ${prData.data.length} pull request(s)\n`);

    // Display pull requests
    if (prData.data.length > 0) {
      console.log('📋 Pull Requests:');
      prData.data.forEach((pr: any, index: number) => {
        console.log(`\n   ${index + 1}. ${pr.title}`);
        console.log(`      ID: ${pr.id}`);
        console.log(`      Status: ${pr.status}`);
        console.log(`      GitHub PR: #${pr.githubPrNumber}`);
        console.log(`      URL: ${pr.githubPrUrl}`);
        console.log(`      Incident: ${pr.incident.title} (${pr.incident.severity})`);
        console.log(`      Created: ${new Date(pr.createdAt).toLocaleString()}`);
        if (pr.mergedAt) {
          console.log(`      Merged: ${new Date(pr.mergedAt).toLocaleString()}`);
        }
        if (pr.closedAt) {
          console.log(`      Closed: ${new Date(pr.closedAt).toLocaleString()}`);
        }
      });
    } else {
      console.log('   No pull requests found');
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPullRequestsEndpoint();
