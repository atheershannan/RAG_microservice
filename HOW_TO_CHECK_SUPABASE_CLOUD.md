# איך לבדוק מידע ב-Supabase בענן

מדריך לבדיקת מידע ב-Supabase כש-RAG רץ בענן (Railway/Heroku/etc).

---

## 🔍 שיטה 1: Supabase Dashboard (הכי קל)

### שלב 1: התחברות

1. פתח [Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor** (בתפריט השמאלי)

### שלב 2: הרצת שאילתות SQL

**בדיקת "Eden Levi":**

```sql
-- חיפוש "Eden Levi" ב-vector_embeddings
SELECT 
  id,
  content_id,
  content_type,
  LEFT(content_text, 200) as text_preview,
  metadata,
  created_at
FROM vector_embeddings
WHERE 
  content_text ILIKE '%Eden Levi%' OR
  content_text ILIKE '%Eden%' OR
  content_text ILIKE '%Levi%' OR
  content_id ILIKE '%eden%' OR
  content_id ILIKE '%manager%'
ORDER BY created_at DESC;
```

**בדיקת כל פרופילי המשתמשים:**

```sql
-- כל הפרופילים
SELECT 
  content_id,
  content_type,
  content_text,
  metadata,
  created_at
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY created_at DESC;
```

**בדיקת סה"כ רשומות:**

```sql
-- כמה רשומות יש בכלל
SELECT 
  content_type,
  COUNT(*) as count
FROM vector_embeddings
GROUP BY content_type
ORDER BY count DESC;
```

**בדיקת embeddings תקינים:**

```sql
-- בדיקה אם יש embeddings תקינים
SELECT 
  content_id,
  content_type,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding, 1) = 1536 THEN '✅ Valid (1536 dims)'
    ELSE '⚠️ Invalid dimensions'
  END as embedding_status,
  array_length(embedding, 1) as dimensions
FROM vector_embeddings
WHERE content_type = 'user_profile'
LIMIT 10;
```

---

## 🔍 שיטה 2: Table Editor (ויזואלי)

### שלבים:

1. ב-Supabase Dashboard, לך ל-**Table Editor**
2. בחר את הטבלה `vector_embeddings`
3. לחץ על **Filter** (סינון)
4. הוסף פילטרים:
   - `content_type` = `user_profile`
   - או `content_text` contains `Eden`
5. לחץ **Apply**

### חיפוש טקסטואלי:

1. בטבלה, לחץ על העמודה `content_text`
2. השתמש ב-**Search** (Ctrl+F / Cmd+F)
3. חפש: `Eden Levi`

---

## 🔍 שיטה 3: דרך RAG API (בדיקה דרך המערכת)

### בדיקה דרך API endpoint

אם יש לך גישה ל-RAG API, תוכל לבדוק כך:

**1. בדיקת health:**

```bash
curl https://your-rag-api.railway.app/api/health
```

**2. בדיקת query (לבדוק מה RAG מוצא):**

```bash
curl -X POST https://your-rag-api.railway.app/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "מה התפקיד של Eden Levi",
    "tenant_id": "default",
    "context": {
      "user_id": "admin-001"
    }
  }'
```

**3. בדיקת logs:**

ב-Railway/Heroku, לך ל-**Logs** ותראה מה RAG מחפש.

---

## 🔍 שיטה 4: Prisma Studio (אם יש גישה)

### אם יש לך גישה ל-SSH או local tunnel:

```bash
# ב-local machine
cd BACKEND
npm run db:studio
```

זה יפתח Prisma Studio בדפדפן עם כל הנתונים.

---

## 🎯 שאילתות SQL מומלצות לבדיקה

### 1. בדיקה כללית - כמה רשומות יש?

```sql
SELECT COUNT(*) as total_records FROM vector_embeddings;
```

### 2. בדיקה לפי סוג תוכן

```sql
SELECT 
  content_type,
  COUNT(*) as count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM vector_embeddings
GROUP BY content_type
ORDER BY count DESC;
```

### 3. חיפוש "Eden Levi" - מלא

```sql
SELECT 
  id,
  content_id,
  content_type,
  content_text,
  metadata,
  CASE 
    WHEN embedding IS NULL THEN 'No embedding'
    WHEN array_length(embedding, 1) = 1536 THEN 'Valid'
    ELSE 'Invalid'
  END as embedding_status,
  created_at
FROM vector_embeddings
WHERE 
  content_text ILIKE '%Eden Levi%' OR
  content_text ILIKE '%Eden%Levi%' OR
  content_id ILIKE '%eden%' OR
  content_id ILIKE '%manager-001%' OR
  metadata::text ILIKE '%Eden%' OR
  metadata::text ILIKE '%Levi%'
ORDER BY created_at DESC;
```

### 4. בדיקת כל המשתמשים

```sql
SELECT 
  content_id,
  LEFT(content_text, 150) as preview,
  metadata->>'name' as name,
  metadata->>'role' as role,
  metadata->>'department' as department,
  created_at
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY created_at DESC;
```

### 5. בדיקת embeddings חסרים

```sql
SELECT 
  content_id,
  content_type,
  LEFT(content_text, 100) as preview
FROM vector_embeddings
WHERE embedding IS NULL
ORDER BY created_at DESC;
```

### 6. בדיקת embeddings לא תקינים

```sql
SELECT 
  content_id,
  content_type,
  array_length(embedding, 1) as dimensions
FROM vector_embeddings
WHERE embedding IS NOT NULL 
  AND array_length(embedding, 1) != 1536
LIMIT 10;
```

---

## 🐛 פתרון בעיות - אם לא נמצא "Eden Levi"

### שלב 1: בדוק אם יש בכלל פרופילי משתמשים

```sql
SELECT COUNT(*) 
FROM vector_embeddings 
WHERE content_type = 'user_profile';
```

**אם התוצאה היא 0:**
- ❌ אין פרופילי משתמשים ב-`vector_embeddings`
- ✅ **פתרון:** צריך להריץ את תהליך ה-seed/ingestion

### שלב 2: בדוק אם יש "manager" או "Eden"

```sql
SELECT content_id, content_text
FROM vector_embeddings
WHERE content_text ILIKE '%manager%' OR
      content_text ILIKE '%Eden%'
LIMIT 10;
```

**אם לא נמצא:**
- ❌ המידע לא הוזן
- ✅ **פתרון:** בדוק את `seed.js` והרץ אותו שוב

### שלב 3: בדוק את seed.js

פתח `DATABASE/prisma/seed.js` ובדוק:
- האם יש יצירה של `user_profile` עבור "Eden Levi"?
- האם ה-`content_id` נכון?
- האם ה-`content_text` מכיל את השם?

---

## 📋 Checklist לבדיקה בענן

- [ ] התחברתי ל-Supabase Dashboard
- [ ] הרצתי שאילתת SQL לבדיקת "Eden Levi"
- [ ] בדקתי כמה רשומות יש ב-`vector_embeddings`
- [ ] בדקתי כמה פרופילי משתמשים יש
- [ ] בדקתי אם יש embeddings תקינים
- [ ] בדקתי את ה-logs של RAG (ב-Railway/Heroku)
- [ ] בדקתי את seed.js אם המידע צריך להיות שם

---

## 💡 טיפים

1. **השתמש ב-SQL Editor** - הכי מהיר ונוח
2. **שמור שאילתות** - ב-Supabase Dashboard יש אפשרות לשמור שאילתות
3. **בדוק את ה-logs** - ב-Railway/Heroku תראה מה RAG מחפש בפועל
4. **השתמש ב-Filter** - ב-Table Editor קל יותר לסנן

---

## 🚀 דוגמה: בדיקה מלאה של "Eden Levi"

הרץ את השאילתה הזו ב-SQL Editor:

```sql
-- בדיקה מלאה של "Eden Levi"
WITH search_results AS (
  SELECT 
    id,
    content_id,
    content_type,
    content_text,
    metadata,
    CASE 
      WHEN embedding IS NULL THEN '❌ No embedding'
      WHEN array_length(embedding, 1) = 1536 THEN '✅ Valid embedding'
      ELSE '⚠️ Invalid dimensions'
    END as embedding_status,
    created_at
  FROM vector_embeddings
  WHERE 
    content_text ILIKE '%Eden Levi%' OR
    content_text ILIKE '%Eden%' OR
    content_text ILIKE '%Levi%' OR
    content_id ILIKE '%eden%' OR
    content_id ILIKE '%manager%' OR
    metadata::text ILIKE '%Eden%' OR
    metadata::text ILIKE '%Levi%'
)
SELECT * FROM search_results
ORDER BY 
  CASE 
    WHEN content_text ILIKE '%Eden Levi%' THEN 1
    WHEN content_text ILIKE '%Eden%' THEN 2
    ELSE 3
  END,
  created_at DESC;
```

**אם התוצאה ריקה:**
- המידע לא קיים ב-Supabase
- צריך להריץ seed/ingestion מחדש

---

## 📞 אם עדיין לא עובד

1. **בדוק את ה-logs ב-Railway:**
   - לך ל-Railway Dashboard
   - בחר את השירות RAG
   - לך ל-**Logs**
   - חפש: "vector search" או "Eden"

2. **בדוק את ה-seed:**
   - פתח `DATABASE/prisma/seed.js`
   - בדוק אם יש יצירה של "Eden Levi"
   - אם לא - צריך להוסיף

3. **הרץ seed מחדש:**
   ```bash
   # אם יש לך גישה
   npm run db:seed
   ```

---

**עוד שאלות?** בדוק את `HOW_TO_CHECK_SUPABASE_DATA.md` למידע נוסף.

