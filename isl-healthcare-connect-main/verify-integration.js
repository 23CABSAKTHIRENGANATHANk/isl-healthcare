#!/usr/bin/env node
/**
 * Quick Verification Script for VideoPlayer & Quiz Integration
 * Tests that the dev server is running and key routes are accessible
 */

import http from 'http';

const baseURL = 'http://localhost:5174';

function checkRoute(path) {
  return new Promise((resolve) => {
    const url = new URL(path, baseURL);
    const req = http.get(url, { timeout: 3000 }, (res) => {
      resolve({
        path,
        status: res.statusCode,
        success: res.statusCode === 200,
        message: `${res.statusCode} ${res.statusMessage}`,
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 0,
        success: false,
        message: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        success: false,
        message: 'Timeout',
      });
    });
  });
}

async function runVerification() {
  console.log('\n🧪 ISL Setu - VideoPlayer & Quiz Integration Verification\n');
  console.log(`Target: ${baseURL}\n`);

  const routes = [
    '/',
    '/learn',
    '/learn/clinical-greetings',
    '/practice',
    '/voicebridge',
    '/assessment',
    '/certification',
    '/videos/signs/Hello.mp4',
    '/videos/signs/Fever.mp4',
    '/videos/signs/Thank%20you.mp4',
  ];

  const results = [];
  for (const route of routes) {
    const result = await checkRoute(route);
    results.push(result);
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.path.padEnd(40)} ${result.message}`);
  }

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`\n📊 Results: ${successCount}/${totalCount} routes accessible\n`);

  if (successCount === totalCount) {
    console.log('✨ All routes accessible! Ready for testing.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some routes failed. Check dev server status.\n');
    process.exit(1);
  }
}

runVerification().catch(console.error);
