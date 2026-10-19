// Frontend & Proxy Integration Verification for Linen Management Module
const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING FRONTEND & PROXY INTEGRATION ===\n');

  // 1. Check index.html contains linen navigation and container
  const indexRes = await get('/');
  console.log('1. GET / status:', indexRes.status);
  const hasNavBtn = indexRes.data.includes('id="nav-btn-linen"');
  const hasTabPane = indexRes.data.includes('id="tab-linen"');
  const hasLinenCss = indexRes.data.includes('href="css/linen.css"');
  const hasLinenJs = indexRes.data.includes('src="js/linenManager.js"');
  console.log('   - Has Linen Nav Tab Button:', hasNavBtn);
  console.log('   - Has Linen Tab Pane:', hasTabPane);
  console.log('   - Has Linen CSS link:', hasLinenCss);
  console.log('   - Has Linen JS script:', hasLinenJs);
  if (!hasNavBtn || !hasTabPane || !hasLinenCss || !hasLinenJs) {
    throw new Error('index.html missing linen components');
  }

  // 2. Check standalone linen.html
  const linenHtmlRes = await get('/linen.html');
  console.log('2. GET /linen.html status:', linenHtmlRes.status);
  const hasStandaloneContainer = linenHtmlRes.data.includes('id="standalone-linen-container"');
  console.log('   - Has standalone-linen-container:', hasStandaloneContainer);
  if (linenHtmlRes.status !== 200 || !hasStandaloneContainer) {
    throw new Error('linen.html check failed');
  }

  // 3. Check linen.css static asset
  const cssRes = await get('/css/linen.css');
  console.log('3. GET /css/linen.css status:', cssRes.status, 'Length:', cssRes.data.length);
  if (cssRes.status !== 200 || cssRes.data.length < 500) {
    throw new Error('css/linen.css check failed');
  }

  // 4. Check linenManager.js static asset
  const jsRes = await get('/js/linenManager.js');
  console.log('4. GET /js/linenManager.js status:', jsRes.status, 'Length:', jsRes.data.length);
  if (jsRes.status !== 200 || jsRes.data.length < 1000) {
    throw new Error('js/linenManager.js check failed');
  }

  // 5. Check API proxy for linen
  const authRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'Admin@123456' })
  });
  const token = (await authRes.json()).data.token;

  const statsRes = await fetch('http://localhost:3000/api/linen/stats', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const stats = await statsRes.json();
  console.log('5. Proxied GET /api/linen/stats status:', statsRes.status, 'Total Linen Assets:', stats.data.totalLinen);

  const listRes = await fetch('http://localhost:3000/api/linen', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const list = await listRes.json();
  console.log('6. Proxied GET /api/linen status:', listRes.status, 'Assets count:', list.data.length);

  console.log('\n=== ALL FRONTEND & PROXY INTEGRATION CHECKS PASSED! ===');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
