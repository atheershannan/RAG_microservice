# איך להריץ Seed ב-Railway (ענן)

המידע לא נמצא ב-Supabase כי **seed לא רץ** בענן.

---

## 🔍 הבעיה

מהלוגים של Railway:
- ✅ Migrations רץ בהצלחה
- ❌ **אין הודעה על seed**
- ❌ אין רשומות ב-`vector_embeddings`

---

## ✅ פתרון: הרצת Seed ב-Railway

### שיטה 1: דרך Railway CLI (מומלץ)

#### שלב 1: התקן Railway CLI

```bash
npm install -g @railway/cli
```

#### שלב 2: התחבר

```bash
railway login
```

#### שלב 3: בחר את הפרויקט

```bash
railway link
```

#### שלב 4: הרץ seed

```bash
railway run npm run db:seed
```

או:

```bash
railway run node DATABASE/prisma/seed.js
```

---

### שיטה 2: דרך Railway Dashboard

#### שלב 1: פתח Railway Dashboard

1. לך ל: https://railway.app
2. בחר את הפרויקט שלך
3. בחר את השירות RAG

#### שלב 2: פתח Shell

1. לחץ על **Deployments**
2. בחר את ה-deployment האחרון
3. לחץ על **View Logs**
4. לחץ על **Shell** (או **Terminal**)

#### שלב 3: הרץ seed

```bash
npm run db:seed
```

או:

```bash
node DATABASE/prisma/seed.js
```

---

### שיטה 3: דרך Supabase SQL Editor (ידני)

אם לא יכול להריץ seed, אפשר להזין את המידע ידנית:

#### שלב 1: בדוק אם יש tenant

```sql
SELECT * FROM tenants LIMIT 1;
```

#### שלב 2: אם אין tenant, צור אחד

```sql
INSERT INTO tenants (id, domain, name, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'default.local',
  'Default Tenant',
  NOW(),
  NOW()
)
ON CONFLICT (domain) DO NOTHING
RETURNING *;
```

#### שלב 3: הוסף vector embedding ל-"Eden Levi"

```sql
-- קודם כל, צריך tenant_id
WITH tenant AS (
  SELECT id FROM tenants WHERE domain = 'default.local' LIMIT 1
),
-- צור embedding דמה (1536 dimensions)
dummy_embedding AS (
  SELECT array_agg(random()::float)::vector as embedding
  FROM generate_series(1, 1536)
)
INSERT INTO vector_embeddings (
  id,
  tenant_id,
  content_id,
  content_type,
  content_text,
  embedding,
  chunk_index,
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid()::text,
  tenant.id,
  'user:manager-001',
  'user_profile',
  'User Profile: Eden Levi (manager). Department: Engineering. Region: IL. Title: Engineering Manager. Focus: delivery, mentoring, planning.',
  dummy_embedding.embedding,
  0,
  '{"fullName": "Eden Levi", "role": "manager", "department": "Engineering", "region": "IL", "title": "Engineering Manager"}'::jsonb,
  NOW(),
  NOW()
FROM tenant, dummy_embedding
ON CONFLICT DO NOTHING;
```

**⚠️ הערה:** זה יוצר embedding דמה. ל-embedding אמיתי צריך להשתמש ב-OpenAI API.

---

## 🎯 הפתרון המומלץ

**הכי טוב:** להריץ seed דרך Railway CLI או Shell.

### צעדים מהירים:

1. **התקן Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **התחבר והרץ:**
   ```bash
   railway login
   railway link
   railway run npm run db:seed
   ```

---

## 🔍 איך לבדוק ש-Seed רץ

אחרי הרצת seed, בדוק:

```sql
-- כמה רשומות יש עכשיו?
SELECT COUNT(*) FROM vector_embeddings;

-- האם יש "Eden Levi"?
SELECT * FROM vector_embeddings 
WHERE content_text ILIKE '%Eden Levi%';
```

---

## 📋 Checklist

- [ ] התקנתי Railway CLI
- [ ] התחברתי ל-Railway
- [ ] קישרתי את הפרויקט
- [ ] הרצתי `railway run npm run db:seed`
- [ ] בדקתי ב-Supabase שהמידע נוסף
- [ ] בדקתי ש-"Eden Levi" קיים

---

## 🐛 אם Seed נכשל

### שגיאה: "Cannot find module"

**פתרון:**
```bash
railway run npm install
railway run npm run db:seed
```

### שגיאה: "Database connection failed"

**פתרון:**
- בדוק ש-`DATABASE_URL` מוגדר ב-Railway
- בדוק שהחיבור ל-Supabase עובד

### שגיאה: "pgvector extension not found"

**פתרון:**
1. לך ל-Supabase Dashboard > SQL Editor
2. הרץ:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

---

## 💡 טיפים

1. **בדוק את ה-logs** - ב-Railway תראה מה קורה
2. **השתמש ב-Shell** - דרך Railway Dashboard
3. **שמור את ה-DATABASE_URL** - צריך אותו ל-seed

---

**אחרי הרצת seed, הרץ שוב את השאילתה ב-Supabase ותראה את "Eden Levi"!**

