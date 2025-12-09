# מדריך הגדרת Supabase Project חדש

## הבעיה הנוכחית

השגיאה מצביעה על כך ש-Prisma לא יכול להגיע לשרת ה-Database:
```
Error: P1001: Can't reach database server at `db.iufjkhxqlkyxiigbetmn.supabase.co:5432`
```

## סיבות אפשריות

1. **DATABASE_URL משתמש ב-Direct Connection** (port 5432) שלא נגיש מ-Railway
2. **חסר `sslmode=require`** ב-DATABASE_URL
3. **pgvector extension לא מופעל** ב-Supabase
4. **IP Allowlist** חוסם את החיבור מ-Railway

## פתרון שלב אחר שלב

### שלב 1: הפעל pgvector Extension ב-Supabase

**חשוב מאוד:** יש להפעיל את ה-extension לפני הרצת המיגרציות!

1. לך ל-**Supabase Dashboard**
2. פתח **SQL Editor**
3. הרץ את הפקודה הבאה:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

4. לחץ **Run** או **Ctrl+Enter**

**✅ זה מפעיל את pgvector extension - נדרש לחיפוש וקטורי**

### שלב 2: קבל את ה-DATABASE_URL הנכון

**מומלץ: השתמש ב-Pooler URL (port 6543)**

1. לך ל-**Supabase Dashboard**
2. **Settings** → **Database**
3. גלול למטה ל-**Connection string**
4. בחר **URI** תחת **Connection pooling** (לא Direct connection)
5. **בחר Session pooler** (לא Transaction pooler!) - זה חשוב למיגרציות!
   - Transaction pooler יכול לגרום לבעיות עם Prisma migrations
   - Session pooler עובד מצוין עם מיגרציות
6. העתק את ה-URL

**הפורמט צריך להיות:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**חשוב:**
- ✅ Port **6543** (pooler) - לא 5432!
  - ⚠️ אם אתה רואה port 5432, זה Direct connection, לא Pooler!
  - ⚠️ **Transaction pooler** ו-**Session pooler** - שניהם משתמשים ב-port **6543**
  - ⚠️ ההבדל הוא בסוג ה-pooler, לא ב-port!
- ✅ `pooler.supabase.com` - לא `db.supabase.co`
- ✅ `?sslmode=require` בסוף (חובה!)
- ✅ **Session pooler** (לא Transaction pooler) - קריטי למיגרציות!
  - ⚠️ גם Transaction וגם Session pooler נראים אותו דבר ב-URL (port 6543)
  - ⚠️ ההבדל הוא רק ב-Supabase Dashboard - איזה סוג pooler בחרת

**⚠️ אם קיבלת URL עם port 5432:**
- זה לא Session pooler - זה Direct connection
- חזור ל-Supabase Dashboard ובחר שוב Session pooler
- או ראה: `DATABASE/FIX_DATABASE_URL.md` לתיקון ידני

**⚠️ למה לא Transaction pooler?**
- Transaction pooler מיועד ל-serverless functions עם חיבורים קצרים
- Prisma migrations דורשות prepared statements שלא עובדים טוב עם Transaction pooler
- Session pooler תומך ב-prepared statements ומתאים למיגרציות

### שלב 3: עדכן את DATABASE_URL ב-Railway

1. לך ל-**Railway Dashboard**
2. בחר את ה-**Service** שלך
3. **Variables** → **Raw Editor** (או לחץ על ה-Variable)
4. מצא את `DATABASE_URL`
5. החלף את הערך ב-URL החדש מ-Supabase
6. **שמור**

**אם אין DATABASE_URL:**
1. לחץ **+ New Variable**
2. שם: `DATABASE_URL`
3. ערך: ה-URL מ-Supabase
4. **Add**

### שלב 4: בדוק את החיבור

אחרי ששמרת את ה-DATABASE_URL, בדוק את החיבור:

#### אופציה A: סקריפט בדיקה מקיף (מומלץ)

```bash
railway run node DATABASE/VERIFY_SUPABASE_CONNECTION.js
```

הסקריפט יבדוק:
- ✅ DATABASE_URL תקין
- ✅ חיבור ל-Database
- ✅ pgvector extension מופעל
- ✅ סטטוס מיגרציות
- ✅ קיום טבלאות

#### אופציה B: בדיקה מהירה

```bash
railway run cd BACKEND && npx prisma db pull --schema=../DATABASE/prisma/schema.prisma
```

אם זה עובד - החיבור תקין! ✅

### שלב 5: הרץ מיגרציות ידנית (אם נדרש)

אם המיגרציות האוטומטיות לא עובדות, תוכל להריץ אותן ידנית:

#### אופציה A: דרך Railway CLI

```bash
railway run cd BACKEND && npm run db:migrate:deploy
```

#### אופציה B: דרך Supabase SQL Editor

