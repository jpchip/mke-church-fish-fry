import fetch from 'node-fetch';

async function checkPage() {
  try {
    console.log('Fetching http://localhost:4173/browse...\n');
    
    const response = await fetch('http://localhost:4173/browse');
    const html = await response.text();
    
    console.log('=== HTTP STATUS ===');
    console.log(response.status, response.statusText);
    
    console.log('\n=== HTML CONTENT ===');
    console.log(html);
    
    console.log('\n=== CHECKING ASSETS ===');
    
    // Check if database file is accessible
    const dbResponse = await fetch('http://localhost:4173/fish_fry.db');
    console.log('fish_fry.db:', dbResponse.status, dbResponse.statusText, `(${dbResponse.headers.get('content-length')} bytes)`);
    
    // Check if WASM file is accessible
    const wasmResponse = await fetch('http://localhost:4173/sql-wasm.wasm');
    console.log('sql-wasm.wasm:', wasmResponse.status, wasmResponse.statusText, `(${wasmResponse.headers.get('content-length')} bytes)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPage();
