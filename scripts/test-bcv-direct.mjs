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
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('BCV Timeout'));
    });
    req.end();
  });
}

async function test() {
  try {
    const res = await getBcvHtml();
    console.log('BCV https.get status:', res.status);
    const html = res.data;
    const match = html.match(/id="dolar"[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i) ||
                  html.match(/dolar[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i);
    console.log('BCV Scraped Rate:', match ? match[1].replace(',', '.') : 'No match');
  } catch (err) {
    console.log('Direct BCV https.get failed:', err.message);
  }
}

test();
