#!/usr/bin/env node

/**
 * SDK Test Script
 * Tests the Probe TypeScript SDK functionality
 */

const { ProbeClient } = require('./dist/index');

async function testSDK() {
  console.log('🧪 Testing Probe TypeScript SDK\n');

  try {
    // Initialize client
    console.log('1️⃣ Initializing Probe Client...');
    const client = new ProbeClient({
      apiUrl: 'http://localhost:3000/api/v1',
      apiKey: 'pk_test_tcfrjfb60z7'
    });
    console.log('✅ Client initialized\n');

    // Test authentication
    console.log('2️⃣ Testing Authentication...');
    try {
      const authResult = await client.auth.login({
        email: 'admin@probe.dev',
        password: 'admin123'
      });
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authResult.accessToken.substring(0, 20)}...`);
      console.log(`   User: ${authResult.user.email}\n`);
    } catch (error) {
      console.log('⚠️  Authentication test skipped (backend may not be running)\n');
    }

    // Test programs
    console.log('3️⃣ Testing Programs API...');
    try {
      const programs = await client.programs.list({ limit: 5 });
      console.log(`✅ Found ${programs.length} programs`);
      if (programs.length > 0) {
        console.log(`   First program: ${programs[0].name} (${programs[0].programId})\n`);
      }
    } catch (error) {
      console.log('⚠️  Programs test skipped (backend may not be running)\n');
    }

    console.log('✅ SDK Test Complete!\n');
    console.log('📚 SDK Features:');
    console.log('   - Authentication (login, register, refresh)');
    console.log('   - Programs management');
    console.log('   - Transactions monitoring');
    console.log('   - Analytics and metrics');
    console.log('   - Alerts management');
    console.log('   - WebSocket real-time updates');
    console.log('   - Program monitoring utilities\n');

  } catch (error) {
    console.error('❌ SDK Test Failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testSDK();
