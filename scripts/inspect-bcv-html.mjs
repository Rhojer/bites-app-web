import https from 'https';

function getBcvHtml() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.bcv.org.ve',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function test() {
  const { data } = await getBcvHtml();
  // Find dolar or USD or tasas
  const idx = data.indexOf('USD');
  if (idx !== -1) {
    console.log('Snippet around USD:');
    console.log(data.substring(idx - 100, idx + 400));
  } else {
    console.log('No USD found, searching for id="dolar" or similar:');
    const idx2 = data.indexOf('dolar');
    console.log('dolar index:', idx2);
    if (idx2 !== -1) {
      console.log(data.substring(idx2 - 100, idx2 + 400));
    }
  }
}

test();