1. לך ל-**Supabase Dashboard** → **SQL Editor**
2. פתח את הקבצים ב-`DATABASE/prisma/migrations/`:
   - `20250101000000_init/migration.sql` - יוצר את כל הטבלאות
   - `20250101000001_add_pgvector/migration.sql` - יוצר GIN indexes
   - `20250101000002_add_hnsw_index/migration.sql` - **יוצר HNSW index** (חשוב!)
   - `20250101000003_add_microservices/migration.sql` - מוסיף טבלת microservices
3. הרץ כל קובץ בסדר (אם יש שגיאות, דלג עליהן - אולי כבר קיימות)
4. אחרי זה, סמן את המיגרציות כ-applied:

```bash
railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000000_init --schema=../DATABASE/prisma/schema.prisma
railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000001_add_pgvector --schema=../DATABASE/prisma/schema.prisma
railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000002_add_hnsw_index --schema=../DATABASE/prisma/schema.prisma
railway run cd BACKEND && npx prisma migrate resolve --applied 20250101000003_add_microservices --schema=../DATABASE/prisma/schema.prisma
```

**⚠️ חשוב:** המיגרציה `20250101000002_add_hnsw_index` יוצרת את ה-HNSW index - זה קריטי לביצועים של חיפוש וקטורי!

#### אופציה C: db push (לפיתוח בלבד)

**אזהרה:** זה לא יוצר migration history, אבל זה עובד:

```bash
railway run cd BACKEND && npx prisma db push --schema=../DATABASE/prisma/schema.prisma --accept-data-loss
```

### שלב 6: בדוק שהמיגרציות הצליחו

```bash
railway run cd BACKEND && npx prisma migrate status --schema=../DATABASE/prisma/schema.prisma
```

צריך לראות:
```
Database schema is up to date!
```

## בדיקות נוספות

### בדוק שהטבלאות נוצרו

```bash
railway run cd BACKEND && npx prisma studio --schema=../DATABASE/prisma/schema.prisma
```

או דרך Supabase Dashboard → **Table Editor** - צריך לראות את הטבלאות:
- `tenants`
- `queries`
- `vector_embeddings`
- וכו'

### בדוק את pgvector

```sql
-- ב-Supabase SQL Editor
SELECT * FROM pg_extension WHERE extname = 'vector';
```

צריך לראות שורה עם `vector`.

### בדוק את HNSW Index

```sql
-- ב-Supabase SQL Editor
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'vector_embeddings' 
  AND indexdef LIKE '%hnsw%';
```

צריך לראות את האינדקס `idx_vector_embeddings_embedding_hnsw`.

**אם האינדקס לא קיים**, הרץ ידנית:

```sql
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding_hnsw 
ON vector_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**הערה:** יצירת האינדקס יכולה לקחת כמה דקות אם יש כבר נתונים בטבלה. בטבלה ריקה זה אמור להיות מהיר.

## פתרון בעיות

### עדיין מקבל "Can't reach database server"

1. **בדוק את ה-DATABASE_URL:**
   - ודא שזה pooler URL (port 6543)
   - ודא שיש `?sslmode=require`
   - ודא שהסיסמה נכונה

2. **נסה Direct Connection:**
   - אם pooler לא עובד, נסה direct connection (port 5432)
   - אבל זה דורש IP allowlist או VPN

3. **בדוק Supabase Project Status:**
   - ודא שה-project פעיל
   - בדוק אם יש הגבלות על החיבור

### "extension vector does not exist"

**פתרון:** הפעל את ה-extension ב-Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "relation already exists"

**פתרון:** הטבלאות כבר קיימות. סמן את המיגרציות כ-applied (ראה שלב 5, אופציה B).

### Migration hangs או timeout

**פתרון:**
1. השתמש ב-Session Mode Pooler (לא Transaction Mode)
2. או הרץ מיגרציות ידנית דרך Supabase SQL Editor

## סיכום - צעדים מהירים

1. ✅ הפעל `CREATE EXTENSION IF NOT EXISTS vector;` ב-Supabase SQL Editor
2. ✅ קבל Pooler URL (Session Mode) מ-Supabase Dashboard
3. ✅ עדכן DATABASE_URL ב-Railway עם ה-URL החדש
4. ✅ בדוק חיבור: `railway run cd BACKEND && npx prisma db pull --schema=../DATABASE/prisma/schema.prisma`
5. ✅ הרץ מיגרציות: `railway run cd BACKEND && npm run db:migrate:deploy`
6. ✅ בדוק סטטוס: `railway run cd BACKEND && npx prisma migrate status --schema=../DATABASE/prisma/schema.prisma`
7. ✅ **ודא ש-HNSW index נוצר** (ראה "בדוק את HNSW Index" למעלה)

## קישורים שימושיים

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Migrate Deploy](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production#production-and-testing-environments)
- [pgvector Extension](https://github.com/pgvector/pgvector)

