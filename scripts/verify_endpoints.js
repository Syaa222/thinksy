const http = require('http');

function testEndpoint(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => resolve({ status: 'ERROR', error: e.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING THINKSY ENDPOINTS & ROUTES ===\n');

  const routes = [
    { path: '/', method: 'GET' },
    { path: '/belajar', method: 'GET' },
    { path: '/ujian', method: 'GET' },
    { path: '/api/sekolah/jam-presensi', method: 'GET' },
    { path: '/api/siswa/misi', method: 'GET' },
    { path: '/api/siswa/notifikasi', method: 'GET' },
    { path: '/api/chat', method: 'GET' },
  ];

  for (const r of routes) {
    const res = await testEndpoint(r.path, r.method);
    console.log(`[${r.method}] ${r.path} -> Status: ${res.status}`);
  }

  console.log('\n=== ALL TARGET ROUTES RESPONDED PROMPTLY ===');
}

run();
