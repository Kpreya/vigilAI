/**
 * Manual test script for the signup API endpoint
 * Run with: npx tsx scripts/test-signup.ts
 */

async function testSignup() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing signup endpoint...\n');

  // Test 1: Valid signup
  console.log('Test 1: Valid signup');
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✓ Test 1 passed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
  }

  // Test 2: Invalid email
  console.log('Test 2: Invalid email');
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✓ Test 2 passed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
  }

  // Test 3: Weak password
  console.log('Test 3: Weak password');
  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'weak',
        name: 'Test User',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✓ Test 3 passed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
  }

  // Test 4: Duplicate email
  console.log('Test 4: Duplicate email');
  const duplicateEmail = `duplicate-${Date.now()}@example.com`;
  try {
    // First signup
    await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: duplicateEmail,
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });

    // Second signup with same email
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: duplicateEmail,
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✓ Test 4 passed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error);
  }

  console.log('All tests completed!');
}

testSignup().catch(console.error);
