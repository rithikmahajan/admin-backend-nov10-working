// Admin Setup Service - Permanent Solution
const bcrypt = require('bcryptjs');
const config = require('../config/environment');
const User = require('../models/User');

/**
 * Ensures admin user exists with predefined credentials
 * Runs automatically on server startup
 */
class AdminSetupService {
    constructor() {
        this.adminCredentials = {
            phone: config.admin.phone,
            password: config.admin.password,
            name: config.admin.name,
            email: config.admin.email
        };
    }

    /**
     * Initialize admin user on server startup
     */
    async initializeAdmin() {
        try {
            console.log('🔧 Initializing admin user setup...');
            
            // Check if the specific admin user exists
            const specificAdmin = await User.findOne({ 
                phNo: this.adminCredentials.phone, 
                isAdmin: true 
            });
            
            if (specificAdmin) {
                console.log('✅ Specific admin user already exists:', {
                    id: specificAdmin._id,
                    phone: specificAdmin.phNo,
                    name: specificAdmin.name,
                    isAdmin: specificAdmin.isAdmin
                });
                return { success: true, message: 'Admin user already exists', user: specificAdmin };
            }

            // Check if any other admin exists
            const existingAdmin = await User.findOne({ isAdmin: true });
            if (existingAdmin && existingAdmin.phNo !== this.adminCredentials.phone) {
                console.log('⚠️ Different admin user exists, updating to use correct credentials...');
                return await this.upgradeToAdmin(existingAdmin);
            }

            // No admin exists, create one
            return await this.createAdminUser();

        } catch (error) {
            console.error('❌ Error during admin initialization:', error);
            throw error;
        }
    }

    /**
     * Create admin user with predefined credentials
     */
    async createAdminUser() {
        try {
            const { phone, password, name, email } = this.adminCredentials;
            
            console.log('📝 Creating admin user with phone:', phone);
            
            // Check if user with this phone already exists (but not admin)
            let existingUser = await User.findOne({ phNo: phone });
            
            if (existingUser) {
                console.log('📝 User with phone exists, upgrading to admin...');
                return await this.upgradeToAdmin(existingUser);
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new admin user
            const newAdminUser = new User({
                name,
                phNo: phone,
                password: hashedPassword,
                email,
                isAdmin: true,
                isVerified: true,
                isPhoneVerified: true,
                isEmailVerified: true,
                authProvider: 'email',
                preferredCountry: 'IN',
                preferredCurrency: 'INR'
            });
            
            const savedUser = await newAdminUser.save();
            
            console.log('✅ Admin user created successfully:', {
                id: savedUser._id,
                phone: savedUser.phNo,
                name: savedUser.name,
                isAdmin: savedUser.isAdmin
            });

            return {
                success: true,
                message: 'Admin user created successfully',
                user: savedUser
            };
            
        } catch (error) {
            // Handle duplicate key error for email
            if (error.code === 11000 && error.keyPattern?.email) {
                console.log('📝 Email already exists, finding and upgrading user...');
                const existingUserByEmail = await User.findOne({ email: this.adminCredentials.email });
                if (existingUserByEmail) {
                    return await this.upgradeToAdmin(existingUserByEmail);
                }
            }
            
            console.error('❌ Error creating admin user:', error);
            throw error;
        }
    }

    /**
     * Upgrade existing user to admin
     */
    async upgradeToAdmin(existingUser) {
        try {
            const { phone, password, name, email } = this.adminCredentials;
            
            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Update existing user to be admin with correct credentials
            const updatedUser = await User.findOneAndUpdate(
                { _id: existingUser._id },
                { 
                    phNo: phone,
                    password: hashedPassword,
                    name,
                    email,
                    isAdmin: true,
                    isVerified: true,
                    isPhoneVerified: true,
                    isEmailVerified: true
                },
                { new: true }
            );
            
            console.log('✅ User upgraded to admin:', {
                id: updatedUser._id,
                phone: updatedUser.phNo,
                name: updatedUser.name,
                isAdmin: updatedUser.isAdmin
            });

            return {
                success: true,
                message: 'User upgraded to admin successfully',
                user: updatedUser
            };
            
        } catch (error) {
            console.error('❌ Error upgrading user to admin:', error);
            throw error;
        }
    }

    /**
     * Reset admin password (for maintenance)
     */
    async resetAdminPassword(newPassword = null) {
        try {
            const passwordToUse = newPassword || this.adminCredentials.password;
            const hashedPassword = await bcrypt.hash(passwordToUse, 10);
            
            const adminUser = await User.findOneAndUpdate(
                { phNo: this.adminCredentials.phone },
                { password: hashedPassword },
                { new: true }
            );
            
            if (!adminUser) {
                throw new Error('Admin user not found');
            }
            
            console.log('✅ Admin password reset successfully');
            return { success: true, message: 'Admin password reset successfully' };
            
        } catch (error) {
            console.error('❌ Error resetting admin password:', error);
            throw error;
        }
    }
}

module.exports = new AdminSetupService();
