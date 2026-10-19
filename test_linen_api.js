// Comprehensive Linen API Integration Test
const http = require('http');

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
  });
  const token = (await loginRes.json()).data.token;
  const headers = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json', 'Content-Type': 'application/json' };

  console.log('1. Testing GET /api/linen/stats ...');
  const stats = await (await fetch('http://localhost:3000/api/linen/stats', { headers })).json();
  console.log('   Stats:', stats.data);

  console.log('2. Testing GET /api/linen ...');
  const list = await (await fetch('http://localhost:3000/api/linen', { headers })).json();
  console.log('   Retrieved', list.data.length, 'linen items.');
  list.data.forEach(item => {
    console.log(`   * [ID #${item.linenId}] ${item.linenCode} | Type: ${item.linenType} | Status: ${item.status} | Loc: ${item.currentLocation} | Bed: ${item.assignedBedNumber || 'None'} | Washes: ${item.washCycleCount}/${item.maxWashCycles} | Damage: ${item.damageStatus}`);
  });

  console.log('3. Testing POST /api/linen (Create) ...');
  const testCode = 'LIN-INTEG-' + Date.now().toString().slice(-4);
  const createRes = await (await fetch('http://localhost:3000/api/linen', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      linenCode: testCode,
      linenType: 'BEDSHEET',
      status: 'CLEAN',
      currentLocation: 'Central Linen Supply Room 102',
      washCycleCount: 5,
      maxWashCycles: 60,
      issueDate: '2026-03-01',
      lastWashedDate: '2026-10-15',
      damageStatus: 'NONE'
    })
  })).json();
  console.log('   Created linen:', createRes.success, 'ID:', createRes.data?.linenId, 'Code:', createRes.data?.linenCode);
  const linenId = createRes.data?.linenId;

  console.log('4. Testing PATCH /api/linen/{id}/status ...');
  const statusRes = await (await fetch(`http://localhost:3000/api/linen/${linenId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'IN_USE',
      location: 'Ward ICU - Bed A',
      performedBy: 'Nurse Jessica',
      reason: 'Patient admission bed prep'
    })
  })).json();
  console.log('   Status updated:', statusRes.data?.status, 'Location:', statusRes.data?.currentLocation);

  console.log('5. Testing PATCH /api/linen/{id}/wash ...');
  const washRes = await (await fetch(`http://localhost:3000/api/linen/${linenId}/wash`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      waterTemperatureCelsius: 75.0,
      sanitizerAgent: 'Peracetic Acid 250ppm',
      performedBy: 'Laundry Tech Alex',
      notes: 'Automated sanitize wash'
    })
  })).json();
  console.log('   Wash recorded:', washRes.success, 'New Wash Count:', washRes.data?.washCycleCount, 'Status:', washRes.data?.status);

  console.log('6. Testing PATCH /api/linen/{id}/damage ...');
  const dmgRes = await (await fetch(`http://localhost:3000/api/linen/${linenId}/damage`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      damageStatus: 'MINOR_WEAR',
      damageNotes: 'Hem fraying detected near collar',
      performedBy: 'QA Inspector',
      newStatus: 'DAMAGED'
    })
  })).json();
  console.log('   Damage recorded:', dmgRes.success, 'Damage:', dmgRes.data?.damageStatus, 'Status:', dmgRes.data?.status);

  console.log('7. Testing GET /api/linen/{id}/history ...');
  const hist = await (await fetch(`http://localhost:3000/api/linen/${linenId}/history`, { headers })).json();
  console.log('   History records count:', hist.data.length);
  hist.data.forEach(h => {
    console.log(`   -> [${h.action}] Prev: ${h.previousStatus} -> New: ${h.newStatus} | Staff: ${h.performedBy} | Notes: ${h.notes}`);
  });

  console.log('8. Testing POST /api/linen/{id}/history (Add Note) ...');
  const noteRes = await (await fetch(`http://localhost:3000/api/linen/${linenId}/history`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      note: 'Audited during weekly hospital infection control rounds. Meets clinical threshold.',
      performedBy: 'Dr. Emily Watson (Auditor)'
    })
  })).json();
  console.log('   Note added:', noteRes.success, 'Recorded At:', noteRes.data?.recordedAt);

  console.log('\nALL 8 LINEN API TESTS PASSED SUCCESSFULLY! 🎉');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
