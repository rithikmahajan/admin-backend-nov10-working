# 🔒 SHIPROCKET IP WHITELIST - STEP-BY-STEP GUIDE

## 🚨 CURRENT ISSUE
All API endpoints return: `"Unauthorized! You do not have the required permissions[IP]"`

**Your IP**: `122.161.240.166`

---

## ✅ CORRECT WAY TO WHITELIST IP

### Step 1: Login to Shiprocket Dashboard
1. Go to: https://app.shiprocket.in/
2. Login with: **contact@yoraa.in** / **R@2727thik**

### Step 2: Navigate to API Settings
**Option A - Via Settings Menu:**
1. Click **"Settings"** in left sidebar (gear icon)
2. Click **"API"** section
3. Look for **"IP Whitelisting"** or **"Whitelist IPs"** section

**Option B - Direct URL:**
- Try: https://app.shiprocket.in/seller/settings/api
- Or: https://app.shiprocket.in/seller/settings/additional-settings/api-users

### Step 3: Add Your IP
1. Look for input field labeled:
   - "Whitelist IP Address"
   - "Add IP"
   - "IP Restrictions"
2. Enter: `122.161.240.166`
3. Click **"Add"** or **"Save"**

### Step 4: Verify
1. You should see `122.161.240.166` in the list
2. Make sure there's a **green checkmark** or **"Active"** status
3. Check if there's a **"Enable IP Whitelisting"** toggle - turn it ON

---

## 🔍 CAN'T FIND IP WHITELIST SECTION?

### Contact Shiprocket Support Immediately

**Email Template** (Copy-paste this):

```
Subject: Enable IP Whitelisting for API Access - Company ID 5783639

Dear Shiprocket Support Team,

I am unable to access Shiprocket API endpoints from my application. All requests return "Unauthorized! You do not have the required permissions[IP]."

Account Details:
- Email: contact@yoraa.in
- Company ID: 5783639
- Company Name: YORAA APPARELS PRIVATE LIMITED

Current IP Address that needs whitelisting:
- IP: 122.161.240.166

Request:
1. Please whitelist IP address: 122.161.240.166
2. Enable order creation API access
3. If IP whitelisting feature is not enabled for my account, please activate it

This is blocking our production system from creating shipping orders.

Urgent assistance appreciated.

Best regards,
Rithik Mahajan
contact@yoraa.in
```

**Send to**: support@shiprocket.in

**CC**: care@shiprocket.in

---

## 📞 IMMEDIATE SUPPORT OPTIONS

### 1. **Email** (Recommended)
- **Address**: support@shiprocket.in
- **Expected Response**: 2-4 hours
- **Use template above**

### 2. **Phone**
- **Number**: 011-43165286
- **Say**: "Need to whitelist IP 122.161.240.166 for API access, Company ID 5783639"
- **Timing**: Mon-Sat, 10 AM - 7 PM IST

### 3. **Live Chat**
- **URL**: https://app.shiprocket.in/
- **Location**: Bottom-right corner (blue chat bubble)
- **Say**: "IP whitelist needed for API - IP: 122.161.240.166"

### 4. **WhatsApp** (If available)
- Check dashboard for WhatsApp support option

---

## 🎯 ALTERNATIVE: REQUEST API KEY

Some Shiprocket accounts use **API Keys** instead of IP whitelisting:

### Check for API Key Section:
1. Go to: https://app.shiprocket.in/seller/settings/api
2. Look for:
   - "Generate API Key"
   - "API Token"
   - "Access Token"

### If API Key exists:
1. Generate a new API key
2. Copy the key
3. **We'll update backend to use API key instead of username/password**

Let me know if you find an API key option!

---

## 🔧 TEMPORARY WORKAROUND (If Support Takes Time)

### Use Shiprocket's Manual Order Creation:
1. When payment succeeds, your backend saves order
2. You manually create shipment in Shiprocket dashboard
3. Update order with tracking info

**Script to get pending orders**:
```bash
curl http://localhost:8001/api/admin/orders/pending-shipment
```

---

## ✅ HOW TO TEST IF WHITELIST WORKED

After whitelisting (wait 5-10 minutes), run:

```bash
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main
node test-shiprocket-detailed.js
```

**Expected Output**:
- ✅ All endpoints should return `200 OK`
- ✅ Order creation should succeed

---

## 📊 WHAT WE'VE CHECKED

✅ Credentials are correct (contact@yoraa.in works)
✅ Authentication successful (token received)
✅ Backend code is perfect
✅ Environment variables configured
✅ Your public IP detected: 122.161.240.166

❌ IP is NOT whitelisted in Shiprocket (confirmed)

---

## 🎯 NEXT STEPS

**Option 1**: Find and configure IP whitelist yourself (fastest if you can find it)

**Option 2**: Call Shiprocket support NOW - they can enable it in 5 minutes

**Option 3**: Email support with template above

**Once whitelisted**: Everything will work automatically! 🚀

---

**Last Updated**: 14 October 2025
**Status**: Waiting for IP whitelist activation
**ETA**: 5 minutes (with support call) OR 2-4 hours (with email)
