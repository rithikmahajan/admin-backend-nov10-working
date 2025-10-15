// Environment Configuration Manager
const path = require('path');

// Load environment based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';

// Load the appropriate .env file
require('dotenv').config({ 
    path: path.resolve(process.cwd(), `.env.${environment}`) 
});

// Also load default .env if exists
require('dotenv').config();

class EnvironmentConfig {
    constructor() {
        this.environment = environment;
        console.log(`🔧 Environment: ${this.environment}`);
        console.log(`🔧 Config file: .env.${this.environment}`);
    }

    // Database Configuration
    get database() {
        return {
            uri: process.env.MONGO_URI || 'mongodb://localhost:27017/yoraa',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        };
    }

    // Server Configuration
    get server() {
        return {
            port: parseInt(process.env.PORT) || 8081,
            host: process.env.HOST || '0.0.0.0',
            environment: this.environment,
            isDevelopment: this.environment === 'development',
            isProduction: this.environment === 'production'
        };
    }

    // Admin Configuration
    get admin() {
        return {
            phone: process.env.ADMIN_PHONE || '8717000084',
            password: process.env.ADMIN_PASSWORD || 'R@2727thik',
            name: process.env.ADMIN_NAME || 'Admin User',
            email: process.env.ADMIN_EMAIL || 'admin@yoraa.com'
        };
    }

    // API Configuration
    get api() {
        return {
            baseUrl: process.env.API_BASE_URL || `http://localhost:${this.server.port}/api`,
            frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
        };
    }

    // Security Configuration
    get security() {
        return {
            jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
            bcryptRounds: 10
        };
    }

    // External Services Configuration
    get services() {
        return {
            razorpay: {
                keyId: process.env.RAZORPAY_KEY_ID,
                keySecret: process.env.RAZORPAY_KEY_SECRET
            },
            aws: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'ap-south-1',
                bucketName: process.env.AWS_BUCKET_NAME
            },
            firebase: {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                clientId: process.env.FIREBASE_CLIENT_ID
            },
            twilio: {
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN
            },
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };
    }

    // CORS Configuration
    get cors() {
        const developmentOrigins = [
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://localhost:3002',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:3002'
        ];

        const productionOrigins = [
            this.api.frontendUrl,
            'https://your-frontend-domain.com',
            'http://185.193.19.244:3001'
        ];

        return {
            origin: this.environment === 'development' 
                ? developmentOrigins 
                : productionOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type', 
                'Authorization', 
                'X-Requested-With', 
                'Accept', 
                'User-Agent',
                'x-admin-token'  // Added to allow admin token header
            ]
        };
    }

    // Validation
    validate() {
        const requiredVars = ['MONGO_URI'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
            if (this.environment === 'production') {
                throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
            }
        }

        console.log(`✅ Environment configuration loaded successfully`);
        console.log(`📊 Database: ${this.database.uri.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB'}`);
        console.log(`🌐 API URL: ${this.api.baseUrl}`);
        console.log(`👤 Admin Phone: ${this.admin.phone}`);
    }
}

module.exports = new EnvironmentConfig();
