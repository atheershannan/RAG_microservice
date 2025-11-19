# איך לבדוק אם המידע נמצא ב-Supabase

מדריך לבדיקת קיום המידע ב-Supabase לפני ששואלים את RAG.

---

## 🔍 שיטה 1: סקריפט בדיקה אוטומטי

### הרצת הסקריפט

```bash
cd BACKEND
npm run check:data
```

### חיפוש ספציפי

```bash
# חיפוש "Eden Levi"
npm run check:data:search "Eden Levi"

# חיפוש לפי סוג תוכן
npm run check:data:search "user_profile"

# חיפוש כללי
npm run check:data:search "manager"
```

### מה הסקריפט בודק:

1. ✅ **סה"כ רשומות** - כמה רשומות יש ב-`vector_embeddings`
2. ✅ **פילוח לפי סוג תוכן** - כמה רשומות מכל סוג
3. ✅ **פרופילי משתמשים** - כל הפרופילים הקיימים
4. ✅ **חיפוש טקסטואלי** - חיפוש בשדה `content_text`
5. ✅ **חיפוש במטא-דאטה** - חיפוש ב-JSON metadata
6. ✅ **בדיקת embeddings** - האם יש embeddings תקינים

---

## 🔍 שיטה 2: בדיקה ישירה ב-Supabase Dashboard

### שלב 1: התחברות ל-Supabase

