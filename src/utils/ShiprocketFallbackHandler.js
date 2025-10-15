// Shiprocket API Fallback Handler
// Handles limited API permissions gracefully

const FALLBACK_COURIERS = [
  { id: 1, name: "BlueDart", is_surface: false, is_air: true },
  { id: 3, name: "Delhivery", is_surface: true, is_air: true },
  { id: 6, name: "DTDC", is_surface: true, is_air: true },
  { id: 12, name: "Ecom Express", is_surface: true, is_air: false }
];

const SERVICEABLE_AREAS = {
  "180001": { // Jammu (your pickup location)
    serviceable_states: [
      "Jammu and Kashmir", "Punjab", "Haryana", "Delhi", "Uttar Pradesh",
      "Rajasthan", "Himachal Pradesh", "Uttarakhand", "Madhya Pradesh",
      "Gujarat", "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh",
      "Telangana", "Kerala", "West Bengal", "Odisha", "Bihar", "Jharkhand"
    ],
    major_cities: [
      "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad",
      "Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kanpur",
      "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri"
    ]
  }
};

class ShiprocketFallbackHandler {
  
  // Handle wallet balance API limitation
  static async getWalletBalance(token) {
    try {
      const response = await fetch(`${SHIPROCKET_API_BASE}/account/details/wallet-balance`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else if (response.status === 403) {
        // Fallback: Return limited account info
        console.log("⚠️ Wallet balance API restricted. Using fallback.");
        return {
          success: false,
          fallback: true,
          message: "Wallet balance requires API upgrade. Contact Shiprocket support.",
          data: {
            balance: "Contact support for balance",
            status: "limited_access"
          }
        };
      } else {
        throw new Error(data.message || 'Wallet balance check failed');
      }
    } catch (error) {
      return {
        success: false,
        fallback: true,
        message: "Unable to fetch wallet balance. Using fallback mode.",
        error: error.message
      };
    }
  }

  // Handle courier list API limitation
  static async getCourierCompanies(token) {
    try {
      const response = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else if (response.status === 403) {
        // Fallback: Return standard courier list
        console.log("⚠️ Courier list API restricted. Using fallback couriers.");
        return {
          success: false,
          fallback: true,
          message: "Using standard courier list. Full list requires API upgrade.",
          data: {
            courier_companies: FALLBACK_COURIERS
          }
        };
      } else {
        throw new Error(data.message || 'Courier list fetch failed');
      }
    } catch (error) {
      return {
        success: false,
        fallback: true,
        message: "Unable to fetch courier list. Using fallback couriers.",
        data: {
          courier_companies: FALLBACK_COURIERS
        },
        error: error.message
      };
    }
  }

  // Handle serviceability API limitation
  static async checkServiceability(token, pickupPostcode, deliveryPostcode, weight = 1) {
    try {
      const response = await fetch(
        `${SHIPROCKET_API_BASE}/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else if (response.status === 403) {
        // Fallback: Basic serviceability check
        console.log("⚠️ Serviceability API restricted. Using basic fallback.");
        return this.getFallbackServiceability(pickupPostcode, deliveryPostcode);
      } else {
        throw new Error(data.message || 'Serviceability check failed');
      }
    } catch (error) {
      return this.getFallbackServiceability(pickupPostcode, deliveryPostcode);
    }
  }

  // Fallback serviceability logic
  static getFallbackServiceability(pickupPostcode, deliveryPostcode) {
    const pickupInfo = SERVICEABLE_AREAS[pickupPostcode];
    
    if (!pickupInfo) {
      return {
        success: false,
        fallback: true,
        message: "Pickup location not in fallback database. Contact support for serviceability.",
        data: { available_courier_companies: [] }
      };
    }

    // Basic logic: Most Indian pincodes are serviceable from major cities
    const isServiceable = deliveryPostcode.length === 6 && /^\d+$/.test(deliveryPostcode);
    
    if (isServiceable) {
      return {
        success: false,
        fallback: true,
        message: "Using basic serviceability check. Full check requires API upgrade.",
        data: {
          available_courier_companies: FALLBACK_COURIERS.map(courier => ({
            ...courier,
            estimated_delivery_days: "3-7",
            rate: 50, // Basic rate
            cod_available: true
          }))
        }
      };
    } else {
      return {
        success: false,
        fallback: true,
        message: "Invalid delivery pincode format.",
        data: { available_courier_companies: [] }
      };
    }
  }

  // Check API access level
  static async checkAPIAccess(token) {
    const tests = [];
    
    // Test wallet access
    try {
      const walletResponse = await fetch(`${SHIPROCKET_API_BASE}/account/details/wallet-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      tests.push({ endpoint: 'wallet', accessible: walletResponse.ok });
    } catch (error) {
      tests.push({ endpoint: 'wallet', accessible: false });
    }

    // Test courier access
    try {
      const courierResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      tests.push({ endpoint: 'courier', accessible: courierResponse.ok });
    } catch (error) {
      tests.push({ endpoint: 'courier', accessible: false });
    }

    // Test serviceability access
    try {
      const serviceResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability/?pickup_postcode=180001&delivery_postcode=110001&weight=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      tests.push({ endpoint: 'serviceability', accessible: serviceResponse.ok });
    } catch (error) {
      tests.push({ endpoint: 'serviceability', accessible: false });
    }

    const accessibleCount = tests.filter(t => t.accessible).length;
    const accessLevel = accessibleCount === 3 ? 'full' : accessibleCount > 0 ? 'partial' : 'limited';
    
    return {
      level: accessLevel,
      details: tests,
      recommendation: accessLevel === 'limited' ? 'Contact Shiprocket support for API upgrade' : null
    };
  }
}

module.exports = ShiprocketFallbackHandler;
