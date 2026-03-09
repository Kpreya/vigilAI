/**
 * Manual test script for the login endpoint
 * Run with: npx tsx scripts/test-login.ts
 */

async function testLogin() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing POST /api/auth/login endpoint\n');

  // Test 1: Valid credentials
  console.log('Test 1: Login with valid credentials');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('   Token received:', data.data.token.substring(0, 20) + '...');
      console.log('   User:', data.data.user.email);
    } else {
      console.log('❌ Failed:', response.status);
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 2: Invalid password
  console.log('Test 2: Login with invalid password');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'wrongpassword',
      }),
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

  // Test 3: Non-existent user
  console.log('Test 3: Login with non-existent user');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
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

  // Test 4: Invalid email format
  console.log('Test 4: Login with invalid email format');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'password123',
      }),
    });

    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected with 400');
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n---\n');

  // Test 5: Missing password
  console.log('Test 5: Login with missing password');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice@example.com',
      }),
    });

    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected with 400');
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Request failed:', error);
  }

  console.log('\n✅ All tests completed!\n');
}

testLogin().catch(console.error);
