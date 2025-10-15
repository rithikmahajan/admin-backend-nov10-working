const CartAbandonment = require('../../models/CartAbandonment');
const admin = require('../../config/firebase-admin');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

class CartAbandonmentController {
  // Get all abandoned cart users with filters
  static async getAbandonedCarts(req, res) {
    try {
      const {
        dateRange = 'last 7 days',
        userType = 'all',
        countryRegion = 'all',
        sortBy = 'last active',
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        dateRange,
        userType,
        countryRegion
      };

      let query = CartAbandonment.getAbandonedCarts(filters);

      // Sorting
      let sortOptions = {};
      switch (sortBy) {
        case 'last active':
          sortOptions = { lastActive: -1 };
          break;
        case 'name':
          sortOptions = { userName: 1 };
          break;
        case 'email':
          sortOptions = { email: 1 };
          break;
        case 'cart value':
          sortOptions = { cartValue: -1 };
          break;
        default:
          sortOptions = { abandonedAt: -1 };
      }

      query = query.sort(sortOptions);

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await CartAbandonment.countDocuments(query.getQuery());
      
      const abandonedCarts = await query
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get statistics
      const stats = await CartAbandonmentController.getStatistics(filters);

      res.json({
        success: true,
        data: {
          abandonedCarts,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: total,
            limit: parseInt(limit)
          },
          stats,
          filters: {
            dateRange,
            userType,
            countryRegion,
            sortBy
          }
        }
      });

    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching abandoned cart data',
        error: error.message
      });
    }
  }

  // Get statistics for dashboard
  static async getStatistics(filters = {}) {
    try {
      const baseQuery = CartAbandonment.getAbandonedCarts(filters).getQuery();

      const [
        totalAbandoned,
        registeredUsers,
        guestUsers,
        avgCartValue,
        avgVisitTime
      ] = await Promise.all([
        CartAbandonment.countDocuments(baseQuery),
        CartAbandonment.countDocuments({ ...baseQuery, userType: 'registered' }),
        CartAbandonment.countDocuments({ ...baseQuery, userType: 'guest' }),
        CartAbandonment.aggregate([
          { $match: baseQuery },
          { $group: { _id: null, avgValue: { $avg: '$cartValue' } } }
        ]),
        CartAbandonment.aggregate([
          { $match: baseQuery },
          { $group: { _id: null, avgTime: { $avg: '$avgVisitTime' } } }
        ])
      ]);

      return {
        emptyCartStatus: totalAbandoned,
        registeredUsers: registeredUsers,
        guests: guestUsers,
        avgVisitTime: avgVisitTime.length > 0 ? `${Math.round(avgVisitTime[0].avgTime)} min` : '0 min',
        avgCartValue: avgCartValue.length > 0 ? avgCartValue[0].avgValue : 0
      };

    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        emptyCartStatus: 0,
        registeredUsers: 0,
        guests: 0,
        avgVisitTime: '0 min',
        avgCartValue: 0
      };
    }
  }

  // Sync users from Firebase
  static async syncFirebaseUsers(req, res) {
    try {
      console.log('Starting Firebase user sync...');
      
      const firebaseUsers = [];
      let nextPageToken;

      // Fetch all users from Firebase
      do {
        const result = await admin.auth().listUsers(1000, nextPageToken);
        firebaseUsers.push(...result.users);
        nextPageToken = result.pageToken;
      } while (nextPageToken);

      console.log(`Found ${firebaseUsers.length} Firebase users`);

      // Process users and check for abandoned carts
      const bulkOps = [];
      let syncedCount = 0;

      for (const user of firebaseUsers) {
        try {
          // Check if user has custom claims or cart data
          const customClaims = await admin.auth().getUser(user.uid)
            .then(userRecord => userRecord.customClaims || {});

          // Mock cart abandonment data - in real scenario, this would come from user session data
          const hasAbandonedCart = Math.random() > 0.7; // 30% chance of abandoned cart
          
          if (hasAbandonedCart) {
            const cartData = {
              userId: user.uid,
              firebaseUid: user.uid,
              email: user.email || `user${user.uid.slice(-8)}@example.com`,
              mobile: user.phoneNumber || null,
              userName: user.displayName || user.email?.split('@')[0] || `User${user.uid.slice(-6)}`,
              userType: user.emailVerified ? 'registered' : 'guest',
              dob: customClaims.dob ? new Date(customClaims.dob) : null,
              gender: customClaims.gender || ['M', 'F'][Math.floor(Math.random() * 2)],
              country: customClaims.country || ['US', 'IN', 'UK', 'CA'][Math.floor(Math.random() * 4)],
              region: customClaims.region || 'Unknown',
              cartItems: [
                {
                  itemId: `item_${Math.random().toString(36).substr(2, 9)}`,
                  itemName: ['T-Shirt', 'Jeans', 'Sneakers', 'Jacket'][Math.floor(Math.random() * 4)],
                  quantity: Math.floor(Math.random() * 3) + 1,
                  price: Math.floor(Math.random() * 100) + 20,
                  image: 'https://example.com/image.jpg'
                }
              ],
              cartValue: Math.floor(Math.random() * 200) + 50,
              lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
              avgVisitTime: Math.floor(Math.random() * 60) + 5, // 5-65 minutes
              sessionDuration: Math.floor(Math.random() * 30) + 5,
              abandonedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Last 3 days
              status: 'abandoned',
              recoveryAttempts: 0,
              pageViews: Math.floor(Math.random() * 20) + 1,
              referralSource: ['google', 'facebook', 'direct', 'email'][Math.floor(Math.random() * 4)],
              locationInfo: {
                country: customClaims.country || 'Unknown',
                city: 'Unknown',
                state: 'Unknown'
              }
            };

            bulkOps.push({
              updateOne: {
                filter: { firebaseUid: user.uid },
                update: { $set: cartData },
                upsert: true
              }
            });

            syncedCount++;
          }

        } catch (userError) {
          console.error(`Error processing user ${user.uid}:`, userError.message);
        }
      }

      // Execute bulk operations
      if (bulkOps.length > 0) {
        await CartAbandonment.bulkWrite(bulkOps);
      }

      console.log(`Sync completed. ${syncedCount} abandoned carts created/updated`);

      res.json({
        success: true,
        message: 'Firebase users synced successfully',
        data: {
          totalFirebaseUsers: firebaseUsers.length,
          abandonedCartsProcessed: syncedCount,
          bulkOperations: bulkOps.length
        }
      });

    } catch (error) {
      console.error('Error syncing Firebase users:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing Firebase users',
        error: error.message
      });
    }
  }

  // Export abandoned cart data to CSV/XLSX
  static async exportData(req, res) {
    try {
      const {
        format = 'csv',
        dateRange = 'last 7 days',
        userType = 'all',
        countryRegion = 'all'
      } = req.query;

      const filters = { dateRange, userType, countryRegion };
      const abandonedCarts = await CartAbandonment.getAbandonedCarts(filters)
        .sort({ abandonedAt: -1 })
        .lean();

      // Transform data for export
      const exportData = abandonedCarts.map(cart => ({
        'User ID': cart.userId,
        'Email': cart.email,
        'Mobile': cart.mobile || 'N/A',
        'User Name': cart.userName || 'N/A',
        'User Type': cart.userType,
        'DOB': cart.dob ? cart.dob.toISOString().split('T')[0] : 'N/A',
        'Gender': cart.gender || 'N/A',
        'Country': cart.country || 'N/A',
        'Region': cart.region || 'N/A',
        'Cart Value': cart.cartValue,
        'Cart Items': cart.cartItems.length,
        'Last Active': cart.lastActive.toISOString().split('T')[0],
        'Avg Visit Time (min)': cart.avgVisitTime,
        'Abandoned At': cart.abandonedAt.toISOString().split('T')[0],
        'Recovery Attempts': cart.recoveryAttempts,
        'Status': cart.status,
        'Page Views': cart.pageViews,
        'Referral Source': cart.referralSource || 'N/A'
      }));

      if (format === 'xlsx') {
        // Create XLSX file
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Abandoned Carts');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=abandoned-carts-${Date.now()}.xlsx`);
        res.send(buffer);
      } else {
        // Create CSV file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=abandoned-carts-${Date.now()}.csv`);
        res.send(csv);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message
      });
    }
  }

  // Send email to specific user
  static async sendEmail(req, res) {
    try {
      const { userId } = req.params;
      const { subject, message, type = 'recovery' } = req.body;

      const cartAbandonment = await CartAbandonment.findById(userId);
      if (!cartAbandonment) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Configure nodemailer (use your email service)
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: cartAbandonment.email,
        subject: subject || 'Complete Your Purchase - Items Still in Cart',
        html: message || `
          <h2>Don't forget your items!</h2>
          <p>Hi ${cartAbandonment.userName || 'Valued Customer'},</p>
          <p>You left ${cartAbandonment.cartItems.length} items in your cart worth $${cartAbandonment.cartValue}.</p>
          <p>Complete your purchase now to secure these items.</p>
          <a href="${process.env.FRONTEND_URL}/cart" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Purchase</a>
        `
      };

      await transporter.sendMail(mailOptions);
      await cartAbandonment.addEmailRecord(type);

      res.json({
        success: true,
        message: 'Email sent successfully'
      });

    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending email',
        error: error.message
      });
    }
  }

  // Send bulk emails
  static async sendBulkEmails(req, res) {
    try {
      const { 
        userIds, 
        subject = 'Complete Your Purchase', 
        message,
        filters = {} 
      } = req.body;

      let targetUsers;

      if (userIds && userIds.length > 0) {
        // Send to specific users
        targetUsers = await CartAbandonment.find({ _id: { $in: userIds } });
      } else {
        // Send to filtered users
        targetUsers = await CartAbandonment.getAbandonedCarts(filters).limit(100); // Limit for safety
      }

      const emailPromises = targetUsers.map(async (user) => {
        try {
          // Configure nodemailer
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject,
            html: message || `
              <h2>Complete Your Purchase</h2>
              <p>Hi ${user.userName || 'Valued Customer'},</p>
              <p>You have ${user.cartItems.length} items waiting in your cart.</p>
              <a href="${process.env.FRONTEND_URL}/cart">Complete Purchase</a>
            `
          };

          await transporter.sendMail(mailOptions);
          await user.addEmailRecord('bulk');
          return { success: true, userId: user._id };
        } catch (error) {
          return { success: false, userId: user._id, error: error.message };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      res.json({
        success: true,
        message: `Bulk emails sent successfully`,
        data: {
          total: targetUsers.length,
          successful,
          failed: targetUsers.length - successful
        }
      });

    } catch (error) {
      console.error('Error sending bulk emails:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending bulk emails',
        error: error.message
      });
    }
  }

  // Get user profile details
  static async getUserProfile(req, res) {
    try {
      const { userId } = req.params;

      const userProfile = await CartAbandonment.findById(userId);
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: userProfile
      });

    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const deletedUser = await CartAbandonment.findByIdAndDelete(userId);
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  // Get filter options (countries, regions, etc.)
  static async getFilterOptions(req, res) {
    try {
      const [countries, regions] = await Promise.all([
        CartAbandonment.distinct('country'),
        CartAbandonment.distinct('region')
      ]);

      const filterOptions = {
        dateRange: [
          { value: 'last 7 days', label: 'Last 7 days' },
          { value: 'last 30 days', label: 'Last 30 days' },
          { value: 'last 90 days', label: 'Last 90 days' }
        ],
        userType: [
          { value: 'all', label: 'All' },
          { value: 'registered', label: 'Registered' },
          { value: 'guest', label: 'Guest' }
        ],
        countryRegion: [
          { value: 'all', label: 'All' },
          ...countries.filter(c => c).map(country => ({
            value: country,
            label: country
          }))
        ],
        sortBy: [
          { value: 'last active', label: 'Last Active' },
          { value: 'name', label: 'Name' },
          { value: 'email', label: 'Email' },
          { value: 'cart value', label: 'Cart Value' }
        ]
      };

      res.json({
        success: true,
        data: filterOptions
      });

    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching filter options',
        error: error.message
      });
    }
  }
}

module.exports = CartAbandonmentController;
