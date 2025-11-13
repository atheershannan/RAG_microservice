# Verify Deployment Status

## מה לבדוק עכשיו:

### 1. בדוק אם השרת רץ
ב-Railway, לך ל-Deployments → Latest → Logs

חפש:
- ✅ `[INFO] Starting server...`
- ✅ `info: Server running on port 8080`
- ✅ `info: Query endpoint: http://localhost:8080/api/v1/query`

אם אתה רואה את זה - השרת רץ! 🎉

### 2. בדוק אם Migrations הסתיימו
חפש:
- ✅ `✅ Migrations deployed successfully`
- ❌ `Migration deploy failed`
- ❌ `ETIMEDOUT`
- ❌ `extension vector does not exist`

### 3. בדוק את Health Endpoint
נסה לגשת ל:
```
https://[YOUR-RAILWAY-URL]/health
```

אם אתה מקבל תשובה - השרת רץ!

### 4. בדוק את Supabase
לך ל-Supabase Dashboard → Table Editor

ודא שיש טבלאות:
- `tenants`
- `queries`
- `vector_embeddings`
- `knowledge_graph_nodes`
- וכו'...

### 5. אם Migrations לא הסתיימו

#### אופציה A: הרץ ידנית
```bash
railway run cd BACKEND && npm run db:migrate:deploy
```

#### אופציה B: בדוק סטטוס
```bash
railway run cd BACKEND && npx prisma migrate status --schema=../DATABASE/prisma/schema.prisma
```

#### אופציה C: הפעל pgvector ב-Supabase
אם יש שגיאה `extension vector does not exist`:
1. לך ל-Supabase Dashboard → SQL Editor
2. הרץ:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. נסה שוב

## מה לעשות אם השרת לא רץ:

### 1. בדוק את הלוגים המלאים
ב-Railway → Deployments → Latest → View Logs

חפש שגיאות:
- `Error: @prisma/client did not initialize`
- `ECONNREFUSED`
- `ETIMEDOUT`
- `relation already exists`

### 2. בדוק Environment Variables
ודא שיש:
- ✅ `DATABASE_URL` - מוגדר
- ⚠️ `NODE_ENV` - מוגדר (אופציונלי)
- ⚠️ `OPENAI_API_KEY` - מוגדר (אופציונלי)

### 3. נסה Redeploy
ב-Railway → Deployments → Redeploy

## סימנים שהכל עובד:

✅ **השרת רץ:**
```
info: Server running on port 8080
info: Query endpoint: http://localhost:8080/api/v1/query
```

✅ **Migrations הסתיימו:**
```
✅ Migrations deployed successfully
```

✅ **Health check עובד:**
```
GET /health → 200 OK
```

✅ **טבלאות קיימות ב-Supabase:**
- tenants
- queries
- vector_embeddings
- וכו'...

## אם הכל עובד:

🎉 **מצוין!** השרת רץ והטבלאות נוצרו.

עכשיו אתה יכול:
1. לבדוק את Health endpoint
2. לנסות לשלוח query ל-`/api/v1/query`
3. לבדוק את הטבלאות ב-Supabase

