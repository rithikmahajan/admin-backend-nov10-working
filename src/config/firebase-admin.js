const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseAdmin;

try {
    // Path to service account key
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    
    // Check if Firebase Admin is already initialized
    if (!admin.apps.length) {
        const serviceAccount = require(serviceAccountPath);
        
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        
        console.log('✅ Firebase Admin SDK initialized successfully');
        console.log('📋 Project ID:', serviceAccount.project_id);
    } else {
        firebaseAdmin = admin.app();
        console.log('✅ Firebase Admin SDK already initialized');
    }
} catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK');
}

module.exports = firebaseAdmin;
