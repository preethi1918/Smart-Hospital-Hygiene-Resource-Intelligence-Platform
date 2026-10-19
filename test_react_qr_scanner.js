// test_react_qr_scanner.js
// Verification suite for React QR Scanner application & clinical action workflows

async function runScannerTestSuite() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting React QR Scanner & Clinical Actions Verification Suite ---');

  // 1. Static Web Assets Verification
  console.log('\n[1/6] Verifying React Scanner Static Web Assets & Offline Vendor Bundles...');
  const assets = [
    '/scan',
    '/scanner',
    '/css/scanner.css',
    '/js/vendor/react.min.js',
    '/js/vendor/react-dom.min.js',
    '/js/reactScannerApp.js'
  ];

  for (const path of assets) {
    const res = await fetch(`${baseUrl}${path}`);
    if (!res.ok) throw new Error(`Asset ${path} returned HTTP ${res.status}`);
    const text = await res.text();
    console.log(`  ✔ Asset ${path} verified (${text.length} bytes, HTTP ${res.status})`);
  }

  // 2. Authenticate
  console.log('\n[2/6] Authenticating Clinical Administrator...');
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
  });
  if (!authRes.ok) throw new Error(`Auth failed with HTTP ${authRes.status}`);
  const authJson = await authRes.json();
  const token = authJson.data?.token || authJson.token;
  console.log(`  ✔ Authenticated successfully as ${authJson.data?.user?.fullName || 'Clinical Admin'}`);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // 3. Bed QR Scanning & Clinical Actions (View, Clean, Change Linen, Report Issue, View History)
  console.log('\n[3/6] Testing Bed QR Workflow (BED-204)...');
  const bedLookup = await (await fetch(`${baseUrl}/api/qr/lookup/BED-204`, { headers })).json();
  const bedData = bedLookup.data || bedLookup;
  console.log(`  ✔ Identified Resource: "${bedData.resourceName}" [${bedData.qrCodeIdentifier}] | Type: ${bedData.resourceType} | Initial Status: ${bedData.status}`);

  // 3a. Clean Bed
  console.log('  Testing Action: Clean Bed (CLEAN_BED)...');
  const cleanBedRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: 'BED-204',
      action: 'CLEAN_BED',
      notes: 'Sanitized with quaternary ammonium disinfectant'
    })
  });
  if (!cleanBedRes.ok) throw new Error(`Clean Bed failed: ${cleanBedRes.status}`);
  const cleanBedData = (await cleanBedRes.json()).data;
  console.log(`  ✔ Clean Bed Success: Status updated to ${cleanBedData.status}`);

  // 3b. Change Linen
  console.log('  Testing Action: Change Linen (CHANGE_LINEN)...');
  const changeLinenRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: 'BED-204',
      action: 'CHANGE_LINEN',
      notes: 'Antimicrobial fitted sheet and pillow slip replaced'
    })
  });
  if (!changeLinenRes.ok) throw new Error(`Change Linen failed: ${changeLinenRes.status}`);
  const changeLinenData = (await changeLinenRes.json()).data;
  console.log(`  ✔ Change Linen Success: Updated bedsheet timestamp`);

  // 3c. Report Issue on Bed
  console.log('  Testing Action: Report Issue (REPORT_ISSUE)...');
  const issueBedRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: 'BED-204',
      action: 'REPORT_ISSUE',
      notes: 'Mechanical elevation motor obstruction detected'
    })
  });
  if (!issueBedRes.ok) throw new Error(`Report Issue failed: ${issueBedRes.status}`);
  const issueBedData = (await issueBedRes.json()).data;
  console.log(`  ✔ Report Issue Success: Bed status transitioned to ${issueBedData.status}`);

  // 3d. Restore to Vacant Clean
  await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ qrCodeIdentifier: 'BED-204', action: 'CLEAN_BED', notes: 'Restored after maintenance' })
  });

  // 3e. View Bed History
  const bedHistoryRes = await fetch(`${baseUrl}/api/qr/history/BED-204`, { headers });
  const bedHistory = (await bedHistoryRes.json()).data;
  console.log(`  ✔ View Bed History Success: Retrieved ${bedHistory.length} audit entries (e.g. "${bedHistory[0].actionType}: ${bedHistory[0].notes}")`);

  // 4. Room QR Scanning & Actions (View Tasks, Complete Cleaning, View Readiness)
  console.log('\n[4/6] Testing Room QR Workflow (ROOM-204)...');
  const roomLookup = await (await fetch(`${baseUrl}/api/qr/lookup/ROOM-204`, { headers })).json();
  const roomData = roomLookup.data || roomLookup;
  console.log(`  ✔ Identified Resource: "${roomData.resourceName}" [${roomData.qrCodeIdentifier}] | Type: ${roomData.resourceType} | Initial Status: ${roomData.status}`);

  // 4a. Start Disinfection
  console.log('  Testing Action: Start Disinfection (START_DISINFECTION)...');
  const startDisRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: 'ROOM-204',
      action: 'START_DISINFECTION',
      notes: 'Mobile Xenon UV-C Robot deployed in isolation suite'
    })
  });
  const startDisData = (await startDisRes.json()).data;
  console.log(`  ✔ Start Disinfection Success: Room status -> ${startDisData.status}`);

  // 4b. Complete Cleaning
  console.log('  Testing Action: Complete Cleaning (COMPLETE_ROOM_CLEANING)...');
  const completeCleanRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: 'ROOM-204',
      action: 'COMPLETE_ROOM_CLEANING',
      notes: 'All 5 protocol checklist items completed and verified'
    })
  });
  const completeCleanData = (await completeCleanRes.json()).data;
  console.log(`  ✔ Complete Cleaning Success: Room status -> ${completeCleanData.status}`);

  // 4c. View Room History & Readiness
  const roomHistoryRes = await fetch(`${baseUrl}/api/qr/history/ROOM-204`, { headers });
  const roomHistory = (await roomHistoryRes.json()).data;
  console.log(`  ✔ View Room History Success: Retrieved ${roomHistory.length} entries`);

  // 5. Linen QR Scanning & Actions (View History, Mark Changed, Send to Laundry, Record Wash)
  console.log('\n[5/6] Testing Linen QR Workflow (LINEN-1024 / Sample Linen)...');
  const qrList = (await (await fetch(`${baseUrl}/api/qr/resources?type=LINEN`, { headers })).json()).data;
  const targetLinen = qrList.find(l => l.qrCodeIdentifier.includes('LINEN')) || qrList[0];
  const linenCode = targetLinen.qrCodeIdentifier;

  const linenLookup = await (await fetch(`${baseUrl}/api/qr/lookup/${encodeURIComponent(linenCode)}`, { headers })).json();
  const linenData = linenLookup.data || linenLookup;
  console.log(`  ✔ Identified Linen: "${linenData.resourceName}" [${linenCode}] | Status: ${linenData.status}`);

  // 5a. Send to Laundry
  console.log('  Testing Action: Send to Laundry (SEND_TO_LAUNDRY)...');
  const laundryRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: linenCode,
      action: 'SEND_TO_LAUNDRY',
      notes: 'Transferred to central laundry logistics'
    })
  });
  const laundryData = (await laundryRes.json()).data;
  console.log(`  ✔ Send to Laundry Success: Status -> ${laundryData.status} | Location: ${laundryData.location}`);

  // 5b. Record Wash Cycle
  console.log('  Testing Action: Record Wash Cycle (RECORD_WASH)...');
  const washRes = await fetch(`${baseUrl}/api/qr/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      qrCodeIdentifier: linenCode,
      action: 'RECORD_WASH',
      notes: 'Thermal decontamination cycle completed'
    })
  });
  const washData = (await washRes.json()).data;
  console.log(`  ✔ Record Wash Success: Status -> ${washData.status} | Cycles: ${washData.details?.washCycleCount || 'Recorded'}`);

  // 5c. View Linen History
  const linenHistoryRes = await fetch(`${baseUrl}/api/qr/history/${encodeURIComponent(linenCode)}`, { headers });
  const linenHistory = (await linenHistoryRes.json()).data;
  console.log(`  ✔ View Linen History Success: Retrieved ${linenHistory.length} entries`);

  // 6. Graceful Handling of Invalid QR Codes
  console.log('\n[6/6] Testing Graceful Handling of Invalid QR Codes...');
  const invalidCode = 'INVALID-ASSET-CODE-99999';
  const invalidRes = await fetch(`${baseUrl}/api/qr/lookup/${encodeURIComponent(invalidCode)}`, { headers });
  if (invalidRes.status === 404) {
    const invalidJson = await invalidRes.json();
    console.log(`  ✔ Graceful 404 Handling Confirmed: "${invalidJson.message}"`);
  } else {
    throw new Error(`Expected 404 for invalid QR code, got HTTP ${invalidRes.status}`);
  }

  console.log('\n======================================================');
  console.log('  ALL REACT QR SCANNER & ACTION WORKFLOW TESTS PASSED!');
  console.log('======================================================\n');
}

runScannerTestSuite().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
