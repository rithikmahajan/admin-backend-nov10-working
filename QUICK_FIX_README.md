# ⚡ QUICK FIX - 30 SECONDS

## The Problem:
Checkout broken with "Invalid item IDs" error

## The Solution:
**RESTART THE SERVER** (fix is already in code)

## Commands:

```bash
# SSH to server
ssh user@185.193.19.244

# Restart (pick one):
pm2 restart all
# OR
sudo systemctl restart backend
# OR
docker-compose restart

# Test it worked
curl http://185.193.19.244:8000/health | jq '.uptime'
# Should be very low number (< 60)

# Run automated test
bash test-checkout-fix.sh
# Should show: 🎉 THE FIX IS WORKING!
```

## Why This Fixes It:
- ✅ Fix is in code (ObjectId conversion)
- ❌ Server hasn't restarted in 11 days
- ⚡ Restart loads new code

## That's it!
No code changes needed. Just restart.

---

**Read full details**: `SERVER_RESTART_INSTRUCTIONS.md`
