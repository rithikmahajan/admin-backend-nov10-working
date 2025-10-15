/**
 * Simple Shiprocket Authentication Test
 * Tests if the updated credentials work
 */

const https = require('https');

const credentials = {
  email: 'support@yoraa.in',
  password: 'R@0621thik'
};

console.log('\n🔐 Testing Shiprocket Authentication');
console.log('=====================================');
console.log('Email:', credentials.email);
console.log('Password:', credentials.password.substring(0, 3) + '****' + credentials.password.substring(credentials.password.length - 2));
console.log('=====================================\n');

const postData = JSON.stringify({
  email: credentials.email,
  password: credentials.password
});

const options = {
  hostname: 'apiv2.shiprocket.in',
  port: 443,
  path: '/v1/external/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Response Status:', res.statusCode);
    console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
    console.log('\n📦 Response Body:');
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.token) {
        console.log('\n✅ ✅ ✅ AUTHENTICATION SUCCESSFUL! ✅ ✅ ✅');
        console.log('\n🎯 Shiprocket Token Received:');
        console.log('   ' + jsonData.token.substring(0, 80) + '...');
        console.log('\n✅ Updated credentials (support@yoraa.in / R@0621thik) are WORKING!');
        console.log('✅ The backend will now be able to create Shiprocket orders!');
      } else {
        console.log('\n❌ AUTHENTICATION FAILED');
        console.log('❌ No token received in response');
      }
    } catch (e) {
      console.log(data);
      console.log('\n❌ Failed to parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.write(postData);
req.end();
