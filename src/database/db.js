const mongoose = require("mongoose")
const config = require('../config/environment')
const adminSetupService = require('../services/adminSetupService')

exports.connectToDB = async () => {
    try {
        await mongoose.connect(config.database.uri, config.database.options)
        console.log('✅ Connected to DB:', config.database.uri.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB');
        
        // Initialize admin user after database connection
        await adminSetupService.initializeAdmin();
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        // Don't throw the error to prevent server crash
        // Just log it and continue
    }
}