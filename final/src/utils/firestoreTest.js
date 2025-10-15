import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
// Backend-only approach - no client-side Firestore

// Test Firestore connection and permissions
export const testFirestoreConnection = async () => {
  console.log('🔥 Testing Firestore connection...');
  
  try {
    // Test 1: Try to read from a test collection
    console.log('📖 Test 1: Reading from test collection...');
    const testCollection = collection(db, 'test');
    const testSnapshot = await getDocs(testCollection);
    console.log(`✅ Test collection read successful. Found ${testSnapshot.size} documents.`);
    
    // Test 2: Try to write to a test document
    console.log('✍️ Test 2: Writing to test document...');
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      message: 'Hello from admin panel',
      timestamp: serverTimestamp(),
      testPassed: true
    }, { merge: true });
    console.log('✅ Test document write successful.');
    
    // Test 3: Try to read the test document back
    console.log('📖 Test 3: Reading test document...');
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Test document read successful:', docSnap.data());
    } else {
      console.log('⚠️ Test document not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return false;
  }
};

// Create sample users for testing
export const createSampleUsers = async () => {
  console.log('👥 Creating sample users...');
  
  const sampleUsers = [
    {
      id: 'user1',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-15',
      address: '123 Main St, City, State 12345',
      gender: 'Male',
      points: 150,
      isBlocked: false,
      accountStatus: 'active',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user2', 
      email: 'jane.smith@example.com',
      displayName: 'Jane Smith',
      phoneNumber: '+1234567891',
      dateOfBirth: '1988-05-22',
      address: '456 Oak Ave, City, State 12346',
      gender: 'Female',
      points: 200,
      isBlocked: false,
      accountStatus: 'active',
      createdAt: new Date('2024-02-10').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user3',
      email: 'mike.wilson@example.com',
      displayName: 'Mike Wilson',
      phoneNumber: '+1234567892',
      dateOfBirth: '1992-11-08',
      address: '789 Pine St, City, State 12347',
      gender: 'Male',
      points: 75,
      isBlocked: true,
      accountStatus: 'blocked',
      blockReason: 'Violation of terms',
      blockedAt: new Date('2024-03-01').toISOString(),
      blockedBy: 'admin',
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-03-01').toISOString()
    }
  ];
  
  try {
    for (const user of sampleUsers) {
      const userDoc = doc(db, 'users', user.id);
      await setDoc(userDoc, user);
      console.log(`✅ Created user: ${user.displayName}`);
    }
    
    console.log('🎉 All sample users created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to create sample users:', error);
    return false;
  }
};

// Initialize test data (call this from your component)
export const initializeTestData = async () => {
  console.log('🚀 Initializing test data...');
  
  const connectionTest = await testFirestoreConnection();
  if (connectionTest) {
    const usersCreated = await createSampleUsers();
    return usersCreated;
  }
  
  return false;
};
