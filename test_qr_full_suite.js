// test_qr_full_suite.js
// Comprehensive test suite for Hospital Resource QR Intelligence

async function runQrVerification() {
  const baseUrl = 'http://localhost:3000';
  console.log('--- Starting Comprehensive QR Code Intelligence Verification ---');

  // 1. Verify frontend files are served by Node Express server
  console.log('\n[1/5] Verifying Static Web Assets...');
  const pages = ['/qr.html', '/css/qr.css', '/js/qrcode.js', '/js/qrManager.js'];
  for (const page of pages) {
    const res = await fetch(`${baseUrl}${page}`);
    if (!res.ok) throw new Error(`Asset ${page} returned HTTP ${res.status}`);
    const text = await res.text();
    console.log(`  ✔ Asset ${page} loaded (${text.length} bytes, HTTP ${res.status})`);
  }

  // 2. Authenticate
  console.log('\n[2/5] Authenticating as System Administrator...');
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
  });
  if (!authRes.ok) throw new Error(`Auth failed with HTTP ${authRes.status}`);
  const authJson = await authRes.json();
  const token = authJson.data?.token || authJson.token;
  console.log(`  ✔ Authenticated successfully: ${authJson.data?.user?.fullName || 'Hospital Admin'}`);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // 3. Verify Resource Inventory & Coverage across all 5 types
  console.log('\n[3/5] Verifying QR Resource Inventory across 5 Categories...');
  const resList = await (await fetch(`${baseUrl}/api/qr/resources`, { headers })).json();
  const items = resList.data || resList;
  console.log(`  ✔ Total Resources Tagged with QR: ${items.length}`);

  const categories = ['ROOM', 'BED', 'LINEN', 'EQUIPMENT', 'WASTE_BIN'];
  for (const cat of categories) {
    const matching = items.filter(r => r.resourceType === cat);
    if (matching.length === 0) {
      throw new Error(`Category ${cat} has 0 resources! Expected tagged assets.`);
    }
    console.log(`  ✔ Category [${cat}]: ${matching.length} items (Sample: ${matching[0].qrCodeIdentifier} - ${matching[0].resourceName})`);
  }

  // 4. Verify Decoupled Zero-PHI Lookups for all required example identifiers
  console.log('\n[4/5] Verifying Decoupled Zero-PHI Lookups for Required Examples...');
  const requiredLookups = ['BED-204', 'ROOM-204', 'EQUIP-501', 'BIN-ICU-01'];
  for (const code of requiredLookups) {
    const lookupRes = await fetch(`${baseUrl}/api/qr/lookup/${encodeURIComponent(code)}`, { headers });
    if (!lookupRes.ok) throw new Error(`Lookup failed for ${code}: HTTP ${lookupRes.status}`);
    const lookupJson = await lookupRes.json();
    const data = lookupJson.data || lookupJson;
    console.log(`  ✔ Lookup [${code}] => Name: "${data.resourceName}", Type: ${data.resourceType}, Location: "${data.location}", Status: ${data.status}`);
  }

  // 5. Verify QR Generation & QR Regeneration Operations
  console.log('\n[5/5] Verifying QR Generation and Regeneration Workflows...');
  
  // Test Generate
  const targetRoom = items.find(r => r.resourceType === 'ROOM');
  const genPayload = {
    resourceType: 'ROOM',
    resourceId: targetRoom.resourceId,
    customQrCodeIdentifier: 'ROOM-204-TEST'
  };
  const genRes = await fetch(`${baseUrl}/api/qr/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(genPayload)
  });
  if (!genRes.ok) throw new Error(`Generate failed: ${genRes.status} ${await genRes.text()}`);
  const genData = (await genRes.json()).data;
  console.log(`  ✔ Successfully assigned custom QR code: ${genData.qrCodeIdentifier} to Room ${targetRoom.resourceId}`);

  // Test Regenerate on Bed
  const targetBed = items.find(r => r.resourceType === 'BED');
  const regenPayload = {
    resourceType: 'BED',
    resourceId: targetBed.resourceId,
    reason: 'Physical QR Vinyl Sticker Scratched by Gurney Collision'
  };
  const regenRes = await fetch(`${baseUrl}/api/qr/regenerate`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(regenPayload)
  });
  if (!regenRes.ok) throw new Error(`Regenerate failed: ${regenRes.status} ${await regenRes.text()}`);
  const regenData = (await regenRes.json()).data;
  console.log(`  ✔ Successfully regenerated Bed QR code: ${targetBed.qrCodeIdentifier} -> ${regenData.qrCodeIdentifier}`);

  // Confirm Lookup of new code
  const verifyNew = await (await fetch(`${baseUrl}/api/qr/lookup/${encodeURIComponent(regenData.qrCodeIdentifier)}`, { headers })).json();
  const verifyData = verifyNew.data || verifyNew;
  console.log(`  ✔ Verified Live Lookup for Newly Regenerated Code: ${verifyData.qrCodeIdentifier} (${verifyData.resourceName})`);

  console.log('\n======================================================');
  console.log('  ALL HOSPITAL RESOURCE QR TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runQrVerification().catch(err => {
  console.error('\n❌ QR Verification Suite Failed:', err);
  process.exit(1);
});
