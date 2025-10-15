// Admin functionality test
import { ADMIN_CONFIG, isAdmin } from '../config/firebase';

export const testAdminFunctionality = () => {
  console.log('👑 Testing Admin Functionality...');
  
  // Test admin email
  const emailTest = isAdmin(ADMIN_CONFIG.adminEmail, null);
  console.log(`Email test (${ADMIN_CONFIG.adminEmail}):`, emailTest ? '✅ Admin' : '❌ Not Admin');
  
  // Test admin phone
  const phoneTest = isAdmin(null, ADMIN_CONFIG.adminPhone);
  console.log(`Phone test (${ADMIN_CONFIG.adminPhone}):`, phoneTest ? '✅ Admin' : '❌ Not Admin');
  
  // Test non-admin credentials
  const nonAdminEmailTest = isAdmin('test@example.com', null);
  console.log('Non-admin email test:', nonAdminEmailTest ? '❌ False positive' : '✅ Correctly rejected');
  
  const nonAdminPhoneTest = isAdmin(null, '9999999999');
  console.log('Non-admin phone test:', nonAdminPhoneTest ? '❌ False positive' : '✅ Correctly rejected');
  
  return {
    adminEmail: emailTest,
    adminPhone: phoneTest,
    nonAdminEmail: !nonAdminEmailTest,
    nonAdminPhone: !nonAdminPhoneTest
  };
};
