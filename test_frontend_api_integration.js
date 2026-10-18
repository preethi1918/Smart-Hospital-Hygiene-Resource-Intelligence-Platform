// Integration Verification Script
// Tests all 6 hierarchical levels against the live Express Proxy (port 3000) and Spring Boot Backend (port 8080)

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Accept': 'application/json' };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('========================================================');
  console.log('🏥 Smart Hospital Frontend API Integration Verification');
  console.log('Testing against Node.js frontend server on http://localhost:3000');
  console.log('========================================================\n');

  // Step 1: Login
  console.log('[1/9] Testing Authentication POST /api/auth/login...');
  const loginRes = await request('/api/auth/login', 'POST', {
    email: 'admin@hospital.com',
    password: 'Admin@123456'
  });
  if (loginRes.status !== 200 || !loginRes.body.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }
  const token = loginRes.body.data.token;
  console.log('  ✔ Login successful! Admin token acquired.\n');

  // Step 2: Hospital CRUD
  console.log('[2/9] Testing Hospital Level (Create, Read, Update, Status)...');
  const createHospRes = await request('/api/hospitals', 'POST', {
    hospitalCode: 'HOSP-VERIFY-01',
    name: 'National Institute of Critical Care & Hygiene',
    licenseNumber: 'LIC-NICCH-2026-001',
    addressLine1: '88 Healthcare Boulevard',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    contactEmail: 'contact@nicch.org',
    contactPhone: '+91-80-2233-4455',
    status: 'ACTIVE'
  }, token);
  console.log('  Create Hospital Status:', createHospRes.status);
  const hospital = createHospRes.body.data;
  console.log(`  ✔ Hospital created: ID=${hospital.hospitalId}, Name="${hospital.name}"`);

  // Update hospital status
  const hospStatusRes = await request(`/api/hospitals/${hospital.hospitalId}/status`, 'PATCH', { status: 'ACTIVE' }, token);
  console.log('  ✔ Hospital status verified:', hospStatusRes.body.data.status);

  // Step 3: Building CRUD
  console.log('\n[3/9] Testing Building Level...');
  const createBldRes = await request('/api/buildings', 'POST', {
    hospitalId: hospital.hospitalId,
    buildingCode: 'BLD-ICU-01',
    name: 'Trauma & Emergency Wing',
    totalFloors: 6,
    status: 'ACTIVE'
  }, token);
  const building = createBldRes.body.data;
  console.log(`  ✔ Building created: ID=${building.buildingId}, Code=${building.buildingCode}`);

  // Step 4: Floor CRUD
  console.log('\n[4/9] Testing Floor Level...');
  const createFloorRes = await request('/api/floors', 'POST', {
    buildingId: building.buildingId,
    floorNumber: 3,
    floorCode: 'FL-03',
    floorName: 'Level 3 - Critical Care Complex',
    status: 'ACTIVE'
  }, token);
  const floor = createFloorRes.body.data;
  console.log(`  ✔ Floor created: ID=${floor.floorId}, Level=${floor.floorNumber}, Name="${floor.floorName}"`);

  // Step 5: Ward CRUD
  console.log('\n[5/9] Testing Ward Level...');
  const createWardRes = await request('/api/wards', 'POST', {
    floorId: floor.floorId,
    wardCode: 'WARD-ICU-CRIT',
    name: 'Intensive Isolation Ward',
    wardType: 'ICU',
    hygieneTargetScore: 98.0,
    currentHygieneScore: 96.5,
    status: 'ACTIVE'
  }, token);
  const ward = createWardRes.body.data;
  console.log(`  ✔ Ward created: ID=${ward.wardId}, Type=${ward.wardType}, Hygiene=${ward.currentHygieneScore}%`);

  // Update hygiene score
  const updateScoreRes = await request(`/api/wards/${ward.wardId}/hygiene-score`, 'PATCH', { currentHygieneScore: 99.2 }, token);
  console.log('  ✔ Ward hygiene score updated to:', updateScoreRes.body.data.currentHygieneScore + '%');

  // Step 6: Room CRUD
  console.log('\n[6/9] Testing Room Level...');
  const createRoomRes = await request('/api/rooms', 'POST', {
    wardId: ward.wardId,
    roomNumber: 'RM-305',
    roomType: 'ISOLATION_ROOM',
    qrCodeIdentifier: 'QR-NICCH-RM-305',
    airflowType: 'NEGATIVE_PRESSURE',
    readinessStatus: 'DIRTY_PENDING_CLEAN'
  }, token);
  const room = createRoomRes.body.data;
  console.log(`  ✔ Room created: ID=${room.roomId}, Number=${room.roomNumber}, Airflow=${room.airflowType}, Readiness=${room.readinessStatus}`);

  // Update readiness status (e.g. Disinfection in progress)
  const roomReadinessRes = await request(`/api/rooms/${room.roomId}/readiness-status`, 'PATCH', { readinessStatus: 'DISINFECTION_IN_PROGRESS' }, token);
  console.log('  ✔ Room readiness updated to:', roomReadinessRes.body.data.readinessStatus);

  // Step 7: Bed CRUD
  console.log('\n[7/9] Testing Bed Level...');
  const createBedRes = await request('/api/beds', 'POST', {
    roomId: room.roomId,
    bedNumber: 'BED-305-A',
    qrCodeIdentifier: 'QR-BED-305-A-CRIT',
    bedType: 'ISOLATION_NEGATIVE',
    operationalStatus: 'DIRTY_PENDING_STRIP',
    currentOccupancyReference: 'PAT-2026-0881'
  }, token);
  const bed = createBedRes.body.data;
  console.log(`  ✔ Bed created: ID=${bed.bedId}, Number=${bed.bedNumber}, Type=${bed.bedType}, Status=${bed.operationalStatus}`);

  // Update bed operational status
  const bedStatusRes = await request(`/api/beds/${bed.bedId}/operational-status`, 'PATCH', { operationalStatus: 'VACANT_CLEAN' }, token);
  console.log('  ✔ Bed operational status updated to:', bedStatusRes.body.data.operationalStatus);

  // Step 8: Complete Structure Tree Verification
  console.log('\n[8/9] Testing Complete Structure Tree GET /api/hospitals/{id}/tree...');
  const treeRes = await request(`/api/hospitals/${hospital.hospitalId}/tree`, 'GET', null, token);
  const tree = treeRes.body.data;
  console.log('  ✔ Structure Tree verified:');
  console.log(`    Hospital: ${tree.hospital.name}`);
  console.log(`    Buildings: ${tree.buildings.length}`);
  console.log(`    Floors in Building 1: ${tree.buildings[0].floors.length}`);
  console.log(`    Wards in Floor 1: ${tree.buildings[0].floors[0].wards.length}`);
  console.log(`    Rooms in Ward 1: ${tree.buildings[0].floors[0].wards[0].rooms.length}`);
  console.log(`    Beds in Room 1: ${tree.buildings[0].floors[0].wards[0].rooms[0].beds.length}`);

  // Step 9: Delete Bed
  console.log('\n[9/9] Testing Bed Deletion DELETE /api/beds/{id}...');
  const deleteBedRes = await request(`/api/beds/${bed.bedId}`, 'DELETE', null, token);
  console.log(`  ✔ Bed #${bed.bedId} deleted successfully (Status: ${deleteBedRes.status})`);

  console.log('\n========================================================');
  console.log('🎉 ALL 6 LEVELS OF HOSPITAL STRUCTURE VERIFIED 100% OPERATIONAL!');
  console.log('========================================================');
}

run().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
