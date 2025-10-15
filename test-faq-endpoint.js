/**
 * FAQ Endpoint Test Script
 * Tests the FAQ endpoints and adds sample data if database is empty
 */

const mongoose = require('mongoose');
const FAQ = require('./src/models/FAQ');

// Load environment configuration
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yoraa';
const API_URL = process.env.API_BASE_URL || 'http://localhost:8001/api';

// Sample FAQ data
const sampleFaqs = [
  {
    title: 'WHAT DO I NEED TO KNOW BEFORE SIGNING UP TO THE YORAA MEMBERSHIP?',
    detail: 'All your purchases in store and online are rewarded with points. To collect points in store, always remember to scan your membership ID via the H&M app. You can also earn points by completing your profile, earning you 20 points, by re-activating your membership card, earning you 100 points and by shopping. Points can be used both in-store and online. If you have previously joined the membership on your H&M account, your membership is valid on your YORAA account as well. Membership is valid up to 24 months after your last activity.',
    category: 'membership',
    isActive: true,
    priority: 1
  },
  {
    title: 'FOR HOW LONG ARE MY POINTS VALID?',
    detail: 'Your points are valid for 12 months from the date they were earned. After 12 months, unused points will expire. Make sure to use your points before they expire to get the most value from your membership.',
    category: 'points',
    isActive: true,
    priority: 2
  },
  {
    title: 'WHEN DO I REACH PLUS LEVEL?',
    detail: 'You reach PLUS level when you have accumulated 1000 points or more in a 12-month period. Once you reach PLUS level, you will enjoy exclusive benefits such as free shipping, early access to sales, and special member-only offers.',
    category: 'membership',
    isActive: true,
    priority: 3
  },
  {
    title: 'HOW DO BONUS VOUCHERS WORK?',
    detail: 'Bonus vouchers are special rewards given to our valued members. They can be used on your next purchase to get a discount. You will receive bonus vouchers via email or in your account when you qualify. Simply apply the voucher code at checkout to redeem your discount.',
    category: 'points',
    isActive: true,
    priority: 4
  },
  {
    title: "WHY HAVEN'T I RECEIVED MY BONUS VOUCHER YET?",
    detail: 'Bonus vouchers are typically sent within 24-48 hours after qualifying. Please check your email (including spam folder) and your account inbox. If you still haven\'t received your voucher after 48 hours, please contact our customer support team for assistance.',
    category: 'points',
    isActive: true,
    priority: 5
  },
  {
    title: 'HOW LONG WILL I KEEP THE PLUS STATUS?',
    detail: 'Your PLUS status is valid for 12 months from the date you reached it. To maintain your PLUS status, you need to accumulate 1000 points again within the next 12-month period. Your membership benefits will continue as long as you maintain the required point threshold.',
    category: 'membership',
    isActive: true,
    priority: 6
  },
  {
    title: 'HOW DO I TRACK MY ORDERS?',
    detail: 'You can track your orders by logging into your account and viewing the "My Orders" section. Each order will have a tracking number that you can use to monitor your shipment. You will also receive email notifications with tracking updates.',
    category: 'orders',
    isActive: true,
    priority: 7
  },
  {
    title: 'WHAT IS YOUR RETURN POLICY?',
    detail: 'We offer a 30-day return policy on most items. Items must be unused, unworn, and in their original packaging with tags attached. To initiate a return, log into your account and select the order you wish to return. Follow the instructions to generate a return label.',
    category: 'returns',
    isActive: true,
    priority: 8
  },
  {
    title: 'WHAT PAYMENT METHODS DO YOU ACCEPT?',
    detail: 'We accept various payment methods including credit/debit cards (Visa, Mastercard, American Express), UPI, net banking, and digital wallets. All payments are processed securely through our encrypted payment gateway.',
    category: 'payments',
    isActive: true,
    priority: 9
  },
  {
    title: 'HOW DO I UPDATE MY ACCOUNT INFORMATION?',
    detail: 'You can update your account information by logging in and going to "My Profile". From there, you can edit your personal details, shipping addresses, and payment methods. Make sure to save your changes after updating.',
    category: 'account',
    isActive: true,
    priority: 10
  }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAndAddFaqs() {
  try {
    const count = await FAQ.countDocuments();
    console.log(`\n📊 Current FAQ count: ${count}`);

    if (count === 0) {
      console.log('\n📝 Database is empty. Adding sample FAQs...');
      
      for (const faq of sampleFaqs) {
        const newFaq = new FAQ(faq);
        await newFaq.save();
        console.log(`   ✅ Added: ${faq.title.substring(0, 50)}...`);
      }
      
      console.log(`\n✅ Successfully added ${sampleFaqs.length} sample FAQs`);
    } else {
      console.log('\n✅ FAQs already exist in database');
      
      // Show first 3 FAQs
      const faqs = await FAQ.find().limit(3).select('title category isActive');
      console.log('\n📋 Sample FAQs:');
      faqs.forEach((faq, index) => {
        console.log(`   ${index + 1}. ${faq.title.substring(0, 60)}...`);
        console.log(`      Category: ${faq.category} | Active: ${faq.isActive}`);
      });
    }
  } catch (error) {
    console.error('❌ Error managing FAQs:', error);
    throw error;
  }
}

async function testFaqEndpoint() {
  console.log('\n🧪 Testing FAQ Endpoint...\n');
  
  const fetch = require('node-fetch');
  
  try {
    // Test 1: Get all FAQs
    console.log('Test 1: GET /api/faqs');
    const response1 = await fetch(`${API_URL}/faqs`);
    const data1 = await response1.json();
    
    if (response1.ok && data1.success) {
      console.log(`   ✅ Success! Retrieved ${data1.faqs?.length || 0} FAQs`);
      console.log(`   📊 Pagination: Page ${data1.data?.pagination?.currentPage} of ${data1.data?.pagination?.totalPages}`);
    } else {
      console.log(`   ❌ Failed:`, data1.message);
    }

    // Test 2: Get FAQ categories
    console.log('\nTest 2: GET /api/faqs/categories');
    const response2 = await fetch(`${API_URL}/faqs/categories`);
    const data2 = await response2.json();
    
    if (response2.ok && data2.success) {
      console.log(`   ✅ Success! Retrieved ${data2.data?.categories?.length || 0} categories`);
      console.log(`   📊 Total FAQs: ${data2.data?.total || 0}`);
      if (data2.data?.categories) {
        data2.data.categories.forEach(cat => {
          console.log(`      - ${cat.label}: ${cat.count} FAQs`);
        });
      }
    } else {
      console.log(`   ❌ Failed:`, data2.message);
    }

    // Test 3: Get FAQs by category
    console.log('\nTest 3: GET /api/faqs/category/membership');
    const response3 = await fetch(`${API_URL}/faqs/category/membership`);
    const data3 = await response3.json();
    
    if (response3.ok && data3.success) {
      console.log(`   ✅ Success! Retrieved ${data3.faqs?.length || 0} membership FAQs`);
    } else {
      console.log(`   ❌ Failed:`, data3.message);
    }

    // Test 4: Search FAQs
    console.log('\nTest 4: GET /api/faqs/search?q=points');
    const response4 = await fetch(`${API_URL}/faqs/search?q=points`);
    const data4 = await response4.json();
    
    if (response4.ok && data4.success) {
      console.log(`   ✅ Success! Found ${data4.faqs?.length || 0} FAQs matching "points"`);
    } else {
      console.log(`   ❌ Failed:`, data4.message);
    }

    console.log('\n✅ All endpoint tests completed!');
    
  } catch (error) {
    console.error('\n❌ Error testing endpoints:', error.message);
    console.log('\n💡 Make sure the server is running on', API_URL);
  }
}

async function deleteDuplicates() {
  try {
    console.log('\n🧹 Checking for duplicate FAQs...');
    
    const faqs = await FAQ.find();
    const seen = new Set();
    let deletedCount = 0;
    
    for (const faq of faqs) {
      const key = `${faq.title}_${faq.category}`;
      if (seen.has(key)) {
        await FAQ.findByIdAndDelete(faq._id);
        deletedCount++;
        console.log(`   🗑️  Deleted duplicate: ${faq.title.substring(0, 50)}...`);
      } else {
        seen.add(key);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`\n✅ Deleted ${deletedCount} duplicate FAQs`);
    } else {
      console.log(`\n✅ No duplicates found`);
    }
  } catch (error) {
    console.error('❌ Error deleting duplicates:', error);
  }
}

async function main() {
  console.log('🚀 FAQ Database & Endpoint Test\n');
  console.log('Configuration:');
  console.log(`   MongoDB: ${MONGO_URI}`);
  console.log(`   API URL: ${API_URL}`);
  
  try {
    await connectDB();
    
    // Clean up duplicates first
    await deleteDuplicates();
    
    // Check and add FAQs if needed
    await checkAndAddFaqs();
    
    // Test the endpoints
    await testFaqEndpoint();
    
    console.log('\n✅ All operations completed successfully!');
    console.log('\n📱 Mobile App Configuration:');
    console.log(`   API_BASE_URL = "${API_URL}"`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Update mobile app API URL to:', API_URL);
    console.log('   2. Clear mobile app cache (AsyncStorage)');
    console.log('   3. Remove any default/hardcoded FAQ data');
    console.log('   4. Test the FAQ screen in the app');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
main();
