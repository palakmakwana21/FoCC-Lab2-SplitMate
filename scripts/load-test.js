#!/usr/bin/env node

/**
 * SplitMate Load Testing Script
 * Designed for Fundamentals of Cloud Computing Lab 2
 * 
 * Generates configurable HTTP traffic against SplitMate backend endpoints
 * to benchmark latency, throughput, error rates, and observe HPA pod autoscaling.
 *
 * Usage:
 *   node scripts/load-test.js [options]
 * 
 * Options:
 *   --url, -u         Target Base URL (default: http://localhost:5000)
 *   --concurrency, -c Number of concurrent virtual workers (default: 15)
 *   --duration, -d    Test duration in seconds (default: 30)
 *   --timeout, -t     Request timeout in milliseconds (default: 5000)
 *   --verbose, -v     Log each request result
 *   --help, -h        Show this help message
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(shortName, longName, defaultValue) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === shortName || args[i] === longName) {
      return args[i + 1] || defaultValue;
    }
    if (args[i].startsWith(`${longName}=`)) {
      return args[i].split('=')[1];
    }
  }
  return defaultValue;
}

const hasFlag = (shortName, longName) => args.includes(shortName) || args.includes(longName);

if (hasFlag('-h', '--help')) {
  console.log(`
SplitMate Load Testing Tool
===========================
Options:
  --url, -u          Target base URL (default: http://localhost:5000)
  --concurrency, -c  Concurrent workers (default: 15)
  --duration, -d     Test duration in seconds (default: 30)
  --timeout, -t      Request timeout ms (default: 5000)
  --verbose, -v      Print each request

Examples:
  node scripts/load-test.js --url http://localhost:5000 -c 10 -d 20
  node scripts/load-test.js --url http://<EXTERNAL-IP> -c 25 -d 60
  `);
  process.exit(0);
}

const TARGET_URL = (getArg('-u', '--url', 'http://localhost:5000')).replace(/\/$/, '');
const CONCURRENCY = parseInt(getArg('-c', '--concurrency', '15'), 10);
const DURATION_SEC = parseInt(getArg('-d', '--duration', '30'), 10);
const TIMEOUT_MS = parseInt(getArg('-t', '--timeout', '5000'), 10);
const VERBOSE = hasFlag('-v', '--verbose');

// Weighted target endpoints simulating real-world user traffic
const ENDPOINTS = [
  { path: '/api/dashboard', weight: 35 },
  { path: '/api/expenses', weight: 25 },
  { path: '/api/balances', weight: 20 },
  { path: '/api/insights', weight: 10 },
  { path: '/api/health', weight: 10 }
];

function pickRandomEndpoint() {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const ep of ENDPOINTS) {
    cum += ep.weight;
    if (rand <= cum) return ep.path;
  }
  return ENDPOINTS[0].path;
}

// Metrics collector
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  statusCodes: {},
  latencies: [],
  startTime: null,
  endTime: null,
  errorTypes: {}
};

function recordStatusCode(code) {
  metrics.statusCodes[code] = (metrics.statusCodes[code] || 0) + 1;
}

function recordError(type) {
  metrics.errorTypes[type] = (metrics.errorTypes[type] || 0) + 1;
}

// Worker implementation
let isRunning = true;
const targetParsed = new URL(TARGET_URL);
const httpAgent = targetParsed.protocol === 'https:' 
  ? new https.Agent({ keepAlive: true, maxSockets: 100 })
  : new http.Agent({ keepAlive: true, maxSockets: 100 });

function makeRequest() {
  return new Promise((resolve) => {
    if (!isRunning) return resolve();

    const path = pickRandomEndpoint();
    const start = performance.now();
    const reqUrl = new URL(path, TARGET_URL);

    const client = reqUrl.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SplitMate-LoadTest-Agent/1.0'
      },
      agent: httpAgent,
      timeout: TIMEOUT_MS
    };

    const req = client.request(reqUrl, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = Math.round(performance.now() - start);
        metrics.totalRequests++;
        metrics.latencies.push(duration);
        recordStatusCode(res.statusCode);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
        }

        if (VERBOSE) {
          console.log(`[${res.statusCode}] ${path} - ${duration}ms`);
        }
        resolve();
      });
    });

    req.on('timeout', () => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      recordError('TIMEOUT');
      req.destroy();
      resolve();
    });

    req.on('error', (err) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      recordError(err.code || 'UNKNOWN_ERR');
      resolve();
    });

    req.end();
  });
}

async function workerLoop(workerId) {
  while (isRunning) {
    await makeRequest();
  }
}

// Percentile calculator
function calculatePercentile(sortedArray, p) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

async function run() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              SPLITMATE LOAD TESTING RUNNER                   ║
║         Fundamentals of Cloud Computing - Lab 2              ║
╚══════════════════════════════════════════════════════════════╝
  Target Base URL : ${TARGET_URL}
  Concurrency     : ${CONCURRENCY} workers
  Duration        : ${DURATION_SEC} seconds
  Timeout per req : ${TIMEOUT_MS} ms
  Endpoints       : /api/dashboard, /api/expenses, /api/balances, /api/insights, /api/health
`);

  metrics.startTime = Date.now();

  // Progress ticker
  let elapsed = 0;
  const timer = setInterval(() => {
    elapsed++;
    const currentRps = (metrics.totalRequests / (elapsed || 1)).toFixed(1);
    process.stdout.write(`\r[Running] Elapsed: ${elapsed}/${DURATION_SEC}s | Requests: ${metrics.totalRequests} | Current Throughput: ${currentRps} req/s`);
    if (elapsed >= DURATION_SEC) {
      clearInterval(timer);
      isRunning = false;
    }
  }, 1000);

  // Spawn concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(workerLoop(i));
  }

  // Wait until duration expires
  await new Promise(resolve => setTimeout(resolve, DURATION_SEC * 1000 + 500));
  isRunning = false;
  await Promise.allSettled(workers);

  metrics.endTime = Date.now();
  const totalDurationSec = (metrics.endTime - metrics.startTime) / 1000;

  // Process Latencies
  const sorted = metrics.latencies.slice().sort((a, b) => a - b);
  const minLatency = sorted.length ? sorted[0] : 0;
  const maxLatency = sorted.length ? sorted[sorted.length - 1] : 0;
  const sumLatency = sorted.reduce((acc, v) => acc + v, 0);
  const meanLatency = sorted.length ? (sumLatency / sorted.length).toFixed(1) : 0;
  const p50 = calculatePercentile(sorted, 50);
  const p90 = calculatePercentile(sorted, 90);
  const p95 = calculatePercentile(sorted, 95);
  const p99 = calculatePercentile(sorted, 99);
  const rps = (metrics.totalRequests / totalDurationSec).toFixed(2);
  const errorRate = metrics.totalRequests > 0 
    ? ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2) 
    : '0.00';

  console.log(`\n\n════════════════════ LOAD TEST RESULTS ════════════════════`);
  console.log(`Duration               : ${totalDurationSec.toFixed(2)} seconds`);
  console.log(`Total Requests Sent    : ${metrics.totalRequests}`);
  console.log(`Successful Requests    : ${metrics.successfulRequests}`);
  console.log(`Failed Requests        : ${metrics.failedRequests} (${errorRate}%)`);
  console.log(`Average Throughput     : ${rps} req/sec`);
  console.log(`-----------------------------------------------------------`);
  console.log(`Latency Breakdown:`);
  console.log(`  Min                  : ${minLatency} ms`);
  console.log(`  Average (Mean)       : ${meanLatency} ms`);
  console.log(`  50th Percentile (p50): ${p50} ms`);
  console.log(`  90th Percentile (p90): ${p90} ms`);
  console.log(`  95th Percentile (p95): ${p95} ms`);
  console.log(`  99th Percentile (p99): ${p99} ms`);
  console.log(`  Max                  : ${maxLatency} ms`);
  console.log(`-----------------------------------------------------------`);
  console.log(`Status Codes:`);
  for (const [code, count] of Object.entries(metrics.statusCodes)) {
    console.log(`  HTTP ${code}            : ${count} (${((count / metrics.totalRequests) * 100).toFixed(1)}%)`);
  }
  if (Object.keys(metrics.errorTypes).length > 0) {
    console.log(`Errors:`);
    for (const [err, count] of Object.entries(metrics.errorTypes)) {
      console.log(`  ${err}               : ${count}`);
    }
  }
  console.log(`═══════════════════════════════════════════════════════════\n`);

  if (rps > 0) {
    console.log(`💡 Lab Report Tip: Capture the table above for your Lab 2 Report.`);
    console.log(`   To observe pod autoscaling in AKS during this test, run in another shell:`);
    console.log(`   kubectl get hpa splitmate-backend-hpa --watch\n`);
  }
}

run().catch(err => {
  console.error("Load test failed to execute:", err);
  process.exit(1);
});
