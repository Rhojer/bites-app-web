import https from 'https';

// Desactivar temporalmente verificación SSL si el certificado de BCV tiene problemas o es autofirmado
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchBCV() {
  try {
    console.log('Fetching BCV...');
    const response = await fetch('https://www.bcv.org.ve/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      // @ts-ignore
      agent
    });

    console.log('BCV Status:', response.status);
    const html = await response.text();
    
    // El BCV tiene la estructura: <div id="dolar"> ... <strong> 36,4500 </strong> ... </div>
    const dolarBlock = html.split('id="dolar"')[1]?.split('</div>')[0];
    if (dolarBlock) {
      const match = dolarBlock.match(/<strong>\s*([0-9.,]+)\s*<\/strong>/);
      if (match) {
        const rateStr = match[1].replace(',', '.').trim();
        const rate = parseFloat(rateStr);
        console.log('✅ Tasa BCV Extraída:', rate);
        return rate;
      }
    }
    console.log('No regex match on id="dolar", searching raw regex...');
    const matchFallback = html.match(/USD[\s\S]*?<strong>\s*([0-9.,]+)\s*<\/strong>/i);
    console.log('Fallback match:', matchFallback ? matchFallback[1] : 'None');
  } catch (err) {
    console.error('Error fetching BCV:', err.message);
  }
}

// También probar API de respaldo de tasa BCV venezolana muy usada y abierta:
async function fetchBackupAPIs() {
  try {
    console.log('\nTesting Backup Public API (pydolarve / ve.dolarapi.com)...');
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (res.ok) {
      const data = await res.json();
      console.log('✅ ve.dolarapi.com BCV rate:', data.promedio, data.fechaActualizacion);
      return data.promedio;
    }
  } catch (err) {
    console.log('Backup 1 failed:', err.message);
  }

  try {
    const res2 = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv');
    if (res2.ok) {
      const data2 = await res2.json();
      console.log('✅ pydolarve BCV rate:', data2.monitors?.usd?.price);
      return data2.monitors?.usd?.price;
    }
  } catch (err) {
    console.log('Backup 2 failed:', err.message);
  }
}

async function main() {
  await fetchBCV();
  await fetchBackupAPIs();
}
main();
