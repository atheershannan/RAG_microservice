# Manual Migration Steps - Railway

## המצב:
- ✅ pgvector הופעל ב-Supabase
- ✅ השרת רץ
- ❌ Migrations נכשלו עם ETIMEDOUT (timeout)

## פתרון: הרץ Migrations ידנית

### אופציה 1: Railway CLI (מומלץ)

```bash
railway run cd BACKEND && npm run db:migrate:deploy
```

או:

```bash
railway run cd BACKEND && npx prisma migrate deploy --schema=../DATABASE/prisma/schema.prisma
```

### אופציה 2: Supabase SQL Editor (אם Railway לא עובד)

1. לך ל-Supabase Dashboard → SQL Editor

2. העתק את תוכן `DATABASE/prisma/migrations/20250101000000_init/migration.sql`
   - זה יוצר את כל הטבלאות (11 טבלאות)

3. הרץ ב-Supabase SQL Editor

4. העתק את תוכן `DATABASE/prisma/migrations/20250101000001_add_pgvector/migration.sql`
   - זה יוצר indexes ו-constraints

5. הרץ ב-Supabase SQL Editor

6. סמן migrations כ-applied ב-Railway:
   ```bash
   railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000000_init --schema=../DATABASE/prisma/schema.prisma
   railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000001_add_pgvector --schema=../DATABASE/prisma/schema.prisma
   ```

### אופציה 3: הגדל Timeout (אם רוצה לנסות שוב)

אם רוצה לנסות להריץ אוטומטית שוב, צריך להגדיל את ה-timeout עוד יותר.

## בדיקה אחרי Migrations:

### 1. בדוק אם הטבלאות נוצרו
ב-Supabase → Table Editor, ודא שיש:
- ✅ tenants
- ✅ queries
- ✅ query_sources
- ✅ query_recommendations
- ✅ vector_embeddings
- ✅ knowledge_graph_nodes
- ✅ knowledge_graph_edges
- ✅ access_control_rules
- ✅ user_profiles
- ✅ audit_logs
- ✅ cache_entries

### 2. בדוק אם pgvector extension קיים
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 3. בדוק אם HNSW index נוצר
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'vector_embeddings' AND indexname LIKE '%hnsw%';
```

## אם יש שגיאות:

### "relation already exists"
- הטבלאות כבר קיימות
- סמן migrations כ-applied (אופציה 2, שלב 6)

### "extension vector does not exist"
- pgvector לא הופעל
- הרץ: `CREATE EXTENSION IF NOT EXISTS vector;`

### "permission denied"
- צריך להשתמש ב-Service Role Key
- בדוק את DATABASE_URL ב-Railway

