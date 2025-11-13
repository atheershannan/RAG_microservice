# Prisma Client Location Fix

## Problem
Prisma Client was being generated in the root `node_modules` but the backend code was looking for it in `BACKEND/node_modules/.prisma/client`.

## Solution
Updated `DATABASE/prisma/schema.prisma` to specify the output path:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../BACKEND/node_modules/.prisma/client"
}
```

This ensures Prisma Client is generated in the correct location where the backend code expects it.

## Migration Timeout Fix
Also increased migration timeout from 3 minutes to 5 minutes to handle slow Supabase connections.

## If Issues Persist

If Prisma Client still can't be found:

1. **Check build command in Railway:**
   ```
   npm install && cd BACKEND && npm run db:generate
   ```

2. **Or add to package.json scripts:**
   ```json
   "postinstall": "cd BACKEND && npm run db:generate"
   ```

3. **Manual generation:**
   ```bash
   cd BACKEND
   npm run db:generate
   ```