1. פתח את [Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**Table Editor**

### שלב 2: בדיקת הטבלה `vector_embeddings`

1. מצא את הטבלה `vector_embeddings`
2. לחץ עליה לפתיחה
3. בדוק את הרשומות

### שלב 3: חיפוש ספציפי

**בדיקת "Eden Levi":**

```sql
SELECT 
  id,
  content_id,
  content_type,
  content_text,
  metadata
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
SELECT 
  content_id,
  content_text,
  metadata,
  created_at
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY created_at DESC;
```

**בדיקת מטא-דאטה:**

```sql
SELECT 
  content_id,
  content_text,
  metadata
FROM vector_embeddings
WHERE metadata::text ILIKE '%Eden%' OR
      metadata::text ILIKE '%Levi%';
```

---

## 🔍 שיטה 3: בדיקה דרך Prisma Studio

### הרצת Prisma Studio

```bash
cd BACKEND
npm run db:studio
```

### שלבים:

1. Prisma Studio יפתח בדפדפן
2. בחר את הטבלה `VectorEmbedding`
3. חפש לפי:
   - `contentId` - חיפוש לפי ID
   - `contentType` - סינון לפי סוג
   - `contentText` - חיפוש בטקסט

---

## 🔍 שיטה 4: בדיקה דרך API

### בדיקה ישירה דרך Prisma Client

צור קובץ בדיקה:

```javascript
// test-check.js
import { getPrismaClient } from './src/config/database.config.js';

async function check() {
  const prisma = await getPrismaClient();
  
  // חיפוש "Eden Levi"
  const results = await prisma.vectorEmbedding.findMany({
    where: {
      OR: [
        { contentText: { contains: 'Eden Levi', mode: 'insensitive' } },
        { contentId: { contains: 'eden', mode: 'insensitive' } },
      ]
    }
  });
  
  console.log('Found:', results.length);
  results.forEach(r => {
    console.log(r.contentId, ':', r.contentText.substring(0, 100));
  });
  
  await prisma.$disconnect();
}

check();
```

הרץ:
```bash
node test-check.js
```

---

## 🎯 מה לבדוק אם RAG לא מוצא תשובה

### 1. האם המידע קיים ב-Supabase?

```sql
-- בדוק אם יש רשומות בכלל
SELECT COUNT(*) FROM vector_embeddings;

-- בדוק אם יש פרופילי משתמשים
SELECT COUNT(*) FROM vector_embeddings 
WHERE content_type = 'user_profile';

-- בדוק אם יש "Eden Levi"
SELECT * FROM vector_embeddings 
WHERE content_text ILIKE '%Eden Levi%';
```

### 2. האם המידע מוטמע (embedded)?

```sql
-- בדוק אם יש embeddings תקינים
SELECT 
  content_id,
  content_type,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding, 1) = 1536 THEN '✅ Valid embedding'
    ELSE '⚠️ Invalid dimension'
  END as embedding_status
FROM vector_embeddings
WHERE content_type = 'user_profile'
LIMIT 10;
```

### 3. האם המידע נכון?

```sql
-- בדוק את התוכן בפועל
SELECT 
  content_id,
  content_text,
  metadata
FROM vector_embeddings
WHERE content_id LIKE '%manager%' OR
      content_id LIKE '%eden%';
```

---

## 🐛 פתרון בעיות נפוצות

### בעיה: "לא נמצא מידע"

**סיבות אפשריות:**

1. ❌ **המידע לא הוזן ל-Supabase**
   - **פתרון:** הרץ את תהליך ה-ingestion/embedding
   - **בדוק:** האם יש רשומות ב-`vector_embeddings`?

2. ❌ **המידע לא מוטמע (embedded)**
   - **פתרון:** הרץ את תהליך ה-embedding
   - **בדוק:** האם יש embeddings תקינים?

3. ❌ **המידע בשם אחר**
   - **פתרון:** בדוק את `content_id` בפועל
   - **בדוק:** האם השם תואם למה שאתה מחפש?

4. ❌ **המידע בטבלה אחרת**
   - **פתרון:** בדוק אם המידע ב-`users` או טבלה אחרת
   - **פתרון:** צריך להזין את המידע ל-`vector_embeddings`

### בעיה: "נמצא אבל RAG לא מוצא"

**סיבות אפשריות:**

1. ⚠️ **Similarity score נמוך מדי**
   - **פתרון:** בדוק את ה-threshold ב-`queryProcessing.service.js`
   - **ברירת מחדל:** 0.7

2. ⚠️ **Embedding לא תקין**
   - **פתרון:** בדוק שהמידע מוטמע עם OpenAI embeddings
   - **בדוק:** האם ה-embedding הוא 1536 dimensions?

3. ⚠️ **Query לא מתאים**
   - **פתרון:** נסה שאילתות שונות
   - **טיפ:** השתמש במילות מפתח מהתוכן

---

## 📋 Checklist לבדיקה

לפני ששואלים את RAG, ודא:

- [ ] המידע קיים ב-`vector_embeddings` (בדוק עם SQL)
- [ ] המידע מוטמע (יש embedding תקין)
- [ ] ה-embedding הוא 1536 dimensions
- [ ] ה-`content_text` מכיל את המידע שאתה מחפש
- [ ] ה-`content_id` תואם למה שאתה מחפש
- [ ] ה-`tenant_id` נכון
- [ ] אין שגיאות ב-logs

---

## 🔧 דוגמאות SQL שימושיות

### בדיקת כל הפרופילים

```sql
SELECT 
  content_id,
  LEFT(content_text, 200) as preview,
  metadata
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY created_at DESC;
```

### בדיקת embeddings תקינים

```sql
SELECT 
  content_id,
  content_type,
  array_length(embedding, 1) as embedding_dimensions
FROM vector_embeddings
WHERE embedding IS NOT NULL
LIMIT 10;
```

### חיפוש כללי

```sql
SELECT 
  content_id,
  content_type,
  LEFT(content_text, 150) as preview
FROM vector_embeddings
WHERE content_text ILIKE '%YOUR_SEARCH_TERM%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 💡 טיפים

1. **השתמש בסקריפט האוטומטי** - הכי מהיר ונוח
2. **בדוק ישירות ב-SQL** - הכי מדויק
3. **השתמש ב-Prisma Studio** - הכי ויזואלי
4. **בדוק את ה-logs** - לראות מה RAG מחפש בפועל

---

## 📞 אם עדיין לא עובד

1. **בדוק את ה-logs של RAG:**
   ```bash
   # חפש ב-logs מה RAG מחפש
   grep "vector search" logs/*.log
   ```

2. **בדוק את ה-query בפועל:**
   - פתח את `queryProcessing.service.js`
   - הוסף `console.log` לראות מה נשלח לחיפוש

3. **בדוק את ה-embedding של השאילתה:**
   - ודא שהשאילתה מוטמעת כראוי
   - בדוק שה-embedding הוא 1536 dimensions

---

**עוד שאלות?** בדוק את `QUESTIONS_FOR_SUPABASE_DATA.md` לרשימת שאלות שניתן לשאול.

