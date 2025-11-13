# How to Disable Redis on Railway

If you're seeing Redis connection errors on Railway, you can disable Redis completely:

## Option 1: Set Environment Variable (Recommended)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add a new variable:
   - **Name:** `REDIS_ENABLED`
   - **Value:** `false`
5. Redeploy your service

## Option 2: Remove REDIS_URL

If you don't have Redis set up on Railway:
1. Go to **Variables** tab
2. Remove or comment out `REDIS_URL` variable
3. Add `REDIS_ENABLED=false`
4. Redeploy

## What Happens?

- ✅ Service will work perfectly without Redis
- ✅ No connection errors
- ✅ No spam in logs
- ⚠️ Queries will be slower (no caching)
- ⚠️ Higher OpenAI API costs (no cache)

## Current Behavior

The service is now configured to:
- Try to connect to Redis once
- If connection fails, stop trying immediately
- Log only one warning message
- Continue working without Redis

But if you want **zero errors**, set `REDIS_ENABLED=false` in Railway.

