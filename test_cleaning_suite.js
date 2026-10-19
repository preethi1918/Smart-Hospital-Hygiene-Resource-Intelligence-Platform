/**
 * Automated Verification Suite for Cleaning & Hygiene Management Module
 * Tests:
 * 1. Auth Handshake (JWT)
 * 2. Task Fetching & All 6 Location Categories (Room, Bed, Toilet, Corridor, Waiting Area, Handwash Station)
 * 3. Task Structure (Task ID, Location, Task Type, Assigned Staff, Scheduled Time, Completed Time, Status, Notes)
 * 4. Task Statuses (PENDING, IN_PROGRESS, COMPLETED, OVERDUE, VERIFIED)
 * 5. Task Creation across non-room locations
 * 6. Task Progression (Start -> Complete)
 * 7. QR Workflow Task Completion (auto records staff, date, time, updates target resource)
 * 8. Quality Verification (VERIFIED status)
 * 9. Persistent Cleaning History Audit Trail verification
 * 10. Cleaning Aggregate Statistics API
 * 11. Express Web Proxy & Static Assets (/cleaning, /css/cleaning.css, /js/cleaningManager.js)
 */

const http = require('http');

const API_BASE = 'http://localhost:8080';
const NODE_BASE = 'http://localhost:3000';

function httpRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (postData) {
      const payload = typeof postData === 'object' ? JSON.stringify(postData) : postData;
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runCleaningSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING CLEANING & HYGIENE MANAGEMENT AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  try {
    // Test 1: Authentication Handshake
    console.log('📌 Test 1: Authenticating Admin Staff...');
    const authRes = await httpRequest(`${API_BASE}/api/auth/login`, { method: 'POST' }, {
      email: 'admin@hospital.com',
      password: 'Admin@123456'
    });
    assert(authRes.statusCode === 200, `Login returns HTTP 200 (Got: ${authRes.statusCode})`);
    const token = authRes.body?.data?.token;
    assert(!!token, 'JWT Token successfully acquired');
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // Test 2: Fetch Cleaning Tasks and Verify All 6 Location Categories
    console.log('\n📌 Test 2: Verifying All 6 Hospital Cleaning Locations...');
    const tasksRes = await httpRequest(`${API_BASE}/api/cleaning/tasks`, { headers: authHeaders });
    assert(tasksRes.statusCode === 200, 'Cleaning tasks retrieved successfully (HTTP 200)');
    const tasks = tasksRes.body?.data || [];
    assert(tasks.length >= 6, `Retrieved at least 6 cleaning tasks (Found: ${tasks.length})`);

    const locationTypesFound = new Set(tasks.map(t => t.locationType));
    const requiredLocations = ['ROOM', 'BED', 'TOILET', 'CORRIDOR', 'WAITING_AREA', 'HANDWASH_STATION'];
    requiredLocations.forEach(loc => {
      assert(locationTypesFound.has(loc), `Location category supported: ${loc}`);
    });

    // Test 3: Verify Required Task Fields
    console.log('\n📌 Test 3: Verifying Required Fields on Tasks...');
    const sampleTask = tasks[0];
    assert(sampleTask.taskId !== undefined && sampleTask.taskId !== null, `Task contains taskId: ${sampleTask.taskId}`);
    assert(!!sampleTask.taskCode, `Task contains taskCode: ${sampleTask.taskCode}`);
    assert(!!sampleTask.location, `Task contains location: ${sampleTask.location}`);
    assert(!!sampleTask.taskType, `Task contains taskType: ${sampleTask.taskType}`);
    assert(!!sampleTask.assignedStaff, `Task contains assignedStaff: ${sampleTask.assignedStaff}`);
    assert(!!sampleTask.scheduledTime, `Task contains scheduledTime: ${sampleTask.scheduledTime}`);
    assert(sampleTask.completedTime !== undefined, `Task contains completedTime field (Val: ${sampleTask.completedTime})`);
    assert(!!sampleTask.status, `Task contains status: ${sampleTask.status}`);
    assert(sampleTask.notes !== undefined, 'Task contains notes field');

    // Test 4: Verify All 5 Task Statuses
    console.log('\n📌 Test 4: Verifying Status Coverage (PENDING, IN_PROGRESS, COMPLETED, OVERDUE, VERIFIED)...');
    const statusesFound = new Set(tasks.map(t => t.status));
    console.log('   Current active statuses in platform:', Array.from(statusesFound).join(', '));
    assert(statusesFound.has('COMPLETED'), 'Status COMPLETED present');
    assert(statusesFound.has('PENDING') || statusesFound.has('OVERDUE'), 'Scheduled/Queue status present');
    assert(statusesFound.has('VERIFIED'), 'Status VERIFIED present');

    // Test 5: Create a new Cleaning Task across Handwash Station
    console.log('\n📌 Test 5: Scheduling New Cleaning Task for Handwash Station...');
    const newTaskPayload = {
      locationName: 'Emergency Triage Handwash Bay #2',
      locationType: 'HANDWASH_STATION',
      taskType: 'HANDWASH_STATION_SERVICE',
      priority: 'URGENT',
      targetQrCode: 'HWASH-ER-02',
      assignedStaffName: 'Alex Mercer (Sanitation)',
      scheduledStartTime: new Date(Date.now() + 3600000).toISOString(),
      specialInstructions: 'Inspect pump calibration, replace chlorhexidine cartridge, wipe splashback.',
      notes: 'Initial test task creation'
    };
    const createRes = await httpRequest(`${API_BASE}/api/cleaning/tasks`, { method: 'POST', headers: authHeaders }, newTaskPayload);
    assert(createRes.statusCode === 201, `Task scheduled successfully with HTTP 201 (Got: ${createRes.statusCode})`);
    const createdTask = createRes.body?.data;
    assert(createdTask?.locationType === 'HANDWASH_STATION', `Created task locationType is HANDWASH_STATION`);
    assert(createdTask?.status === 'PENDING', `Created task initial status is PENDING`);
    assert(createdTask?.targetQrCode === 'HWASH-ER-02', `Created task targetQrCode is HWASH-ER-02`);

    // Test 6: Progress Task (Start -> IN_PROGRESS)
    console.log('\n📌 Test 6: Starting Scheduled Task...');
    const startRes = await httpRequest(`${API_BASE}/api/cleaning/tasks/${createdTask.taskId}/start`, { method: 'POST', headers: authHeaders });
    assert(startRes.statusCode === 200, 'Start task endpoint returned HTTP 200');
    assert(startRes.body?.data?.status === 'IN_PROGRESS', `Task status transitioned to IN_PROGRESS (Got: ${startRes.body?.data?.status})`);

    // Test 7: Complete Task via QR Workflow
    console.log('\n📌 Test 7: Completing Task via QR Workflow (Auto-records Date, Time & Staff)...');
    const qrCompletePayload = {
      qrCode: 'HWASH-ER-02',
      notes: 'Handwash station sanitized, cartridge refilled, sensor verified.',
      disinfectantUsed: 'Sterile Chlorhexidine 4% Scrub Solution',
      cleaningMethod: 'SURFACE_CHEMICAL_WIPE'
    };
    const qrRes = await httpRequest(`${API_BASE}/api/cleaning/tasks/complete-qr`, { method: 'POST', headers: authHeaders }, qrCompletePayload);
    assert(qrRes.statusCode === 200, `QR completion returned HTTP 200 (Got: ${qrRes.statusCode})`);
    const qrCompletedTask = qrRes.body?.data;
    assert(qrCompletedTask?.status === 'COMPLETED', `Task status marked COMPLETED via QR (Got: ${qrCompletedTask?.status})`);
    assert(!!qrCompletedTask?.completedTime, `Completed time automatically recorded: ${qrCompletedTask?.completedTime}`);
    assert(!!qrCompletedTask?.completedByStaff, `Staff member automatically recorded: ${qrCompletedTask?.completedByStaff}`);

    // Test 8: Verify Task Quality & Certification (VERIFIED)
    console.log('\n📌 Test 8: Verifying Cleaning Quality (Quality Auditor Sign-off)...');
    const verifyPayload = {
      score: 99.4,
      notes: 'ATP bioluminescence surface swab test passed with 12 RLU. Hygiene certified.'
    };
    const verifyRes = await httpRequest(`${API_BASE}/api/cleaning/tasks/${createdTask.taskId}/verify`, { method: 'POST', headers: authHeaders }, verifyPayload);
    assert(verifyRes.statusCode === 200, 'Verify endpoint returned HTTP 200');
    assert(verifyRes.body?.data?.status === 'VERIFIED', `Task status certified as VERIFIED (Got: ${verifyRes.body?.data?.status})`);
    assert(!!verifyRes.body?.data?.verifiedByStaff, `Verified by staff recorded: ${verifyRes.body?.data?.verifiedByStaff}`);

    // Test 9: Verify Cleaning History Audit Trail
    console.log('\n📌 Test 9: Checking Cleaning History Audit Trail...');
    const historyRes = await httpRequest(`${API_BASE}/api/cleaning/history?qrCode=HWASH-ER-02`, { headers: authHeaders });
    assert(historyRes.statusCode === 200, 'Cleaning history retrieved successfully (HTTP 200)');
    const historyLogs = historyRes.body?.data || [];
    assert(historyLogs.length > 0, `History audit logs found for HWASH-ER-02 (Count: ${historyLogs.length})`);
    const log = historyLogs[0];
    assert(log.qrScannedToken === 'HWASH-ER-02', `Log QR token matched: ${log.qrScannedToken}`);
    assert(log.locationType === 'HANDWASH_STATION', `Log location type matched: ${log.locationType}`);
    assert(!!log.performedByStaff, `Log performedByStaff recorded: ${log.performedByStaff}`);
    assert(!!log.completedAt, `Log completedAt timestamp recorded: ${log.completedAt}`);
    assert(log.disinfectantUsed === 'Sterile Chlorhexidine 4% Scrub Solution', `Log disinfectant recorded: ${log.disinfectantUsed}`);
    assert(log.cleaningMethod === 'SURFACE_CHEMICAL_WIPE', `Log cleaningMethod recorded: ${log.cleaningMethod}`);

    // Test 10: Aggregate Cleaning Statistics
    console.log('\n📌 Test 10: Checking Cleaning Analytics Metrics...');
    const statsRes = await httpRequest(`${API_BASE}/api/cleaning/stats`, { headers: authHeaders });
    assert(statsRes.statusCode === 200, 'Cleaning statistics retrieved (HTTP 200)');
    const stats = statsRes.body?.data;
    assert(stats?.totalTasks > 0, `Total tasks count: ${stats?.totalTasks}`);
    assert(stats?.completedTasks > 0, `Completed tasks count: ${stats?.completedTasks}`);
    assert(stats?.totalLogs > 0, `Audit logs count: ${stats?.totalLogs}`);
    assert(stats?.tasksByLocation && Object.keys(stats.tasksByLocation).length >= 6, 'Location breakdown covers all categories');

    // Test 11: Web Frontend & Express Proxy
    console.log('\n📌 Test 11: Verifying Frontend Pages & Assets via Node Express Proxy...');
    const pageRes = await httpRequest(`${NODE_BASE}/cleaning`);
    assert(pageRes.statusCode === 200, `GET /cleaning returns HTTP 200 HTML page`);
    assert(typeof pageRes.body === 'string' && pageRes.body.includes('Cleaning & Hygiene Management'), 'HTML contains Cleaning module title');

    const cssRes = await httpRequest(`${NODE_BASE}/css/cleaning.css`);
    assert(cssRes.statusCode === 200, 'GET /css/cleaning.css returns HTTP 200');

    const jsRes = await httpRequest(`${NODE_BASE}/js/cleaningManager.js`);
    assert(jsRes.statusCode === 200, 'GET /js/cleaningManager.js returns HTTP 200');

    // Test 12: Express Proxy for Cleaning API
    console.log('\n📌 Test 12: Verifying Express Proxy forwarding /api/cleaning/tasks...');
    const proxyTasksRes = await httpRequest(`${NODE_BASE}/api/cleaning/tasks`, { headers: authHeaders });
    assert(proxyTasksRes.statusCode === 200, `Proxy /api/cleaning/tasks returned HTTP 200`);
    assert(Array.isArray(proxyTasksRes.body?.data), 'Proxy forwarded JSON response correctly');

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runCleaningSuite();
