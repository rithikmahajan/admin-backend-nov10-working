#!/usr/bin/env node

/**
 * Shiprocket IP Whitelist Helper
 * Generates support email with your IP addresses
 */

const fetch = require('node-fetch');
const os = require('os');

async function getCurrentIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Could not fetch IP:', error.message);
    return 'Unable to detect';
  }
}

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  
  return ips;
}

async function generateSupportEmail() {
  console.log('🔍 Gathering IP Address Information...\n');
  
  const publicIP = await getCurrentIP();
  const localIPs = getLocalIPs();
  
  console.log('📍 Your IP Addresses:');
  console.log('====================');
  console.log(`Public IP (Internet): ${publicIP}`);
  console.log(`Local IPs (Network):  ${localIPs.join(', ')}\n`);
  
  console.log('📧 COPY THIS EMAIL AND SEND TO: support@shiprocket.in');
  console.log('========================================================\n');
  
  const emailContent = `Subject: Enable API Access & IP Whitelisting - Company ID 5783639

Dear Shiprocket Support Team,

I am experiencing 403 "Unauthorized! You do not have the required permissions[IP]" 
errors when attempting to create orders via the Shiprocket API.

Account Details:
- Email: contact@yoraa.in
- Company ID: 5783639
- Company Name: YORAA APPARELS PRIVATE LIMITED
- User ID: 5996773

Current Issue:
- Endpoint: POST /v1/external/orders/create/adhoc
- Error: "Unauthorized! You do not have the required permissions[IP]"
- Authentication: Working (token generation successful)
- Order Creation: Failing with 403 error

Request:
1. Enable full API access for order creation and management
2. Whitelist the following IP address for API access:
   - Development/Production IP: ${publicIP}
3. Remove any IP-based restrictions on my account
4. Confirm if there are any additional account verification steps needed

Technical Details:
- Using main account credentials for API authentication
- Following Shiprocket API documentation
- Backend properly implemented with token management
- Issue is specifically related to IP restrictions

Please enable unrestricted API access or whitelist the IP address mentioned above.

Best regards,
Rithik Mahajan
contact@yoraa.in
Phone: 7006114695`;

  console.log(emailContent);
  console.log('\n========================================================\n');
  
  console.log('✅ Next Steps:');
  console.log('1. Copy the email content above');
  console.log('2. Send to: support@shiprocket.in');
  console.log('3. OR visit: https://app.shiprocket.in/');
  console.log('   - Go to Settings → API');
  console.log('   - Look for IP Whitelisting section');
  console.log(`   - Add IP: ${publicIP}`);
  console.log('\n4. Expected response time: 24-48 hours');
  console.log('\n💡 While waiting, you can still:');
  console.log('   - Use Shiprocket dashboard to create orders manually');
  console.log('   - Verify pickup locations are configured');
  console.log('   - Check account verification status\n');
  
  // Also create a text file
  const fs = require('fs');
  const filename = 'shiprocket-support-email.txt';
  fs.writeFileSync(filename, emailContent);
  console.log(`📄 Email content saved to: ${filename}\n`);
}

// Run the helper
generateSupportEmail().catch(console.error);
