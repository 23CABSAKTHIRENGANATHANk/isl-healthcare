#!/usr/bin/env node
/**
 * ISL Setu - Comprehensive Test Suite
 * Executes all critical test scenarios and generates report
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5174';
const REPORT_FILE = 'TEST_RESULTS.json';

const ROUTES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/learn', name: 'Learn Dashboard' },
  { path: '/learn/greetings-intake', name: 'Lesson: Greetings' },
  { path: '/learn/clinical-triage', name: 'Lesson: Clinical Triage' },
  { path: '/learn/diet-nutrition', name: 'Lesson: Nutrition' },
  { path: '/learn/pediatric-care', name: 'Lesson: Pediatric' },
  { path: '/practice', name: 'Practice Camera' },
  { path: '/voicebridge', name: 'VoiceBridge' },
  { path: '/assessment', name: 'Assessment' },
  { path: '/certification', name: 'Certification' },
];

const VIDEOS_TO_CHECK = [
  '/videos/signs/Hello.mp4',
  '/videos/signs/Thank%20you.mp4',
  '/videos/signs/Fever.mp4',
  '/videos/signs/Come.mp4',
  '/videos/signs/Drink.mp4',
  '/videos/signs/Good%20morning.mp4',
  '/videos/signs/Medicine.mp4',
  '/videos/signs/Food.mp4',
];

class TestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      routeTests: [],
      videoTests: [],
      summary: {
        routesPassed: 0,
        routesFailed: 0,
        videosPassed: 0,
        videosFailed: 0,
        totalTime: 0,
      },
    };
    this.startTime = Date.now();
  }

  async testRoute(route) {
    return new Promise((resolve) => {
      const url = new URL(route.path, BASE_URL);
      const req = http.get(url, { timeout: 5000 }, (res) => {
        const passed = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          name: route.name,
          path: route.path,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          passed,
          time: Date.now() - this.startTime,
        });
      });

      req.on('error', (err) => {
        resolve({
          name: route.name,
          path: route.path,
          statusCode: 0,
          statusMessage: err.message,
          passed: false,
          time: Date.now() - this.startTime,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          name: route.name,
          path: route.path,
          statusCode: 0,
          statusMessage: 'Timeout',
          passed: false,
          time: Date.now() - this.startTime,
        });
      });
    });
  }

  async testVideo(videoPath) {
    return new Promise((resolve) => {
      const url = new URL(videoPath, BASE_URL);
      const req = http.request(url, { method: 'GET', timeout: 5000 }, (res) => {
        const passed = res.statusCode >= 200 && res.statusCode < 400;
        const size = res.headers['content-length'] || 'unknown';
        res.resume(); // Consume stream to close request
        resolve({
          video: videoPath,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          passed,
          size,
          time: Date.now() - this.startTime,
        });
      });

      req.on('error', (err) => {
        resolve({
          video: videoPath,
          statusCode: 0,
          statusMessage: err.message,
          passed: false,
          size: 'N/A',
          time: Date.now() - this.startTime,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          video: videoPath,
          statusCode: 0,
          statusMessage: 'Timeout',
          passed: false,
          size: 'N/A',
          time: Date.now() - this.startTime,
        });
      });

      req.end();
    });
  }

  async runAllRouteTests() {
    console.log('\n🧪 Testing Routes...\n');
    for (const route of ROUTES_TO_TEST) {
      const result = await this.testRoute(route);
      this.results.routeTests.push(result);

      const icon = result.passed ? '✅' : '❌';
      console.log(
        `${icon} ${result.name.padEnd(30)} ${result.statusCode} ${result.statusMessage}`
      );

      if (result.passed) {
        this.results.summary.routesPassed++;
      } else {
        this.results.summary.routesFailed++;
      }
    }
  }

  async runAllVideoTests() {
    console.log('\n🎥 Testing Videos...\n');
    for (const video of VIDEOS_TO_CHECK) {
      const result = await this.testVideo(video);
      this.results.videoTests.push(result);

      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.video.padEnd(40)} ${result.statusCode} ${result.size} bytes`);

      if (result.passed) {
        this.results.summary.videosPassed++;
      } else {
        this.results.summary.videosFailed++;
      }
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    this.results.summary.totalTime = totalTime;

    const passRate = ((this.results.summary.routesPassed /
      (this.results.summary.routesPassed + this.results.summary.routesFailed)) *
      100
    ).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nRoutes: ${this.results.summary.routesPassed} ✅ / ${this.results.summary.routesFailed} ❌`);
    console.log(`Videos: ${this.results.summary.videosPassed} ✅ / ${this.results.summary.videosFailed} ❌`);
    console.log(`\nPass Rate: ${passRate}%`);
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Generated: ${this.results.timestamp}\n`);

    if (this.results.summary.routesFailed === 0 && this.results.summary.videosFailed === 0) {
      console.log('🎉 ALL TESTS PASSED!\n');
      process.exit(0);
    } else {
      console.log('⚠️  SOME TESTS FAILED - See details above\n');
      process.exit(1);
    }
  }

  async run() {
    console.log('\n🚀 ISL Setu - Automated Test Suite\n');
    console.log(`Target: ${BASE_URL}\n`);

    try {
      await this.runAllRouteTests();
      await this.runAllVideoTests();
      this.generateReport();
    } catch (err) {
      console.error('Test suite error:', err);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new TestRunner();
tester.run().catch(console.error);
