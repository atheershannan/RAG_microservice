# ⚡ בדיקה מהירה ב-Supabase - "Eden Levi"

## 🎯 שלבים מהירים

### 1. פתח Supabase Dashboard
- לך ל: https://app.supabase.com
- בחר את הפרויקט שלך
- לחץ על **SQL Editor** (בתפריט השמאלי)

### 2. העתק והדבק את השאילתה הזו:

```sql
-- חיפוש "Eden Levi"
SELECT 
  content_id,
  content_text,
  metadata->>'fullName' as name,
  metadata->>'role' as role,
  metadata->>'title' as title,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding::float[], 1) = 1536 THEN '✅ Valid'
    ELSE '⚠️ Invalid'
  END as embedding_status
FROM vector_embeddings
WHERE 
  content_text ILIKE '%Eden Levi%' OR
  content_id = 'user:manager-001' OR
  metadata::text ILIKE '%Eden%'
ORDER BY created_at DESC;
```

### 3. לחץ **Run** (או F5)

---

## 📊 מה לחפש בתוצאות

### ✅ אם נמצא:
- תראה את `content_text` עם "Eden Levi"
- תראה `embedding_status` = "✅ Valid"
- זה אומר שהמידע קיים ומוטמע!

### ❌ אם לא נמצא:
- התוצאה תהיה ריקה
- זה אומר שהמידע **לא הוזן** ל-Supabase
- **פתרון:** צריך להריץ `npm run db:seed` מחדש

---

## 🔍 שאילתות נוספות

### בדיקת כל הפרופילים:
```sql
SELECT 
  content_id,
  content_text,
  metadata->>'fullName' as name
FROM vector_embeddings
WHERE content_type = 'user_profile';
```

### בדיקת embeddings:
```sql
SELECT 
  content_id,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding, 1) = 1536 THEN '✅ Valid'
    ELSE '⚠️ Invalid'
  END as status
FROM vector_embeddings
WHERE content_type = 'user_profile';
```

---

## 💡 טיפים

1. **שמור את השאילתות** - ב-Supabase יש אפשרות לשמור שאילתות
2. **השתמש ב-Table Editor** - לראות את הנתונים ויזואלית
3. **בדוק את ה-logs** - ב-Railway תראה מה RAG מחפש

---

**קובץ SQL מלא:** ראה `SUPABASE_CHECK_EDEN_LEVI.sql`

