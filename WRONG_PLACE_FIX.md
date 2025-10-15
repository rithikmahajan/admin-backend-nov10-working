# 🚨 CRITICAL: YOU ADDED IP IN WRONG PLACE!

## What You Did (WRONG ❌)
You added IP `122.161.240.166` in:
**Settings → Additional Settings → API Users → Allowed IPs**

This controls **dashboard login access** for the user `support@yoraa.in`
This does **NOT** affect API calls!

---

## What You Need to Do (CORRECT ✅)

You need to add the IP in the **API Integration** settings, NOT the "API Users" settings.

### 🎯 EXACT STEPS:

1. **Close the "API Users" section** (you're done there)

2. **Look in the LEFT SIDEBAR** for one of these:
   - **"Shiprocket Features"** → then click **"API"**
   - OR **"Settings"** → **"API Integration"**
   - OR just **"API"** (standalone menu item)

3. **You should see a page with**:
   - "API Documentation" link
   - "Generate Token" button
   - **"IP Whitelist"** or **"Allowed IPs"** section ← THIS IS WHAT YOU NEED!

4. **In the IP Whitelist section**, add: `122.161.240.166`

---

## 🔍 Can't Find It? Here's Why:

The section might be called:
- "API Settings"
- "API Integration" 
- "Developer Settings"
- "API Access"

It's **DIFFERENT** from "API Users"!

---

## 📞 FASTEST SOLUTION: CALL SUPPORT NOW

Since you're having trouble finding it, just call them:

**Phone**: 011-43165286

**Say**:
> "I need to whitelist IP 122.161.240.166 for API integration. 
> I'm getting 'Unauthorized IP' errors on API calls.
> My Company ID is 5783639, email is contact@yoraa.in.
> Can you help me whitelist it or do it for me?"

**They will**:
- Either guide you to the exact page
- OR whitelist it for you directly (takes 2 minutes)

---

## ⏰ TIMING

It's **7:00 PM IST** - Support might still be available.

If not available now:
- Call tomorrow morning (10 AM IST)
- OR email: support@shiprocket.in tonight (they'll respond in morning)

---

## 📧 EMAIL TEMPLATE (Use If You Can't Call)

```
Subject: Urgent: API IP Whitelist Needed - Company ID 5783639

Dear Shiprocket Support,

I am unable to access Shiprocket API endpoints. All API calls return:
"Unauthorized! You do not have the required permissions[IP]."

Account Details:
- Email: contact@yoraa.in  
- Company ID: 5783639
- Company Name: YORAA APPARELS PRIVATE LIMITED

IP Address to Whitelist:
- 122.161.240.166

Request:
Please whitelist this IP address for API integration access, specifically for order creation endpoint (/orders/create/adhoc).

Note: I already added this IP in "API Users" section but that didn't resolve the API access issue. I believe IP whitelist needs to be configured in the main API integration settings.

This is blocking our production order processing system.

Please assist urgently.

Best regards,
Rithik Mahajan
contact@yoraa.in
7006114695
```

Send to: **support@shiprocket.in**

---

## ✅ TEST AFTER THEY FIX IT

Wait 5-10 minutes after they confirm, then run:

```bash
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main
node test-shiprocket-detailed.js
```

You should see all ✅ green checkmarks!

---

**Current Time**: 7:00 PM IST  
**Support Hours**: Mon-Sat, 10 AM - 7 PM IST  
**Best Action**: Email now, call first thing tomorrow morning  
**Or**: Keep looking for the API Integration section (not API Users!)
