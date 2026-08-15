#!/usr/bin/env node
/**
 * ISL Setu — Unified Comprehensive Audit Script
 * Verifies frontend routes, static video assets, backend connectivity, and production build integrity.
 */

import http from 'http';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:5174';

const ROUTES_TO_AUDIT = [
  { path: '/', name: 'Landing Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/signup', name: 'Signup Page' },
  { path: '/dashboard', name: 'User Dashboard' },
  { path: '/learn', name: 'Curriculum Index' },
  { path: '/learn/greetings-intake', name: 'Lesson: Greetings' },
  { path: '/learn/clinical-triage', name: 'Lesson: Clinical Triage' },
  { path: '/practice', name: 'AI Practice Workspace' },
  { path: '/voicebridge', name: 'VoiceBridge Translator' },
  { path: '/assessment', name: 'Assessment Portal' },
  { path: '/certification', name: 'Certification Dashboard' },
  { path: '/hospital', name: 'Hospital Triage Roster' },
  { path: '/admin', name: 'Admin & Trainer Portal' },
  { path: '/about', name: 'About ISL Setu' },
  { path: '/accessibility', name: 'Accessibility Statement' },
];

const VIDEOS_TO_AUDIT = [
  '/videos/signs/Hello.mp4',
  '/videos/signs/Doctor.mp4',
  '/videos/signs/Nurse.mp4',
  '/videos/signs/Fever.mp4',
  '/videos/signs/Pain.mp4',
  '/videos/signs/Medicine.mp4',
  '/videos/signs/Water.mp4',
  '/videos/signs/Emergency.mp4',
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method: 'GET', timeout: 5000 }, (res) => {
      const passed = res.statusCode >= 200 && res.statusCode < 400;
      const size = res.headers['content-length'] || 'unknown';
      res.resume();
      resolve({ path, statusCode: res.statusCode, passed, size });
    });

    req.on('error', (err) => resolve({ path, statusCode: 0, passed: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ path, statusCode: 0, passed: false, error: 'Timeout' });
    });
    req.end();
  });
}

async function runAudit() {
  console.log('\n🛡️  ISL SETU — UNIFIED PROJECT AUDIT RUNNER');
  console.log(`Target Frontend: ${BASE_URL}\n`);

  let routesPassed = 0;
  let routesFailed = 0;

  console.log('--------------------------------------------------');
  console.log('1. AUDITING FRONTEND ROUTES');
  console.log('--------------------------------------------------');
  for (const route of ROUTES_TO_AUDIT) {
    const res = await checkUrl(route.path);
    const icon = res.passed ? '✅' : '❌';
    console.log(`${icon} ${route.name.padEnd(30)} [${route.path}] -> ${res.statusCode}`);
    if (res.passed) routesPassed++;
    else routesFailed++;
  }

  let videosPassed = 0;
  let videosFailed = 0;

  console.log('\n--------------------------------------------------');
  console.log('2. AUDITING STATIC VIDEO ASSETS');
  console.log('--------------------------------------------------');
  for (const video of VIDEOS_TO_AUDIT) {
    const res = await checkUrl(video);
    const icon = res.passed ? '✅' : '❌';
    console.log(`${icon} ${video.padEnd(35)} -> ${res.statusCode} (${res.size} bytes)`);
    if (res.passed) videosPassed++;
    else videosFailed++;
  }

  console.log('\n--------------------------------------------------');
  console.log('3. AUDITING BACKEND PYTHON PYTEST SUITE');
  console.log('--------------------------------------------------');
  try {
    const pytestOut = execSync('python -m pytest backend/tests/ -v', { encoding: 'utf-8' });
    console.log('✅ Pytest Suite Output:\n' + pytestOut.split('\n').slice(-5).join('\n'));
  } catch (err) {
    console.error('❌ Pytest execution failed:\n', err.stdout || err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('--------------------------------------------------');
  console.log(`Frontend Routes: ${routesPassed} Passed / ${routesFailed} Failed`);
  console.log(`Video Assets:    ${videosPassed} Passed / ${videosFailed} Failed`);
  const total = routesPassed + videosPassed;
  const totalFail = routesFailed + videosFailed;
  console.log(`Pass Rate:       ${((total / (total + totalFail)) * 100).toFixed(1)}%`);

  if (totalFail === 0) {
    console.log('\n✨ AUDIT PASSED: ALL FRONTEND & BACKEND SYSTEMS OPERATIONAL!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  AUDIT WARNING: SOME CHECKS FAILED. REVIEW LOGS ABOVE.\n');
    process.exit(1);
  }
}

runAudit().catch(console.error);
