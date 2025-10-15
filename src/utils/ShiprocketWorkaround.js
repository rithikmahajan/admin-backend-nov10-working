// Shiprocket Temporary Workaround - Use while waiting for API permissions
// Add this to your OrderController.js to handle 403 errors gracefully

const FALLBACK_SHIPROCKET_DATA = {
  // Standard couriers available on most Shiprocket accounts
  couriers: [
    { id: 1, name: "BlueDart", air: true, surface: false, cod: true },
    { id: 3, name: "Delhivery", air: true, surface: true, cod: true },
    { id: 6, name: "DTDC", air: true, surface: true, cod: true },
    { id: 12, name: "Ecom Express", air: false, surface: true, cod: true },
    { id: 15, name: "FedEx", air: true, surface: false, cod: false }
  ],

  // Basic serviceability for Indian pincodes from Jammu
  serviceableStates: [
    "Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Rajasthan", 
    "Gujarat", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal",
    "Madhya Pradesh", "Andhra Pradesh", "Telangana", "Kerala", "Odisha"
  ],

  // Estimated rates (basic)
  baseRates: {
    metro: 50,      // Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
    tier1: 60,      // State capitals and major cities
    tier2: 80,      // District headquarters
    tier3: 120      // Rural areas
  }
};

// Enhanced getShiprocketToken with fallback handling
async function getShiprocketTokenWithFallback() {
  try {
    const token = await getShiprocketToken(); // Your existing function
    
    // Test if token has full permissions
    const testResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {
      token,
      hasFullAccess: testResponse.ok,
      limitations: testResponse.ok ? [] : ['courier', 'serviceability', 'orders', 'wallet']
    };
    
  } catch (error) {
    throw error;
  }
}

// Fallback courier list function
async function getCourierListWithFallback(token) {
  try {
    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 403) {
      console.log("⚠️ Using fallback courier list due to API restrictions");
      return {
        success: false,
        fallback: true,
        courier_companies: FALLBACK_SHIPROCKET_DATA.couriers,
        message: "Limited API access - using standard couriers. Contact Shiprocket support for full access."
      };
    } else {
      throw new Error(`Courier API error: ${response.status}`);
    }
  } catch (error) {
    console.log("⚠️ Using fallback courier list due to error:", error.message);
    return {
      success: false,
      fallback: true,
      courier_companies: FALLBACK_SHIPROCKET_DATA.couriers,
      message: "API temporarily unavailable - using cached couriers"
    };
  }
}

// Fallback serviceability check
async function checkServiceabilityWithFallback(token, pickupPin, deliveryPin, weight = 1) {
  try {
    const response = await fetch(
      `${SHIPROCKET_API_BASE}/courier/serviceability/?pickup_postcode=${pickupPin}&delivery_postcode=${deliveryPin}&weight=${weight}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 403) {
      console.log("⚠️ Using fallback serviceability check");
      return getFallbackServiceability(pickupPin, deliveryPin, weight);
    } else {
      throw new Error(`Serviceability API error: ${response.status}`);
    }
  } catch (error) {
    console.log("⚠️ Using fallback serviceability due to error:", error.message);
    return getFallbackServiceability(pickupPin, deliveryPin, weight);
  }
}

function getFallbackServiceability(pickupPin, deliveryPin, weight) {
  // Basic serviceability logic
  const isValidPin = /^\d{6}$/.test(deliveryPin);
  
  if (!isValidPin) {
    return {
      success: false,
      message: "Invalid delivery pincode format",
      available_courier_companies: []
    };
  }

  // Determine city tier based on pincode (simplified)
  const metroAreas = ['110', '400', '560', '600', '700', '500']; // Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
  const tier1Areas = ['141', '160', '201', '302', '380', '411']; // Punjab, Chandigarh, Noida, Jaipur, Ahmedabad, Pune
  
  const pinPrefix = deliveryPin.substring(0, 3);
  let tier = 'tier3';
  let rate = FALLBACK_SHIPROCKET_DATA.baseRates.tier3;
  
  if (metroAreas.includes(pinPrefix)) {
    tier = 'metro';
    rate = FALLBACK_SHIPROCKET_DATA.baseRates.metro;
  } else if (tier1Areas.includes(pinPrefix)) {
    tier = 'tier1';
    rate = FALLBACK_SHIPROCKET_DATA.baseRates.tier1;
  } else {
    tier = 'tier2';
    rate = FALLBACK_SHIPROCKET_DATA.baseRates.tier2;
  }

  // Add weight-based pricing
  if (weight > 1) {
    rate += (weight - 1) * 10;
  }

  return {
    success: false,
    fallback: true,
    message: "Using basic serviceability check - full API access required for accurate rates",
    available_courier_companies: FALLBACK_SHIPROCKET_DATA.couriers.map(courier => ({
      courier_company_id: courier.id,
      courier_name: courier.name,
      rate: rate,
      estimated_delivery_days: tier === 'metro' ? "2-3" : tier === 'tier1' ? "3-4" : "4-7",
      cod_available: courier.cod
    }))
  };
}

// Example usage in your existing functions:
exports.getShiprocketWalletBalance = async (req, res) => {
  try {
    const tokenData = await getShiprocketTokenWithFallback();
    
    if (!tokenData.hasFullAccess) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: "Wallet balance requires API upgrade. Contact Shiprocket support.",
        data: {
          balance: "Contact support for balance",
          limitations: tokenData.limitations
        }
      });
    }
    
    // Your existing wallet balance logic here
    
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Unable to fetch wallet balance",
      fallback: true
    });
  }
};

module.exports = {
  getShiprocketTokenWithFallback,
  getCourierListWithFallback,
  checkServiceabilityWithFallback,
  getFallbackServiceability,
  FALLBACK_SHIPROCKET_DATA
};
